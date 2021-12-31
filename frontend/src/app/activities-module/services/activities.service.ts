import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';
import { StatusCodes } from 'http-status-codes';
import { ToastrService } from 'ngx-toastr';

import { ActivitiesDataProvider } from '../data-providers/activities.data-provider';
import {
  ICount,
  IActivity,
  IActivityWithoutId,
} from '../models/activity-models';
import { IErrReport } from '../../configuration/configuration';

/**
 * This service provides functions to call all the functions that call the backend according to the defined api providing appropriate responses, messaging and errorhandling.
 */
@Injectable({ providedIn: 'root' })
export class ActivitiesService {
  constructor(
    private activitiesDataProvider: ActivitiesDataProvider,
    private logger: NGXLogger,
    private toastr: ToastrService,
  ) {
    this.logger.trace(`${ActivitiesService.name}: starting ActivitiesService`);
  }

  /* common toastr message */
  private toastrMessage = 'A server access error has occurred';

  /**
   * Gets all activity records from the server tied to a particular member.
   * @param memberId: The member whose activities will be returned.
   * @returns
   * - An observable with an array of the activities returned from the server.
   * - 404 is received from the server if there are no activities in the stored team or if there are no activities matching the supplied term.  In this case an empty array is returned.
   * @throws
   * - Throws an observable with an error if any response other than a successful response, or a Not Found/404, is received from the server.
   */
  getActivities(memberId: number): Observable<IActivity[]> {
    this.logger.trace(`${ActivitiesService.name}: getActivities called`);

    return this.activitiesDataProvider.getActivities(memberId).pipe(
      catchError((err: IErrReport) => {
        this.logger.trace(`${ActivitiesService.name}: catchError called`);

        /* inform user and mark as handled */
        this.toastr.error('ERROR!', this.toastrMessage);
        err.isHandled = true;

        this.logger.trace(`${ActivitiesService.name}: Throwing the error on`);
        return throwError(() => err);
      }),
    );
  }

  /**
   * Gets a particular activity belonging to a member.
   * @param memberId: The id of the member who owns the activity record.
   * @param activityId: The id of the activity that will be returned.
   * @returns An observable containing a activity object.
   * @throws: Throws an observable with an error if any response other than a successful response is received from the server.
   */
  getActivity(memberId: number, activityId: number): Observable<IActivity> {
    this.logger.trace(`${ActivitiesService.name}: getActivity called`);

    return this.activitiesDataProvider.getActivity(memberId, activityId).pipe(
      catchError((errReport: IErrReport) => {
        this.logger.trace(`${ActivitiesService.name}: catchError called`);

        /* inform user */
        if (errReport.error?.status === StatusCodes.NOT_FOUND) {
          /* 404: activity did not exist */
        } else {
          /* otherwise a general fail */
        }
        this.toastr.error('ERROR!', this.toastrMessage);
        /* mark as handled */
        errReport.isHandled = true;

        this.logger.trace(`${ActivitiesService.name}: Throwing the error on`);
        return throwError(() => errReport);
      }),
    );
  }

  /**
   * Adds a new activity to the member record.
   * @param: The activity record to be added (without an id field).
   * @returns:An observable containing the added activity.
   * @throws: Throws an observable with an error if any response other than a successful response is received from the server.
   */
  addActivity(activity: IActivityWithoutId): Observable<IActivity> {
    this.logger.trace(`${ActivitiesService.name}: addActivity called`);

    return this.activitiesDataProvider.addActivity(activity).pipe(
      catchError((err: IErrReport) => {
        this.logger.trace(`${ActivitiesService.name}: catchError called`);

        /* inform user and mark as handled */
        this.toastr.error('ERROR!', this.toastrMessage);
        err.isHandled = true;

        this.logger.trace(`${ActivitiesService.name}: Throwing the error on`);
        return throwError(() => err);
      }),
    );
  }

  /**
   * Deletes a particular activity.
   * @param activity: The activity record that will be deleted.
   * @returns An observable containing the count of records deleted, which will always be one.
   * @throws: Throws an observable with an error if any response other than a successful response is received from the server.
   */
  deleteActivity(activity: IActivity): Observable<ICount> {
    this.logger.trace(`${ActivitiesService.name}: deleteActivity called`);

    return this.activitiesDataProvider.deleteActivity(activity).pipe(
      catchError((errReport: IErrReport) => {
        this.logger.trace(`${ActivitiesService.name}: catchError called`);

        if (errReport.error?.status === StatusCodes.NOT_FOUND) {
          /* 404: activity did not exist */
        } else {
          /* otherwise a general fail */
          this.toastr.error('ERROR!', this.toastrMessage);
        }
        /* mark as handled */
        errReport.isHandled = true;

        this.logger.trace(`${ActivitiesService.name}: Throwing the error on`);
        return throwError(() => errReport);
      }),
    );
  }

  /**
   * Updates a particular activity.
   * @param activity: The activity object to be updated, which must contain an id field.
   * @returns An observable containing a activity object.
   * @throws: Throws an observable with an error if any response other than a successful response is received from the server.
   */
  updateActivity(activity: IActivity): Observable<IActivity> {
    this.logger.trace(`${ActivitiesService.name}: updateActivity called`);

    return this.activitiesDataProvider.updateActivity(activity).pipe(
      catchError((errReport: IErrReport) => {
        this.logger.trace(`${ActivitiesService.name}: catchError called`);

        if (errReport.error?.status === StatusCodes.NOT_FOUND) {
          /* 404: activity did not exist */
        } else {
          /* otherwise a general fail */
          this.toastr.error('ERROR!', this.toastrMessage);
        }
        /* mark as handled */
        errReport.isHandled = true;

        this.logger.trace(`${ActivitiesService.name}: Throwing the error on`);
        return throwError(() => errReport);
      }),
    );
  }
}
