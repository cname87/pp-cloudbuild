/**
 * Project Perform API V2.0.0
 * See https://app.swaggerhub.com/apis/cname87/Project-Perform/2.0.0
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { NGXLogger } from 'ngx-logger';
import { tap, catchError, map } from 'rxjs/operators';
import { apiConfiguration } from '../../configuration/configuration';
import { ISessions, ISessionsStripped } from './sessions-models';

enum Days {
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday',
  Sunday = 'Sunday',
}
enum AMPM {
  AM = 'AM',
  PM = 'PM',
}
/**
 * This service handles all communication with the server. It implements all the function to create/get or update a weekly sessions table on the server.
 */
@Injectable({
  providedIn: 'root',
})
export class SessionsDataProvider {
  //
  private basePath = apiConfiguration.basePath;
  private sessions2Path = apiConfiguration.sessions2Path;
  private membersPath = apiConfiguration.membersPath;
  private defaultHeaders = apiConfiguration.defaultHeaders;
  private withCredentials = apiConfiguration.withCredentials;

  constructor(private httpClient: HttpClient, private logger: NGXLogger) {
    this.logger.trace(
      `${SessionsDataProvider.name}: Starting SessionsDataProvider`,
    );
  }

  #addFixedFields(table: ISessionsStripped): ISessions {
    const tableFilled = table as ISessions;
    tableFilled.sessions[0].day = Days.Monday;
    tableFilled.sessions[0].ampm = AMPM.AM;
    tableFilled.sessions[1].day = Days.Monday;
    tableFilled.sessions[1].ampm = AMPM.PM;
    tableFilled.sessions[2].day = Days.Tuesday;
    tableFilled.sessions[2].ampm = AMPM.AM;
    tableFilled.sessions[3].day = Days.Tuesday;
    tableFilled.sessions[3].ampm = AMPM.PM;
    tableFilled.sessions[4].day = Days.Wednesday;
    tableFilled.sessions[4].ampm = AMPM.AM;
    tableFilled.sessions[5].day = Days.Wednesday;
    tableFilled.sessions[5].ampm = AMPM.PM;
    tableFilled.sessions[6].day = Days.Thursday;
    tableFilled.sessions[6].ampm = AMPM.AM;
    tableFilled.sessions[7].day = Days.Thursday;
    tableFilled.sessions[7].ampm = AMPM.PM;
    tableFilled.sessions[8].day = Days.Friday;
    tableFilled.sessions[8].ampm = AMPM.AM;
    tableFilled.sessions[9].day = Days.Friday;
    tableFilled.sessions[9].ampm = AMPM.PM;
    tableFilled.sessions[10].day = Days.Saturday;
    tableFilled.sessions[10].ampm = AMPM.AM;
    tableFilled.sessions[11].day = Days.Saturday;
    tableFilled.sessions[11].ampm = AMPM.PM;
    tableFilled.sessions[12].day = Days.Sunday;
    tableFilled.sessions[12].ampm = AMPM.AM;
    tableFilled.sessions[13].day = Days.Sunday;
    tableFilled.sessions[13].ampm = AMPM.PM;
    return tableFilled;
  }

  #stripFixedFields(table: ISessions): ISessionsStripped {
    const tableStripped: ISessionsStripped = table;
    tableStripped.sessions.map((element) => {
      delete element['day'];
      delete element['ampm'];
    });
    return tableStripped;
  }

  /**
   * Get a specific sessions table.
   * @param date: The value of the date property of the sessions table.
   * @returns An observable returning the sessions table retrieved.
   */
  public getOrCreateSessions(
    memberId: number,
    date: Date,
  ): Observable<ISessions> {
    this.logger.trace(
      `${SessionsDataProvider.name}: getOrCreateSessions called`,
    );

    if (!date || !memberId) {
      throw new Error(
        'Required parameter date or memberId was not truthy when calling getOrCreateSessions.',
      );
    }

    let headers = this.defaultHeaders;
    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');

    this.logger.trace(
      // eslint-disable-next-line max-len
      `${SessionsDataProvider.name}: Sending POST request to: ${this.basePath}/${this.membersPath}/${memberId}/${this.sessions2Path}/`,
    );

    /* create a body with the date string */
    const dateObject = { date: date.toISOString() };

    return this.httpClient
      .post<any>(
        `${this.basePath}/${this.membersPath}/${encodeURIComponent(memberId)}/${
          this.sessions2Path
        }`,
        dateObject,
        {
          headers,
          observe: 'body',
          responseType: 'json',
          withCredentials: this.withCredentials,
        },
      )
      .pipe(
        map((data: ISessions) => {
          const sessionsFilled = this.#addFixedFields(data);
          return sessionsFilled;
        }),
        tap((data: ISessions) => {
          /* convert the incoming date property which is an ISO string to a Date object (so it works with the form datepicker) */
          data.date = new Date(data.date);
          this.logger.trace(
            `${SessionsDataProvider.name}: Received response: ${JSON.stringify(
              data,
            )}`,
          );
        }),
        catchError((errReport) => {
          this.logger.trace(`${SessionsDataProvider.name}: catchError called`);
          /* rethrow all errors */
          this.logger.trace(
            `${SessionsDataProvider.name}: Throwing the error on`,
          );
          return throwError(errReport);
        }),
      );
  }

  /**
   * Updates a sessions table.
   * A sessions table object is supplied which must have an id property.
   * The sessions table with that id is updated.
   * @param sessions: Sessions table containing detail to be updated.
   * @returns An observable returning the updated sessions table.
   */
  public updateSessionsTable(sessions: ISessions): Observable<ISessions> {
    this.logger.trace(
      `${SessionsDataProvider.name}: updateSessionsTable called`,
    );

    if (!sessions) {
      throw new Error(
        'Required parameter sessions was null or undefined when calling updateSessionsTable.',
      );
    }

    const sessionsStripped = this.#stripFixedFields(sessions);

    let headers = this.defaultHeaders;
    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');
    /* set Content-Type header - what content is being sent */
    headers = headers.set('Content-Type', 'application/json');

    this.logger.trace(
      // eslint-disable-next-line max-len
      `${SessionsDataProvider.name}: Sending PUT request to: ${this.basePath}/${this.sessions2Path}`,
    );

    return this.httpClient
      .put<ISessions>(
        `${this.basePath}/${this.sessions2Path}`,
        sessionsStripped,
        {
          withCredentials: this.withCredentials,
          headers,
        },
      )
      .pipe(
        tap((data: ISessions) => {
          /* convert the incoming date property which is an ISO string to a Date object (so it works with the form datepicker) */
          data.date = new Date(data.date);
          this.logger.trace(
            `${SessionsDataProvider.name}: Received response: ${JSON.stringify(
              data,
            )}`,
          );
        }),
        catchError((errReport) => {
          this.logger.trace(`${SessionsDataProvider.name}: catchError called`);
          /* rethrow all errors */
          this.logger.trace(
            `${SessionsDataProvider.name}: Throwing the error on`,
          );
          return throwError(errReport);
        }),
      );
  }
}
