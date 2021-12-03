/**
 * Project Perform API V2.0.0
 * See https://app.swaggerhub.com/apis/cname87/Project-Perform/2.0.0
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { NGXLogger } from 'ngx-logger';

import { catchError, tap } from 'rxjs/operators';
import { apiConfiguration } from '../../configuration/configuration';
import { CustomHttpUrlEncodingCodec } from '../../app-module/data-providers/encoder';
import {
  ICount,
  ISession,
  ISessionWithoutId,
  SessionType,
} from '../models/activity-models';

export { ICount, ISession, ISessionWithoutId };

/**
 * This service handles all communication with the server according to the defined api. It implements all the function to create, get, update and delete sessions on the server.
 */
@Injectable({
  providedIn: 'root',
})
export class ActivitiesDataProvider {
  //
  private basePath = apiConfiguration.basePath;
  private membersPath = apiConfiguration.membersPath;
  private sessionsPath = apiConfiguration.sessionsPath;
  private defaultHeaders = apiConfiguration.defaultHeaders;
  private withCredentials = apiConfiguration.withCredentials;

  httpClient1 = {
    get: (_test1: any, _test2: any) => {
      return of([
        {
          id: 1,
          date: new Date().toISOString(),
          memberId: 3,
          type: SessionType.Strength,
          score: 5,
          duration: 50,
          metric: 250,
          comment: 'Test comment',
        },
      ]);
    },
  };

  constructor(private httpClient: HttpClient, private logger: NGXLogger) {
    this.logger.trace(
      `${ActivitiesDataProvider.name}: Starting ActivitiesDataProvider`,
    );
  }

  /**
   * Adds a supplied session to the defined member
   * A session object without the id property must be supplied in the body.
   * @param memberId: The member to whom the session is being added.
   * @param sessionWithoutId: Session object but with no id property.
   * @returns An observable returning the session added.
   */
  public addSession(sessionWithoutId: ISessionWithoutId): Observable<ISession> {
    this.logger.trace(`${ActivitiesDataProvider.name}: addSession called`);

    if (sessionWithoutId === null || sessionWithoutId === undefined) {
      throw new Error(
        'Required parameter sessionWithoutId was null or undefined when calling addSession.',
      );
    }

    let headers = this.defaultHeaders;
    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');
    /* set Content-Type header - what content is being sent */
    headers = headers.set('Content-Type', 'application/json');

    const path = `${this.basePath}/${this.sessionsPath}`;
    this.logger.trace(
      `${ActivitiesDataProvider.name}: Sending POST request to: ${path}`,
    );

    return this.httpClient
      .post<ISession>(`${path}`, sessionWithoutId, {
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
          return throwError(errReport);
        }),
      );
  }

  /**
   * Gets all the sessions for all members, filtered by a query string.
   * @param matchString: An optional search string to limit the returned list.
   * All sessions with the 'type' property starting with 'name' will be returned.
   * @returns An observable returning an array of the sessions retrieved.
   */
  public getAllSessions(matchString?: string): Observable<ISession[]> {
    this.logger.trace(`${ActivitiesDataProvider.name}: getAllSessions called`);

    /* set up query parameter */
    let queryParameters = new HttpParams();
    if (matchString !== undefined && matchString !== null) {
      /* custom encoder handles '+' properly */
      const encoder = new CustomHttpUrlEncodingCodec();
      matchString = encoder.encodeValue(matchString);
      queryParameters = queryParameters.set('type', matchString);
    }

    let headers = this.defaultHeaders;

    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');

    const path = `${this.basePath}/${this.sessionsPath}`;

    this.logger.trace(
      `${ActivitiesDataProvider.name}: Sending GET request to: ${path}`,
    );

    // .get<ISession[]>(`${path}`, {
    return this.httpClient1
      .get(`${path}`, {
        params: queryParameters,
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
          return throwError(errReport);
        }),
      );
  }

  /**
   * Gets all the sessions for a particular member, filtered by a query string.
   * @param matchString: An optional search string to limit the returned list.
   *  All sessions with the 'type' property starting with the matchstring will be returned.
   * @param memberId:
   * - If 0, then all sessions from every member are returned.
   * - If not 0 then the sessions belonging to a specific team member is returned.
   * @returns An observable returning an array of the sessions retrieved.
   */
  public getSessions(
    memberId: number,
    matchString?: string,
  ): Observable<ISession[]> {
    this.logger.trace(`${ActivitiesDataProvider.name}: getSessions called`);

    /* set up query parameter */
    let queryParameters = new HttpParams();
    if (matchString !== undefined && matchString !== null) {
      /* custom encoder handles '+' properly */
      const encoder = new CustomHttpUrlEncodingCodec();
      matchString = encoder.encodeValue(matchString);
      queryParameters = queryParameters.set('type', matchString);
    }

    let headers = this.defaultHeaders;

    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');

    const memberIdString = encodeURIComponent(String(memberId));
    const path = `${this.basePath}/${this.membersPath}/${memberIdString}/${this.sessionsPath}`;

    this.logger.trace(
      `${ActivitiesDataProvider.name}: Sending GET request to: ${path}`,
    );

    return this.httpClient
      .get<ISession[]>(`${path}`, {
        params: queryParameters,
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
          return throwError(errReport);
        }),
      );
  }

  /**
   * Gets a specific session.
   * @param sessionId: The value of the id property of the session.
   * @returns An observable returning the sessions retrieved.
   */
  public getSession(sessionId: number): Observable<ISession> {
    this.logger.trace(`${ActivitiesDataProvider.name}: getSession called`);

    if (sessionId === null || sessionId === undefined) {
      throw new Error(
        'Required parameter id was null or undefined when calling getSession.',
      );
    }

    let headers = this.defaultHeaders;
    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');

    const sessionIdString = encodeURIComponent(String(sessionId));
    const path = `${this.basePath}/${this.sessionsPath}/${sessionIdString}`;

    this.logger.trace(
      `${ActivitiesDataProvider.name}: Sending GET request to: ${path}`,
    );

    return this.httpClient
      .get<ISession>(`${path}`, {
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
          return throwError(errReport);
        }),
      );
  }

  /**
   * Updates a session.
   * A session object is supplied which must have an id property.
   * @param session: Team session to be updated detail
   * @returns An observable returning the updated session.
   */
  public updateSession(session: ISession | ISession): Observable<ISession> {
    this.logger.trace(`${ActivitiesDataProvider.name}: updateSession called`);

    if (session === null || session === undefined) {
      throw new Error(
        'Required parameter session was null or undefined when calling updateSession.',
      );
    }

    let headers = this.defaultHeaders;
    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');
    /* set Content-Type header - what content is being sent */
    headers = headers.set('Content-Type', 'application/json');

    const path = `${this.basePath}/${this.sessionsPath}`;

    this.logger.trace(
      `${ActivitiesDataProvider.name}: Sending PUT request to: ${path}`,
    );

    return this.httpClient
      .put<ISession>(`${path}`, session, {
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
          return throwError(errReport);
        }),
      );
  }

  /**
   * Deletes a session.
   * @param sessionId The id property of the session to delete.
   * @returns An observable returning a count of the sessions deleted, (which should always be 1).
   */
  public deleteSession(sessionId: number): Observable<ICount> {
    this.logger.trace(`${ActivitiesDataProvider.name}: deleteSession called`);

    if (sessionId === null || sessionId === undefined) {
      throw new Error(
        'Required parameter id was null or undefined when calling deleteSession.',
      );
    }

    let headers = this.defaultHeaders;
    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');

    const sessionIdString = encodeURIComponent(String(sessionId));
    const path = `${this.basePath}/${this.sessionsPath}/${sessionIdString}`;

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
          return throwError(errReport);
        }),
      );
  }
}
