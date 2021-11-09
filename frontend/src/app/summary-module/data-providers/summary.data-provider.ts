import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NGXLogger } from 'ngx-logger';
import { tap, catchError } from 'rxjs/operators';

import { apiConfiguration } from '../../configuration/configuration';
import { CustomHttpUrlEncodingCodec } from '../../app-module/data-providers/encoder';
import { ISummaryItem } from '../models/summary-models';

/**
 * This service handles all communication from the summary component to the server.
 */
@Injectable({
  providedIn: 'root',
})
export class SummaryDataProvider {
  //
  private basePath = apiConfiguration.basePath;
  private summaryPath = apiConfiguration.summaryPath;
  private membersPath = apiConfiguration.membersPath;
  private defaultHeaders = apiConfiguration.defaultHeaders;
  private withCredentials = apiConfiguration.withCredentials;

  constructor(private httpClient: HttpClient, private logger: NGXLogger) {
    this.logger.trace(
      `${SummaryDataProvider.name}: Starting SummaryDataProvider`,
    );
  }

  /**
   * Picks up any upstream errors and throws on the error.
   * @param err An error object
   * @throws Throws the received error object
   */
  #catchError = (err: any): never => {
    this.logger.trace(`${SummaryDataProvider.name}: #catchError called`);
    this.logger.trace(`${SummaryDataProvider.name}: Throwing the error on`);
    throw err;
  };

  /**
   * Get summary data...
   * * TO DO *
   * @param memberId The member id of the member to whom the table belongs.
   * @returns An observable returning the scores table retrieved or created.
   */
  public getSummaryData(
    memberId: number,
    numberWeeks: number,
  ): Observable<Array<ISummaryItem[]>> {
    this.logger.trace(`${SummaryDataProvider.name}: getSummaryData called`);

    if (!memberId || !numberWeeks) {
      throw new Error(
        'A required parameter was invalid when calling getSummaryData.',
      );
    }

    /* set up query parameter */
    let queryParameters = new HttpParams();
    /* custom encoder handles '+' properly */
    const encoder = new CustomHttpUrlEncodingCodec();
    const dateString = encoder.encodeValue(numberWeeks.toString());
    queryParameters = queryParameters.set('weeks', dateString);

    let headers = this.defaultHeaders;
    headers = headers.set('Accept', 'application/json');

    this.logger.trace(
      // eslint-disable-next-line max-len
      `${SummaryDataProvider.name}: Sending GET request to: ${this.basePath}/${this.membersPath}/${memberId}/${this.summaryPath}/`,
    );

    return this.httpClient
      .get<Array<ISummaryItem[]>>(
        `${this.basePath}/${this.membersPath}/${encodeURIComponent(memberId)}/${
          this.summaryPath
        }`,
        {
          headers,
          params: queryParameters,
          withCredentials: this.withCredentials,
        },
      )
      .pipe(
        tap((data: Array<ISummaryItem[]>) => {
          this.logger.trace(
            `${SummaryDataProvider.name}: Received response: ${JSON.stringify(
              data,
            )}`,
          );
        }),
        catchError(this.#catchError),
      );
  }
}
