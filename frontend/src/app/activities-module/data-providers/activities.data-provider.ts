import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { NGXLogger } from 'ngx-logger';

import { catchError, tap } from 'rxjs/operators';
import { apiConfiguration } from '../../configuration/configuration';
import {
  ICount,
  IActivity,
  IActivityWithoutId,
} from '../models/activity-models';

export { ICount, IActivity, IActivityWithoutId };

/**
 * This service handles all communication with the server according to the defined api. It implements all the function to create, get, update and delete activity records on the server.
 */
@Injectable({
  providedIn: 'root',
})
export class ActivitiesDataProvider {
  //
  private basePath = apiConfiguration.basePath;
  private memberPath = apiConfiguration.memberPath;
  private activityPath = apiConfiguration.activityPath;
  private defaultHeaders = apiConfiguration.defaultHeaders;
  private withCredentials = apiConfiguration.withCredentials;

  constructor(private httpClient: HttpClient, private logger: NGXLogger) {
    this.logger.trace(
      `${ActivitiesDataProvider.name}: Starting ActivitiesDataProvider`,
    );
  }

  /**
   * Adds a supplied activity record for the defined member.
   * A activity object without the id property must be supplied in the body.
   * @param activityWithoutId: Activity object but with no id property.
   * @returns An observable returning the activity added.
   */
  addActivity(activityWithoutId: IActivityWithoutId): Observable<IActivity> {
    this.logger.trace(`${ActivitiesDataProvider.name}: addActivity called`);

    if (
      !activityWithoutId ||
      (activityWithoutId as IActivity).id ||
      !activityWithoutId.memberId
    ) {
      throw new Error(
        'Required parameter was invalid when calling addActivity.',
      );
    }

    /* get memberId from supplied activity record */
    const memberId = activityWithoutId.memberId;

    let headers = this.defaultHeaders;
    headers = headers.set('Accept', 'application/json');
    headers = headers.set('Content-Type', 'application/json');

    const memberIdString = encodeURIComponent(String(memberId));
    const path = `${this.basePath}/${this.memberPath}/${memberIdString}/${this.activityPath}`;
    this.logger.trace(
      `${ActivitiesDataProvider.name}: Sending POST request to: ${path}`,
    );

    return this.httpClient
      .post<IActivity>(`${path}`, activityWithoutId, {
        withCredentials: this.withCredentials,
        headers,
      })
      .pipe(
        tap((_) => {
          this.logger.trace(
            `${ActivitiesDataProvider.name}: Received response`,
          );
        }),
        catchError((errReport) => {
          this.logger.trace(
            `${ActivitiesDataProvider.name}: catchError called`,
          );
          /* rethrow all errors */
          this.logger.trace(
            `${ActivitiesDataProvider.name}: Throwing the error on`,
          );
          return throwError(() => errReport);
        }),
      );
  }

  /**
   * Gets all the activities for a particular member.
   * @param memberId The memberId whose activities are returned.
   * @returns An observable returning an array of the activities retrieved.
   */
  getActivities(memberId: number): Observable<IActivity[]> {
    this.logger.trace(`${ActivitiesDataProvider.name}: getActivities called`);

    let headers = this.defaultHeaders;
    headers = headers.set('Accept', 'application/json');

    const memberIdString = encodeURIComponent(String(memberId));
    const path = `${this.basePath}/${this.memberPath}/${memberIdString}/${this.activityPath}`;

    this.logger.trace(
      `${ActivitiesDataProvider.name}: Sending GET request to: ${path}`,
    );

    return this.httpClient
      .get<IActivity[]>(`${path}`, {
        withCredentials: this.withCredentials,
        headers,
      })
      .pipe(
        tap((activities: IActivity[]) => {
          this.logger.trace(
            `${ActivitiesDataProvider.name}: Received response ${JSON.stringify(
              activities,
            )}`,
          );
        }),
        catchError((errReport) => {
          this.logger.trace(
            `${ActivitiesDataProvider.name}: catchError called`,
          );
          /* rethrow all errors */
          this.logger.trace(
            `${ActivitiesDataProvider.name}: Throwing the error on`,
          );
          return throwError(() => errReport);
        }),
      );
  }

  /**
   * Gets a specific activity record for a specific member.
   * @param memberId The memberId whose activity is returned.
   * @param activityId: The value of the id property of the activity.
   * @returns An observable returning the activities retrieved.
   */
  getActivity(memberId: number, activityId: number): Observable<IActivity> {
    this.logger.trace(`${ActivitiesDataProvider.name}: getActivity called`);

    if (!memberId || !activityId) {
      throw new Error(
        'Required parameter was invalid when calling getActivity.',
      );
    }

    let headers = this.defaultHeaders;
    headers = headers.set('Accept', 'application/json');

    const memberIdString = encodeURIComponent(String(memberId));
    const activityIdString = encodeURIComponent(String(activityId));
    const path = `${this.basePath}/${this.memberPath}/${memberIdString}/${this.activityPath}/${activityIdString}`;

    this.logger.trace(
      `${ActivitiesDataProvider.name}: Sending GET request to: ${path}`,
    );

    return this.httpClient
      .get<IActivity>(`${path}`, {
        withCredentials: this.withCredentials,
        headers,
      })
      .pipe(
        tap((_) => {
          this.logger.trace(
            `${ActivitiesDataProvider.name}: Received response`,
          );
        }),
        catchError((errReport) => {
          this.logger.trace(
            `${ActivitiesDataProvider.name}: catchError called`,
          );
          /* rethrow all errors */
          this.logger.trace(
            `${ActivitiesDataProvider.name}: Throwing the error on`,
          );
          return throwError(() => errReport);
        }),
      );
  }

  /**
   * Updates a specific activity record.
   * A full activity record object is supplied which must have id and member id properties.
   * @param activity: An activity record to be updated.
   * @returns An observable returning the updated activity.
   */
  updateActivity(activity: IActivity): Observable<IActivity> {
    this.logger.trace(`${ActivitiesDataProvider.name}: updateActivity called`);

    if (!activity?.id || !activity?.memberId) {
      throw new Error('Required parameter was invalid calling updateActivity.');
    }

    let headers = this.defaultHeaders;
    headers = headers.set('Accept', 'application/json');
    headers = headers.set('Content-Type', 'application/json');

    const memberId = activity.memberId;
    const activityId = activity.id;
    const memberIdString = encodeURIComponent(String(memberId));
    const activityIdString = encodeURIComponent(String(activityId));
    const path = `${this.basePath}/${this.memberPath}/${memberIdString}/${this.activityPath}/${activityIdString}`;

    this.logger.trace(
      `${ActivitiesDataProvider.name}: Sending PUT request to: ${path}`,
    );

    return this.httpClient
      .put<IActivity>(`${path}`, activity, {
        withCredentials: this.withCredentials,
        headers,
      })
      .pipe(
        tap((_) => {
          this.logger.trace(
            `${ActivitiesDataProvider.name}: Received response`,
          );
        }),
        catchError((errReport) => {
          this.logger.trace(
            `${ActivitiesDataProvider.name}: catchError called`,
          );
          /* rethrow all errors */
          this.logger.trace(
            `${ActivitiesDataProvider.name}: Throwing the error on`,
          );
          return throwError(() => errReport);
        }),
      );
  }

  /**
   * Deletes a specific activity record.
   * A full activity record object is supplied which must have id and member id properties.
   * @param activity: An activity record to be deleted.
   * @returns An observable returning the number of records deleted, (which is always 1).
   */
  deleteActivity(activity: IActivity): Observable<ICount> {
    this.logger.trace(`${ActivitiesDataProvider.name}: deleteActivity called`);

    if (!activity?.id || !activity?.memberId) {
      throw new Error('Required parameter was invalid calling deleteActivity.');
    }

    let headers = this.defaultHeaders;
    headers = headers.set('Accept', 'application/json');

    const memberId = activity.memberId;
    const activityId = activity.id;
    const memberIdString = encodeURIComponent(String(memberId));
    const activityIdString = encodeURIComponent(String(activityId));
    const path = `${this.basePath}/${this.memberPath}/${memberIdString}/${this.activityPath}/${activityIdString}`;

    this.logger.trace(
      `${ActivitiesDataProvider.name}: Sending DELETE request to: ${path}`,
    );

    return this.httpClient
      .delete<ICount>(`${path}`, {
        withCredentials: this.withCredentials,
        headers,
      })
      .pipe(
        tap((_) => {
          this.logger.trace(
            `${ActivitiesDataProvider.name}: Received response`,
          );
        }),
        catchError((errReport) => {
          this.logger.trace(
            `${ActivitiesDataProvider.name}: catchError called`,
          );
          /* rethrow all errors */
          this.logger.trace(
            `${ActivitiesDataProvider.name}: Throwing the error on`,
          );
          return throwError(() => errReport);
        }),
      );
  }
}
