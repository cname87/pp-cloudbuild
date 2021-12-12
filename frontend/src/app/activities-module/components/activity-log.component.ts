import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Data, ParamMap } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { catchError, map, shareReplay, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';

import { RouteStateService } from '../../app-module/services/route-state-service/router-state.service';
import { ActivitiesService } from '../services/activities.service';
import {
  EActivityType,
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
  /* activities list observable passed to, and enabling, activities component */
  activities$!: Observable<IActivity[]> | undefined;
  /* member id passed to activities component */
  memberId!: number;
  /* clicked activity passed to, and enabling, activity component */
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

  #getBlankActivity(): IActivityWithoutId {
    this.logger.trace(
      `${ActivityLogComponent.name}: Starting #getBlankActivity`,
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    today.setUTCHours(0, 0, 0, 0);
    const todayMidnight = new Date(today).toISOString();
    return {
      memberId: this.memberId,
      date: todayMidnight,
      type: EActivityType.Blank,
      duration: '',
      comment: '',
    };
  }

  #getActivities$(): Observable<IActivity[]> {
    this.logger.trace(`${ActivityLogComponent.name}: Starting #getActivities$`);
    return this.activitiesService
      .getActivities(this.memberId)
      .pipe(
        takeUntil(this.#destroy$),
        shareReplay(1),
        catchError(this.#catchError),
      );
  }

  ngOnInit(): void {
    this.logger.trace(`${ActivityLogComponent.name}: Starting ngOnInit`);
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
    this.logger.trace(`${ActivityLogComponent.name}: Starting editActivity`);
    this.activities$ = undefined;
    this.activity = clickedActivity;
  }

  addActivity(): void {
    this.logger.trace(`${ActivityLogComponent.name}: Starting addActivity`);
    this.activities$ = undefined;
    this.activity = this.#getBlankActivity();
  }

  doneActivity(): void {
    this.logger.trace(`${ActivityLogComponent.name}: Starting doneActivity`);
    this.activity = undefined;
    this.activities$ = this.#getActivities$();
  }

  ngOnDestroy(): void {
    this.logger.trace(`${ActivityLogComponent.name}: #ngDestroy called`);
    this.#destroy$.next();
    this.#destroy$.complete();
    this.routeStateService.updateIdState('');
  }
}
