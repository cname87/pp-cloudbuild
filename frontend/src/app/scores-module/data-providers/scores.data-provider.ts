/**
 * Project Perform API V2.0.0
 * See https://app.swaggerhub.com/apis/cname87/Project-Perform/2.0.0
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { NGXLogger } from 'ngx-logger';
import { tap, catchError } from 'rxjs/operators';
import { apiConfiguration } from '../../configuration/configuration';
import { IScores } from './scores-models';

/**
 * This service handles all communication with the server. It implements all the function to create/get or update a weekly scores table on the server.
 */
@Injectable({
  providedIn: 'root',
})
export class ScoresDataProvider {
  //
  private basePath = apiConfiguration.basePath;
  private scoresPath = apiConfiguration.scoresPath;
  private membersPath = apiConfiguration.membersPath;
  private defaultHeaders = apiConfiguration.defaultHeaders;
  private withCredentials = apiConfiguration.withCredentials;

  constructor(private httpClient: HttpClient, private logger: NGXLogger) {
    this.logger.trace(
      `${ScoresDataProvider.name}: Starting ScoresDataProvider`,
    );
  }

  /**
   * Get a specific scores table.
   * @param date: The value of the date property of the scores table.
   * @returns An observable returning the scores table retrieved.
   */
  public getOrCreateScores(memberId: number, date: Date): Observable<IScores> {
    this.logger.trace(`${ScoresDataProvider.name}: getOrCreateScores called`);

    if (!date || !memberId) {
      throw new Error(
        'Required parameter date was null or undefined when calling getOrCreateScores.',
      );
    }

    let headers = this.defaultHeaders;
    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');

    this.logger.trace(
      // eslint-disable-next-line max-len
      `${ScoresDataProvider.name}: Sending POST request to: ${this.basePath}/${this.membersPath}/${memberId}/${this.scoresPath}/`,
    );

    /* create a body with the date string */
    const dateObject = { date: date.toISOString() };

    return this.httpClient
      .post<any>(
        `${this.basePath}/${this.membersPath}/${encodeURIComponent(memberId)}/${
          this.scoresPath
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
        tap((data: IScores) => {
          /* convert the incoming date property which is an ISO string to a Date object (so it works with the form datepicker) */
          data.date = new Date(data.date);
          this.logger.trace(
            `${ScoresDataProvider.name}: Received response: ${JSON.stringify(
              data,
            )}`,
          );
        }),
        catchError((errReport) => {
          this.logger.trace(`${ScoresDataProvider.name}: catchError called`);
          /* rethrow all errors */
          this.logger.trace(
            `${ScoresDataProvider.name}: Throwing the error on`,
          );
          return throwError(errReport);
        }),
      );
  }

  /**
   * Updates a scores table.
   * A scores table object is supplied which must have both an id property and a memberId property.
   * The scores table with that id is updated.
   * @param scores: Scores table containing detail to be updated.
   * @returns An observable returning the updated scores table.
   */
  public updateScoresTable(scores: IScores): Observable<IScores> {
    this.logger.trace(`${ScoresDataProvider.name}: updateScoresTable called`);

    if (scores === null || scores === undefined) {
      throw new Error(
        'Required parameter scores was null or undefined when calling updateScoresTable.',
      );
    }

    let headers = this.defaultHeaders;
    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');
    /* set Content-Type header - what content is being sent */
    headers = headers.set('Content-Type', 'application/json');

    this.logger.trace(
      // eslint-disable-next-line max-len
      `${ScoresDataProvider.name}: Sending PUT request to: ${this.basePath}/${this.scoresPath}`,
    );

    /* the member id is passed as a url parameter and is used to ensure the calling user matches the member id in the scores object */
    const mid = scores.memberId;

    return this.httpClient
      .put<IScores>(`${this.basePath}/${this.scoresPath}/${mid}`, scores, {
        withCredentials: this.withCredentials,
        headers,
      })
      .pipe(
        tap((data: IScores) => {
          /* convert the incoming date property which is an ISO string to a Date object (so it works with the form datepicker) */
          data.date = new Date(data.date);
          this.logger.trace(
            `${ScoresDataProvider.name}: Received response: ${JSON.stringify(
              data,
            )}`,
          );
        }),
        catchError((errReport) => {
          this.logger.trace(`${ScoresDataProvider.name}: catchError called`);
          /* rethrow all errors */
          this.logger.trace(
            `${ScoresDataProvider.name}: Throwing the error on`,
          );
          return throwError(errReport);
        }),
      );
  }
}
