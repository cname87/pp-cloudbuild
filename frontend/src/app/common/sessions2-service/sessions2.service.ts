import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';
import { StatusCodes } from 'http-status-codes';
import { ToastrService } from 'ngx-toastr';

import { Sessions2DataProvider } from '../../data-providers/sessions2.data-provider';
import { ISessions2 } from '../../data-providers/models/models';
import { IErrReport } from '../config';

/**
 * This service provides functions to call all the api functions providing appropriate responses, messaging and errorhandling.
 */
@Injectable({ providedIn: 'root' })
export class Sessions2Service {
  constructor(
    private sessions2DataProvider: Sessions2DataProvider,
    private logger: NGXLogger,
    private toastr: ToastrService,
  ) {
    this.logger.trace(`${Sessions2Service.name}: starting Sessions2Service`);
  }

  /* common toastr message */
  private toastrMessage = 'A server access error has occurred';

  /**
   * Gets a sessions table by date. Only one sessions table object can be linked to any particular day so the backend server attempts to find the one sessions object corresponding to the day in the supplied date and returns it. If a sessions table with that day does not exist then one is created with empty data.
   * @param
   * - date: The date of the sessions table to be returned.
   * @returns
   * - An observable containing a sessions table object.
   * @throws
   * - Throws an observable with an error if any response other than a successful response is received from the server.
   */
  getOrCreateSessions(memberId: number, date: Date): Observable<ISessions2> {
    this.logger.trace(`${Sessions2Service.name}: getOrCreateSessions called`);

    return this.sessions2DataProvider.getOrCreateSessions(memberId, date).pipe(
      tap((data: ISessions2) => {
        this.logger.trace(
          `${
            Sessions2Service.name
          }: Fetched or created sessions table with date = ${data.date.toISOString()}`,
        );
      }),

      catchError((errReport: IErrReport) => {
        this.logger.trace(`${Sessions2Service.name}: catchError called`);

        /* inform user */
        if (
          errReport.error &&
          errReport.error.status === StatusCodes.NOT_FOUND
        ) {
          /* 404: sessions table did not exist */
          this.logger.trace(
            `${
              Sessions2Service.name
            }: ERROR: Did not find sessions table with date = ${date.toDateString()}`,
          );
        } else {
          /* otherwise a general fail */
          this.toastr.error('ERROR!', this.toastrMessage);
        }
        /* mark as handled */
        errReport.isHandled = true;

        this.logger.trace(`${Sessions2Service.name}: Throwing the error on`);
        return throwError(errReport);
      }),
    );
  }

  /**
   * Updates a sessions table on the server.
   * @param
   * - sessions: A sessions table object.
   * @returns
   * - An observable containing the updated sessions table.
   * @throws
   * - Throws an observable with an error if any response other than a successful response is received from the server.
   */
  updateSessionsTable(sessions: ISessions2): Observable<ISessions2> {
    this.logger.trace(`${Sessions2Service.name}: updateSessionsTable called`);

    return this.sessions2DataProvider.updateSessionsTable(sessions).pipe(
      tap((data: ISessions2) => {
        this.logger.trace(
          `${
            Sessions2Service.name
          }: Updated sessions table with date = ${data.date.toISOString()}`,
        );
      }),

      catchError((errReport: IErrReport) => {
        this.logger.trace(`${Sessions2Service.name}: catchError called`);

        /* inform user */
        if (
          errReport.error &&
          errReport.error.status === StatusCodes.NOT_FOUND
        ) {
          /* 404: sessions table did not exist */
          this.logger.trace(
            `${Sessions2Service.name}: ERROR: Did not find sessions table with id = ${sessions.id}`,
          );
        } else {
          /* otherwise a general fail */
          this.toastr.error('ERROR!', this.toastrMessage);
        }
        /* mark as handled */
        errReport.isHandled = true;

        this.logger.trace(`${Sessions2Service.name}: Throwing the error on`);
        return throwError(errReport);
      }),
    );
  }
}
