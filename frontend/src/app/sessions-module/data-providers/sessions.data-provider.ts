import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NGXLogger } from 'ngx-logger';
import { tap, catchError, map } from 'rxjs/operators';
import clonedeep from 'lodash.clonedeep';

import { apiConfiguration } from '../../configuration/configuration';
import {
  IDate,
  ISessions,
  ISessionsStripped,
  EAmPm,
  EDays,
} from '../models/sessions-models';

/**
 * This service handles all communication with the server. It implements all the function to create/get or update a weekly sessions table on the backend.
 */
@Injectable({
  providedIn: 'root',
})
export class SessionsDataProvider {
  //
  private basePath = apiConfiguration.basePath;
  private sessionsPath = apiConfiguration.sessionsPath;
  private memberPath = apiConfiguration.memberPath;
  private defaultHeaders = apiConfiguration.defaultHeaders;
  private withCredentials = apiConfiguration.withCredentials;

  constructor(private httpClient: HttpClient, private logger: NGXLogger) {
    this.logger.trace(
      `${SessionsDataProvider.name}: Starting SessionsDataProvider`,
    );
  }

  /**
   * Picks up any upstream errors and throws on the error.
   * @param err An error object
   * @throws Throws the received error object
   */
  #catchError = (err: any): never => {
    this.logger.trace(`${SessionsDataProvider.name}: #catchError called`);
    this.logger.trace(`${SessionsDataProvider.name}: Throwing the error on`);
    throw err;
  };

  #addFixedFields(table: ISessionsStripped): ISessions {
    const tableFilled = clonedeep(table) as ISessions;
    tableFilled.sessions[0].day = EDays.Monday;
    tableFilled.sessions[0].ampm = EAmPm.AM;
    tableFilled.sessions[1].day = EDays.Monday;
    tableFilled.sessions[1].ampm = EAmPm.PM;
    tableFilled.sessions[2].day = EDays.Tuesday;
    tableFilled.sessions[2].ampm = EAmPm.AM;
    tableFilled.sessions[3].day = EDays.Tuesday;
    tableFilled.sessions[3].ampm = EAmPm.PM;
    tableFilled.sessions[4].day = EDays.Wednesday;
    tableFilled.sessions[4].ampm = EAmPm.AM;
    tableFilled.sessions[5].day = EDays.Wednesday;
    tableFilled.sessions[5].ampm = EAmPm.PM;
    tableFilled.sessions[6].day = EDays.Thursday;
    tableFilled.sessions[6].ampm = EAmPm.AM;
    tableFilled.sessions[7].day = EDays.Thursday;
    tableFilled.sessions[7].ampm = EAmPm.PM;
    tableFilled.sessions[8].day = EDays.Friday;
    tableFilled.sessions[8].ampm = EAmPm.AM;
    tableFilled.sessions[9].day = EDays.Friday;
    tableFilled.sessions[9].ampm = EAmPm.PM;
    tableFilled.sessions[10].day = EDays.Saturday;
    tableFilled.sessions[10].ampm = EAmPm.AM;
    tableFilled.sessions[11].day = EDays.Saturday;
    tableFilled.sessions[11].ampm = EAmPm.PM;
    tableFilled.sessions[12].day = EDays.Sunday;
    tableFilled.sessions[12].ampm = EAmPm.AM;
    tableFilled.sessions[13].day = EDays.Sunday;
    tableFilled.sessions[13].ampm = EAmPm.PM;
    return tableFilled;
  }

  #stripFixedFields(table: ISessions): ISessionsStripped {
    const tableStripped: ISessionsStripped = clonedeep(table);
    tableStripped.sessions.map((element) => {
      delete element['day'];
      delete element['ampm'];
    });
    return tableStripped;
  }

  /**
   * Get a specific sessions table that has given member id and date properties, or causes a new sessions table to be created in the backend with the given memberId and date properties.
   * @param memberId The member id of the member to whom the table belongs.
   * @param date The value of the date property of the sessions table to be retrieved, or to be created.
   * @returns An observable returning the scores table retrieved or created.
   */
  getOrCreateSessions(memberId: number, date: Date): Observable<ISessions> {
    this.logger.trace(
      `${SessionsDataProvider.name}: getOrCreateSessions called`,
    );

    if (!date || !memberId) {
      throw new Error(
        'A required parameter was invalid when calling getOrCreateSessions.',
      );
    }

    let headers = this.defaultHeaders;
    headers = headers.set('content-type', 'application/json');
    headers = headers.set('Accept', 'application/json');

    this.logger.trace(
      // eslint-disable-next-line max-len
      `${SessionsDataProvider.name}: Sending POST request to: ${this.basePath}/${this.memberPath}/${memberId}/${this.sessionsPath}/`,
    );

    /* create a body with a date object */
    const dateBody: IDate = { date: date };

    return this.httpClient
      .post<ISessions>(
        `${this.basePath}/${this.memberPath}/${encodeURIComponent(memberId)}/${
          this.sessionsPath
        }`,
        dateBody,
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
        catchError(this.#catchError),
      );
  }

  /**
   * Updates a sessions table. A sessions table object is supplied which must have both valid id and memberId properties. The sessions table with the supplied id is updated.
   * @param sessions Sessions table containing detail to be updated.
   * @returns An observable returning the updated sessions table.
   */
  updateSessionsTable(sessions: ISessions): Observable<ISessions> {
    this.logger.trace(
      `${SessionsDataProvider.name}: updateSessionsTable called`,
    );
    if (!sessions) {
      throw new Error(
        'A required parameter was invalid when calling updateSessionsTable.',
      );
    }

    const sessionsStripped = this.#stripFixedFields(sessions);

    let headers = this.defaultHeaders;
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Accept', 'application/json');

    /* the member id from the supplied table is passed as a url parameter and is used to ensure the calling user either corresponds to that member id or is an admin user */
    const memberId = sessions.memberId;

    this.logger.trace(
      // eslint-disable-next-line max-len
      `${SessionsDataProvider.name}: Sending PUT request to: ${this.basePath}/${this.memberPath}/${memberId}/${this.sessionsPath}`,
    );

    return this.httpClient
      .put<ISessions>(
        `${this.basePath}/${this.memberPath}/${encodeURIComponent(memberId)}/${
          this.sessionsPath
        }`,
        sessionsStripped,
        {
          withCredentials: this.withCredentials,
          headers,
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
        catchError(this.#catchError),
      );
  }
}
