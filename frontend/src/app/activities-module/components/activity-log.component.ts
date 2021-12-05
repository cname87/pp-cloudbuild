import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Data, ParamMap } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { RouteStateService } from '../../app-module/services/route-state-service/router-state.service';
import { EMode, IActivity } from '../models/activity-models';

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
  /* list of activities retrieved from the backend */
  activities!: IActivity[];
  /* clicked activity passed to activity component */
  activity: IActivity | undefined = undefined;
  /* used to unsubscribe */
  #destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
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

  ngOnInit(): void {
    /* get the data as supplied from the route resolver */
    this.route.data
      .pipe(takeUntil(this.#destroy$), catchError(this.#catchError))
      .subscribe((data: Data) => {
        this.activities = data.activities;
      });
    /* update route state with member id */
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
      .subscribe((id) => this.routeStateService.updateIdState(id));
  }

  callActivity(clickedActivity: IActivity): void {
    this.activity = clickedActivity;
  }

  doneActivity(action: EMode): void {
    this.logger.trace(`${ActivityLogComponent.name}: Activity ${action} noted`);
    this.activity = undefined;
  }

  ngOnDestroy(): void {
    this.logger.trace(`${ActivityLogComponent.name}: #ngDestroy called`);
    this.#destroy$.next();
    this.#destroy$.complete();
    this.routeStateService.updateIdState('');
  }
}
