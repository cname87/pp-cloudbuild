import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';
import { ToastrService } from 'ngx-toastr';

import { SessionsDataProvider } from '../data-providers/sessions.data-provider';
import { ISessions } from '../models/sessions-models';
import { UtilsService } from '../../app-module/services/utils-service/utils.service';

/**
 * This service provides functions to call all the api functions providing appropriate responses, messaging and errorhandling.
 */
@Injectable({ providedIn: 'root' })
export class SessionsService {
  constructor(
    private sessionsDataProvider: SessionsDataProvider,
    private logger: NGXLogger,
    private toastr: ToastrService,
    private utils: UtilsService,
  ) {
    this.logger.trace(`${SessionsService.name}: starting SessionsService`);
  }

  /**
   * Picks up any upstream errors, displays a toaster message and throws on the error.
   * @param err An error object
   * @throws Throws the received error object
   */
  #catchError = (err: any): never => {
    this.logger.trace(`${SessionsService.name}: #catchError called`);
    /* error message displayed to the user for all update fails */
    const toastrMessage = 'A table update error has occurred';
    this.logger.trace(`${SessionsService.name}: Displaying a toastr message`);
    this.toastr.error('ERROR!', toastrMessage);
    this.logger.trace(`${SessionsService.name}: Throwing the error on`);
    throw err;
  };

  /**
   * Gets a sessions table by date. Only one sessions table object can be linked to any particular day so the backend server attempts to find the one sessions object corresponding to the day in the supplied date and returns it. If a sessions table with that day does not exist then one is created with empty data.
   * @param date The date of the sessions table to be returned.
   * @returns An observable containing a sessions table object.
   * @throws See #catchError.
   */
  getOrCreateSessions(
    memberId: number,
    date = this.utils.getLastSunday(),
  ): Observable<ISessions> {
    this.logger.trace(`${SessionsService.name}: getOrCreateSessions called`);

    /* throw if date is not a Sunday as otherwise the backend will throw and shutdown */
    if (date.getDay() !== 0) {
      throw new Error('Date supplied is not a Sunday');
    }
    return this.sessionsDataProvider.getOrCreateSessions(memberId, date).pipe(
      tap((data: ISessions) => {
        this.logger.trace(
          `${
            SessionsService.name
          }: Fetched or created sessions table with date = ${data.date.toISOString()}`,
        );
      }),
      catchError(this.#catchError),
    );
  }

  /**
   * Updates a sessions table on the server.
   * @param sessions: A sessions table object.
   * @returns An observable containing the updated sessions table.
   * @throws See #catchError.
   */
  updateSessionsTable(sessions: ISessions): Observable<ISessions> {
    this.logger.trace(`${SessionsService.name}: updateSessionsTable called`);

    return this.sessionsDataProvider.updateSessionsTable(sessions).pipe(
      tap((data: ISessions) => {
        this.logger.trace(
          `${
            SessionsService.name
          }: Updated sessions table with date = ${data.date.toISOString()}`,
        );
      }),
      catchError(this.#catchError),
    );
  }
}
