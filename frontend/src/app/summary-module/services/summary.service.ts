import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';
import { ToastrService } from 'ngx-toastr';

import { rowData, rowNames, ISummary } from '../models/summary-models';
import { SummaryDataProvider } from '../data-providers/summary.data-provider';

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
/* Temporary */

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
const summaryTable: ISummary = [
  score,
  load,
  delta,
  monotony,
  acwr,
  sessionsCount,
];

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

/**
 * This service provides functions to access summary data on the backend database.
 */
@Injectable({ providedIn: 'root' })
export class SummaryService {
  constructor(
    private summaryDataProvider: SummaryDataProvider,
    private logger: NGXLogger,
    private toastr: ToastrService,
  ) {
    this.logger.trace(`${SummaryService.name}: starting SummaryService`);
  }

  /**
   * Picks up any upstream errors, displays a toaster message and throws on the error.
   * @param err An error object
   * @throws Throws the received error object
   */
  #catchError = (err: any): never => {
    this.logger.trace(`${SummaryService.name}: #catchError called`);
    /* error message displayed to the user for all update fails */
    const toastrMessage = 'A table update error has occurred';
    this.logger.trace(`${SummaryService.name}: #catchError called`);
    this.logger.trace(`${SummaryService.name}: Displaying a toastr message`);
    this.toastr.error('ERROR!', toastrMessage);
    this.logger.trace(`${SummaryService.name}: Throwing the error on`);
    throw err;
  };

  /**
   * Gets summary data.
   * * TO DO *
   * @returns An observable containing a summary data object.
   * @throws See #catchError.
   */
  getSummaryData(memberId: number, date: Date): Observable<ISummary> {
    this.logger.trace(`${SummaryService.name}: getSummaryData called`);

    return this.summaryDataProvider.getSummaryData(memberId, date).pipe(
      tap((_data: ISummary) => {
        this.logger.trace(`${SummaryService.name}: Fetched summary data`);
        console.log(summaryTable);
      }),
      catchError(this.#catchError),
    );
  }
}
