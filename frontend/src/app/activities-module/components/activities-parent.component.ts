import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Data, ParamMap } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { catchError, map, shareReplay, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';

import { UserIdStateService } from '../../app-module/services/user-id-state-service/user-id-state.service';
import { ActivitiesService } from '../services/activities.service';
import {
  EActivityType,
  IActivity,
  IActivityWithoutId,
} from '../models/activity-models';

/**
 * @title This is the parent component of both the activities table and the individual activity editing table. See the notes in each component.
 *
 * On startup it receives a activities object from the route resolver and sets the activities$ variable which causes the sessions table component to be shown. The activity variable is undefined on startup which causes the activity edit table not to be shown.
 */
@Component({
  selector: 'app-activities-parent',
  templateUrl: './activities-parent.component.html',
  styleUrls: ['./activities-parent.component.scss'],
  providers: [],
})
export class ActivitiesParentComponent implements OnInit, OnDestroy {
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
    private userIdStateService: UserIdStateService,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      `${ActivitiesParentComponent.name}: Starting ActivitiesParentComponent`,
    );
  }

  /**
   * Picks up any upstream errors and throws on the error.
   * @param err An error object
   * @throws Throws the received error object
   */
  #catchError = (err: any): never => {
    this.logger.trace(`${ActivitiesParentComponent.name}: #catchError called`);
    this.logger.trace(
      `${ActivitiesParentComponent.name}: Throwing the error on`,
    );
    throw err;
  };

  #getBlankActivity(): IActivityWithoutId {
    this.logger.trace(
      `${ActivitiesParentComponent.name}: Starting #getBlankActivity`,
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
    this.logger.trace(
      `${ActivitiesParentComponent.name}: Starting #getActivities$`,
    );
    return this.activitiesService
      .getActivities(this.memberId)
      .pipe(
        takeUntil(this.#destroy$),
        shareReplay(1),
        catchError(this.#catchError),
      );
  }

  ngOnInit(): void {
    this.logger.trace(`${ActivitiesParentComponent.name}: Starting ngOnInit`);

    /* get the data as supplied from the route resolver */
    this.activities$ = this.route.data.pipe(
      takeUntil(this.#destroy$),
      map((data: Data) => {
        return data.activities;
      }),
      catchError(this.#catchError),
    );
    /* get member id from route state */
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
      .subscribe((id) => this.userIdStateService.updateIdState(id));
  }

  /**
   * Called when an activity is passed from the activities component. Causes the activity edit page to be shown.
   */
  editActivity(clickedActivity: IActivity): void {
    this.logger.trace(
      `${ActivitiesParentComponent.name}: Starting editActivity`,
    );
    this.activities$ = undefined;
    this.activity = clickedActivity;
  }

  addActivity(): void {
    this.logger.trace(
      `${ActivitiesParentComponent.name}: Starting addActivity`,
    );
    this.activities$ = undefined;
    this.activity = this.#getBlankActivity();
  }

  /**
   * Called when an updated activity is passed from the activity edit component. Causes an updated activities table to be shown.
   */
  doneActivity(): void {
    this.logger.trace(
      `${ActivitiesParentComponent.name}: Starting doneActivity`,
    );
    this.activity = undefined;
    this.activities$ = this.#getActivities$();
  }

  ngOnDestroy(): void {
    this.logger.trace(
      `${ActivitiesParentComponent.name}: starting ngOnDestroy`,
    );
    this.#destroy$.next();
    this.#destroy$.complete();
  }
}
