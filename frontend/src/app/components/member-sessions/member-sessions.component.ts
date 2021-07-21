import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { ParamMap, Router } from '@angular/router';
import { ActivatedRoute, Data } from '@angular/router';
import { Location } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';

import { IsLoadingService } from '@service-work/is-loading';
import { NGXLogger } from 'ngx-logger';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { Observable, Subject, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import {
  IMember,
  ISession,
  SessionTypeNames,
} from '../../data-providers/models/models';
import { RouteStateService } from '../../shared/route-state-service/router-state-service';
import { IErrReport, routes } from '../../config';

/**
 * @title This component shows a table detailing all the sessions linked to a member.
 */
@Component({
  selector: 'app-sessions',
  templateUrl: './member-sessions.component.html',
  styleUrls: ['./member-sessions.component.scss'],
  providers: [],
})
export class MemberSessionsComponent implements AfterViewInit {
  //
  private destroy = new Subject<void>();
  private toastrMessage = 'A member access error has occurred';
  types = SessionTypeNames;

  member$!: Observable<IMember>;
  sessions$!: Observable<ISession[]>;
  displayedColumns: string[] = [
    'date',
    'type',
    'score',
    'time',
    'metric',
    'comment',
    'edit',
  ];
  dataSource: MatTableDataSource<ISession> = new MatTableDataSource();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private routeStateService: RouteStateService,
    private isLoadingService: IsLoadingService,
    private logger: NGXLogger,
    private toastr: ToastrService,
  ) {
    this.logger.trace(
      `${MemberSessionsComponent.name}: Starting MemberSessionsComponent`,
    );
    /* get the data as supplied from the route resolver */
    this.route.data.pipe(takeUntil(this.destroy)).subscribe((data: Data) => {
      this.member$ = data.memberAndSessions.member;
      this.sessions$ = data.memberAndSessions.sessions;
    });
    /* loads sessions and fill table */
    this.isLoadingService.add(
      this.sessions$
        .pipe(
          takeUntil(this.destroy),
          map((sessions) => {
            this.logger.trace(
              `${MemberSessionsComponent.name}: Sessions retrieved`,
            );
            return new MatTableDataSource(sessions);
          }),
        )
        .subscribe((dataSource) => {
          this.dataSource = dataSource;
          this.dataSource.paginator = this.paginator;
          this.dataSource.sort = this.sort;
          this.dataSource.filterPredicate = (
            session: ISession,
            filter: string,
          ) => {
            return !filter || session.type === filter;
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
            `${MemberSessionsComponent.name}: catchError called`,
          );

          /* inform user and mark as handled */
          this.toastr.error('ERROR!', this.toastrMessage);
          err.isHandled = true;

          this.logger.trace(
            `${MemberSessionsComponent.name}: Throwing the error on`,
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

  getSession(mid: string, sid: string): void {
    this.router.navigate([
      routes.session.path1,
      mid,
      routes.session.path2,
      sid,
    ]);
  }

  goBack(): void {
    this.location.back();
  }

  ngAfterViewInit() {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (session: ISession, filter: string) => {
      const type = session.type.toLowerCase();
      return !filter || type.startsWith(filter);
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
