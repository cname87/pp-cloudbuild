import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { ParamMap, Router, ActivatedRoute, Data } from '@angular/router';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { IsLoadingService } from '@service-work/is-loading';
import { NGXLogger } from 'ngx-logger';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { Observable, Subject, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import {
  allFields,
  IMember,
  IQuestionaire,
  displayColumns,
  questionareTable,
} from '../../data-providers/models/models';
import { RouteStateService } from '../../common/route-state-service/router-state-service';
import { IErrReport, routes } from '../../common/config';

/**
 * @title This component shows a table detailing all the questionaires linked to a member.
 */
@Component({
  selector: 'app-questionaires',
  templateUrl: './member-questionaires.component.html',
  styleUrls: ['./member-questionaires.component.scss'],
  providers: [],
})
export class MemberQuestionairesComponent implements AfterViewInit {
  //
  private destroy = new Subject<void>();
  private toastrMessage = 'A member access error has occurred';

  member$!: Observable<IMember>;
  questionaires$!: Observable<IQuestionaire[]>;
  allFields = allFields;
  displayedColumns: string[] = displayColumns;
  questionaireTable = questionareTable;
  dataSource: MatTableDataSource<IQuestionaire> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private routeStateService: RouteStateService,
    private isLoadingService: IsLoadingService,
    private logger: NGXLogger,
    private toastr: ToastrService,
  ) {
    this.logger.trace(
      `${MemberQuestionairesComponent.name}: Starting MemberQuestionairesComponent`,
    );
    /* get the data as supplied from the route resolver */
    this.route.data.pipe(takeUntil(this.destroy)).subscribe((data: Data) => {
      this.member$ = data.memberAndQuestionaires.member;
      this.questionaires$ = data.memberAndQuestionaires.questionaires;
    });
    /* loads questionaires and fill table */
    this.isLoadingService.add(
      this.questionaires$
        .pipe(
          takeUntil(this.destroy),
          map((questionaires) => {
            this.logger.trace(
              `${MemberQuestionairesComponent.name}: Questionaires retrieved`,
            );
            return new MatTableDataSource(questionaires);
          }),
        )
        .subscribe((dataSource) => {
          this.dataSource = dataSource;
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.dataSource.filterPredicate = (
            questionaire: IQuestionaire,
            filter: string,
          ) => {
            return !filter || questionaire.comment === filter;
          };
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
            `${MemberQuestionairesComponent.name}: catchError called`,
          );

          /* inform user and mark as handled */
          this.toastr.error('ERROR!', this.toastrMessage);
          err.isHandled = true;

          this.logger.trace(
            `${MemberQuestionairesComponent.name}: Throwing the error on`,
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

  getQuestionaire(mid: string, qid: string): void {
    this.router.navigate([
      routes.questionaire.path1,
      mid,
      routes.questionaire.path2,
      qid,
    ]);
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (
      questionaire: IQuestionaire,
      filter: string,
    ) => {
      for (const key in questionaire) {
        if (Object.prototype.hasOwnProperty.call(questionaire, key)) {
          return filter === questionaire[key];
        }
      }
      return false;
    };
  }

  applyFilter(value: string) {
    this.dataSource.filter = value;

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  /** Gets the total cost of all transactions. */
  getAverage(parameter: string) {
    const total = this.dataSource.filteredData
      .map((data) => data[parameter])
      .reduce((acc, value) => acc + value, 0);
    return total / this.dataSource.filteredData.length;
  }
}
