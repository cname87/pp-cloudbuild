import { Component, AfterViewInit, ViewChild } from '@angular/core';
import { ParamMap, Router } from '@angular/router';
import { ActivatedRoute, Data } from '@angular/router';
import { Location } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NGXLogger } from 'ngx-logger';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';

import { ISession, SessionTypeNames } from '../../models/activity-models';
import { RouteStateService } from '../../../app-module/services/route-state-service/router-state.service';
import { routes } from '../../../configuration/configuration';

/**
 * @title This component shows a table detailing all the activities linked to a member.
 */
@Component({
  selector: 'app-activities',
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.scss'],
  providers: [],
})
export class ActivitiesComponent implements AfterViewInit {
  //
  private destroy = new Subject<void>();
  types = SessionTypeNames;

  activities$!: Observable<ISession[]>;
  /* used to unsubscribe */
  #destroy$ = new Subject<void>();
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

  /* define the text info card */
  line1 = '- Click on a cell to edit a value. (Press ESC to cancel)';
  line2 = '- RPE is the Rate of Perceived Exertion of the session';
  line3 = '- Select from 0, for no exertion, to 10, for extreme exertion';
  line4 = '';
  isGoBackVisible = false;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private routeStateService: RouteStateService,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      `${ActivitiesComponent.name}: Starting ActivitiesComponent`,
    );
    /* get the data as supplied from the route resolver */
    this.route.data.pipe(takeUntil(this.destroy)).subscribe((data: Data) => {
      this.dataSource = new MatTableDataSource(data.activities);
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.dataSource.filterPredicate = (session: ISession, filter: string) => {
        return !filter || session.type === filter;
      };
    }),
      /* update route state service with routed member id */
      this.route.paramMap
        .pipe(
          map((paramMap: ParamMap) => {
            const id = paramMap.get('id');
            if (!id) {
              throw new Error('id path parameter was null');
            }
            return id;
          }),
          takeUntil(this.#destroy$),
          catchError(this.#catchError),
        )
        .subscribe((id) => {
          this.routeStateService.updateIdState(id);
        });
  }

  /**
   * Picks up any upstream errors and throws on the error.
   * @param err An error object
   * @throws Throws the received error object
   */
  #catchError = (err: any): never => {
    this.logger.trace(`${ActivitiesComponent.name}: #catchError called`);
    this.logger.trace(`${ActivitiesComponent.name}: Throwing the error on`);
    throw err;
  };

  ngOnDestroy(): void {
    this.logger.trace(`${ActivitiesComponent.name}: #ngDestroy called`);
    this.#destroy$.next();
    this.#destroy$.complete();
    this.routeStateService.updateIdState('');
  }

  getSession(sid: string): void {
    this.router.navigate([routes.activities.path, sid]);
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
