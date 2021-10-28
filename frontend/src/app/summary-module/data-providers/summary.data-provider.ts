import { Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { NGXLogger } from 'ngx-logger';
import { tap, catchError } from 'rxjs/operators';

import { apiConfiguration } from '../../configuration/configuration';
import { ISummary } from './summary-models';

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
/* Temporary */
type namesData = [string, string, string, string, string, string];
type rowData = Array<string | number>;
type rowsData = [rowData, rowData, rowData, rowData, rowData, rowData];

const rowNames: namesData = [
  'Score',
  'Load',
  'Delta %',
  'Monotony',
  'ACWR',
  'Sessions',
];

const score = [] as unknown as rowData;
score[0] = rowNames[0];
const load = [] as unknown as rowData;
load[0] = rowNames[1];
const delta = [] as unknown as rowData;
delta[0] = rowNames[2];
const monotony = [] as unknown as rowData;
monotony[0] = rowNames[3];
const acwr = [] as unknown as rowData;
acwr[0] = rowNames[4];
const sessionsCount = [] as unknown as rowData;
sessionsCount[0] = rowNames[5];
for (let index = 1; index <= 52; index++) {
  score[index] = Math.round(Math.random() * 100);
  load[index] = Math.round(Math.random() * 100);
  delta[index] = Math.round(Math.random() * 100);
  monotony[index] = Math.round(Math.random() * 100);
  acwr[index] = Math.round(Math.random() * 100);
  sessionsCount[index] = Math.round(Math.random() * 100);
}
const summaryTable: rowsData = [
  score,
  load,
  delta,
  monotony,
  acwr,
  sessionsCount,
];

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

/**
 * This service handles all communication with the server. It implements all the function to create/get or update a weekly scores table on the server.
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
  // private withCredentials = apiConfiguration.withCredentials;

  constructor(
    // private httpClient: HttpClient,
    private logger: NGXLogger,
  ) {
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
  public getSummaryData(memberId: number): Observable<ISummary> {
    this.logger.trace(`${SummaryDataProvider.name}: getSummaryData called`);

    if (!memberId) {
      throw new Error(
        'A required parameter was invalid when calling getSummaryData.',
      );
    }

    let headers = this.defaultHeaders;
    headers = headers.set('Accept', 'application/json');

    this.logger.trace(
      // eslint-disable-next-line max-len
      `${SummaryDataProvider.name}: Sending POST request to: ${this.basePath}/${this.membersPath}/${memberId}/${this.summaryPath}/`,
    );

    // return this.httpClient
    //   .post<any>(
    //     `${this.basePath}/${this.membersPath}/${encodeURIComponent(memberId)}/${
    //       this.summaryPath
    //     }`,
    //     {
    //       headers,
    //       observe: 'body',
    //       responseType: 'json',
    //       withCredentials: this.withCredentials,
    //     },
    //   )
    return of(summaryTable).pipe(
      tap((data: ISummary) => {
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
