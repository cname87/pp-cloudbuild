/**
 * Project Perform API V2.0.0
 * See https://app.swaggerhub.com/apis/cname87/Project-Perform/2.0.0
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NGXLogger } from 'ngx-logger';
import { tap, catchError } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

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

  constructor(
    private httpClient: HttpClient,
    private logger: NGXLogger,
    private toastr: ToastrService,
  ) {
    this.logger.trace(
      `${ScoresDataProvider.name}: Starting ScoresDataProvider`,
    );
  }

  /**
   * Picks up any upstream errors, displays a toaster message and throws on the error.
   * @param err An error object
   * @throws Throws the received error object
   */
  #catchError = (err: any): never => {
    const toastrMessage = 'A server access error has occurred';
    this.logger.trace(`${ScoresDataProvider.name}: #catchError called`);
    this.logger.trace(
      `${ScoresDataProvider.name}: Displaying a toastr message`,
    );
    this.toastr.error('ERROR!', toastrMessage);
    this.logger.trace(`${ScoresDataProvider.name}: Throwing the error on`);
    throw err;
  };

  /**
   * Get a specific scores table belonging that has given member id and date properties, or causes a new scores table to be created in the backend with the given memberId and date properties.
   * @param memberId The member id of the member to whom the table belongs.
   * @param date The value of the date property of the scores table to be retrieved, or to be created.
   * @returns An observable returning the scores table retrieved or created.
   */
  public getOrCreateScores(memberId: number, date: Date): Observable<IScores> {
    this.logger.trace(`${ScoresDataProvider.name}: getOrCreateScores called`);

    if (!date || !memberId) {
      throw new Error(
        'A required parameter was invalid when calling getOrCreateScores.',
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
        catchError(this.#catchError),
      );
  }

  /**
   * Updates a scores table. A scores table object is supplied which must have both valid id and memberId properties. The scores table with the supplied id is updated.
   * @param scores Scores table containing detail to be updated.
   * @returns An observable returning the updated scores table.
   */
  public updateScoresTable(scores: IScores): Observable<IScores> {
    this.logger.trace(`${ScoresDataProvider.name}: updateScoresTable called`);

    if (!scores) {
      throw new Error(
        'A required parameter was invalid when calling updateScoresTable.',
      );
    }

    let headers = this.defaultHeaders;
    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');
    /* set Content-Type header - what content is being sent */
    headers = headers.set('Content-Type', 'application/json');

    /* the member id from the supplied table is passed as a url parameter and is used to ensure the calling user either corresponds to that member id or is an admin user */
    const memberId = scores.memberId;

    this.logger.trace(
      // eslint-disable-next-line max-len
      `${ScoresDataProvider.name}: Sending PUT request to: ${this.basePath}/${this.scoresPath}/${memberId}`,
    );

    return this.httpClient
      .put<IScores>(
        `${this.basePath}/${this.scoresPath}/${encodeURIComponent(memberId)}`,
        scores,
        {
          withCredentials: this.withCredentials,
          headers,
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
        catchError(this.#catchError),
      );
  }
}
