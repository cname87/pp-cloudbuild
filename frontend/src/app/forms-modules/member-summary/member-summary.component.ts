import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { ParamMap, ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { MatTableDataSource } from '@angular/material/table';

import { IsLoadingService } from '@service-work/is-loading';
import { NGXLogger } from 'ngx-logger';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { Observable, of, Subject, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import {
  IMember,
  summaryDisplayedColumns,
} from '../../data-providers/models/models';
import { RouteStateService } from '../../common/route-state-service/router-state-service';
import { IErrReport } from '../../common/config';

/* Temporary */
const score: Array<string | number> = ['SCORE', 15, 100];
const load: Array<string | number> = ['LOAD', 55, 140];

const summaryTable: Array<string | number>[] = [score, load];

/**
 * @title This component shows a scrollable table detailing all summary data linked to a member.
 */
@Component({
  selector: 'app-summary',
  templateUrl: './member-summary.component.html',
  styleUrls: ['./member-summary.component.scss'],
  providers: [],
})
export class MemberSummaryComponent implements AfterViewInit {
  //
  private destroy = new Subject<void>();
  private toastrMessage = 'A member access error has occurred';

  member$!: Observable<IMember>;
  summary$!: Observable<Array<string | number>[]>;
  displayedColumns: string[] = summaryDisplayedColumns;
  dataSource: MatTableDataSource<Array<string | number>> =
    new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;

  columns = [
    {
      columnDef: 'item',
      header: 'Item',
      cell: (element: Array<string | number>) => `${element[0]}`,
    },
    {
      columnDef: 'wk1',
      header: 'Week 1',
      cell: (element: Array<string | number>) => `${element[1]}`,
    },
    {
      columnDef: 'wk2',
      header: 'Week 2',
      cell: (element: Array<string | number>) => `${element[2]}`,
    },
    // {
    //   columnDef: 'delta',
    //   header: 'Delta',
    //   cell: (element: IMeasure) => `${element.delta}`,
    // },
    // {
    //   columnDef: 'strain',
    //   header: 'Strain',
    //   cell: (element: IMeasure) => `${element.strain}`,
    // },
    // {
    //   columnDef: 'monotony',
    //   header: 'Monotony',
    //   cell: (element: IMeasure) => `${element.strain}`,
    // },
    // {
    //   columnDef: 'acwr',
    //   header: 'ACWR',
    //   cell: (element: IMeasure) => `${element.acwr}`,
    // },
  ];

  constructor(
    private route: ActivatedRoute,
    private location: Location,
    private routeStateService: RouteStateService,
    private isLoadingService: IsLoadingService,
    private logger: NGXLogger,
    private toastr: ToastrService,
  ) {
    this.logger.trace(
      `${MemberSummaryComponent.name}: Starting MemberSummaryComponent`,
    );
    this.member$ = of({ id: 1, name: 'testMember' });
    this.summary$ = of(summaryTable);
    /* get the data as supplied from the route resolver */
    // this.route.data.pipe(takeUntil(this.destroy)).subscribe((data: Data) => {
    //   this.member$ = data.memberAndSummary.member;
    //   this.summary$ = data.memberAndSummary.questionaires;
    // });
    /* loads summary and fills table */
    this.isLoadingService.add(
      this.summary$
        .pipe(
          takeUntil(this.destroy),
          map((summary) => {
            this.logger.trace(
              `${MemberSummaryComponent.name}: Summary retrieved`,
            );
            return new MatTableDataSource(summary);
          }),
        )
        .subscribe((dataSource) => {
          this.dataSource = dataSource;
          this.dataSource.paginator = this.paginator;
        }),
    );
  }
  ngOnInit() {
    /* update service with routed member id */
    this.route.paramMap
      .pipe(
        map((paramMap: ParamMap) => {
          const id = paramMap.get('id');
          if (!id) {
            throw new Error('id path parameter was null');
          }
          return id;
        }),
        takeUntil(this.destroy),
        catchError((err: IErrReport) => {
          this.logger.trace(
            `${MemberSummaryComponent.name}: catchError called`,
          );

          /* inform user and mark as handled */
          this.toastr.error('ERROR!', this.toastrMessage);
          err.isHandled = true;

          this.logger.trace(
            `${MemberSummaryComponent.name}: Throwing the error on`,
          );
          return throwError(err);
        }),
      )
      .subscribe((id) => this.routeStateService.updateIdState(id));
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
  }

  goBack(): void {
    this.location.back();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
  }
}
