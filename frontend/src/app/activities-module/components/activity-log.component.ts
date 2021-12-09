import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Data, ParamMap } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { catchError, map, shareReplay, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';

import { RouteStateService } from '../../app-module/services/route-state-service/router-state.service';
import { ActivitiesService } from '../services/activities.service';
import {
  blankActivityWithoutId,
  IActivity,
  IActivityWithoutId,
} from '../models/activity-models';

/**
 * @title This component shows a form table allowing activities for a member to be viewed and entered or edited.
 */
@Component({
  selector: 'app-activity-log',
  templateUrl: './activity-log.component.html',
  styleUrls: ['./activity-log.component.scss'],
  providers: [],
})
export class ActivityLogComponent implements OnInit, OnDestroy {
  //
  /* member id passed to activities component */
  memberId!: number;
  /* list of activities retrieved from the backend */
  activities!: IActivity[];
  activities$!: Observable<IActivity[]> | undefined;
  /* clicked activity passed to activity component */
  activity: IActivity | IActivityWithoutId | undefined = undefined;
  /* used to unsubscribe */
  #destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private activitiesService: ActivitiesService,
    private routeStateService: RouteStateService,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      `${ActivityLogComponent.name}: Starting ActivityLogComponent`,
    );
  }

  /**
   * Picks up any upstream errors and throws on the error.
   * @param err An error object
   * @throws Throws the received error object
   */
  #catchError = (err: any): never => {
    this.logger.trace(`${ActivityLogComponent.name}: #catchError called`);
    this.logger.trace(`${ActivityLogComponent.name}: Throwing the error on`);
    throw err;
  };

  #getActivities(): Observable<IActivity[]> {
    return this.activitiesService.getActivities(this.memberId).pipe(
      shareReplay(1),
      catchError((err: any) => {
        this.logger.trace(`${ActivityLogComponent.name}: catchError called`);
        this.logger.trace(
          `${ActivityLogComponent.name}: not proceeding and throwing the error to the error handler`,
        );
        throw err;
      }),
    );
  }

  ngOnInit(): void {
    /* get the data as supplied from the route resolver */
    this.activities$ = this.route.data.pipe(
      takeUntil(this.#destroy$),
      map((data: Data) => {
        return data.activities;
      }),
      catchError(this.#catchError),
    );
    /* update route state with member id */
    this.route.paramMap
      .pipe(
        map((paramMap: ParamMap) => {
          const id = paramMap.get('id');
          if (!id) {
            throw new Error('id path parameter was invalid');
          }
          this.memberId = +id;
          return id;
        }),
        takeUntil(this.#destroy$),
        catchError(this.#catchError),
      )
      .subscribe((id) => this.routeStateService.updateIdState(id));
  }

  editActivity(clickedActivity: IActivity): void {
    this.activities$ = undefined;
    this.activity = clickedActivity;
  }

  addActivity(): void {
    this.activities$ = undefined;
    blankActivityWithoutId.memberId = this.memberId;
    this.activity = blankActivityWithoutId;
  }

  doneActivity(): void {
    this.logger.trace(
      `${ActivityLogComponent.name}: Activity added, edited or deleted`,
    );
    this.activities$ = this.#getActivities();
    this.activity = undefined;
  }

  ngOnDestroy(): void {
    this.logger.trace(`${ActivityLogComponent.name}: #ngDestroy called`);
    this.#destroy$.next();
    this.#destroy$.complete();
    this.routeStateService.updateIdState('');
  }
}
