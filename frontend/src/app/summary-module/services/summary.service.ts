import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';
import { ToastrService } from 'ngx-toastr';

import { TSummary } from '../models/summary-models';
import { SummaryDataProvider } from '../data-providers/summary.data-provider';

/**
 * This service provides functions to access summary data for a member on the backend database.
 */
@Injectable({ providedIn: 'root' })
export class SummaryService {
  constructor(
    private summaryDataProvider: SummaryDataProvider,
    private toastr: ToastrService,
    private logger: NGXLogger,
  ) {
    this.logger.trace(`${SummaryService.name}: starting SummaryService`);
  }

  /* default number of weeks of data to request from the server */
  #defaultWeeksToRetrieve = 52;

  /**
   * Picks up any upstream errors, displays a toaster message and throws on the error.
   * @param err An error object
   * @throws Throws the received error object
   */
  #catchError = (err: any): never => {
    this.logger.trace(`${SummaryService.name}: #catchError called`);
    /* error message displayed to the user for all update fails */
    const toastrMessage = 'A table update error has occurred';
    this.logger.trace(`${SummaryService.name}: Displaying a toastr message`);
    this.toastr.error('ERROR!', toastrMessage);
    this.logger.trace(`${SummaryService.name}: Throwing the error on`);
    throw err;
  };

  /**
   * Returns the filled summary data table for display.
   * @returns An observable containing a filled summary data table object for display.
   * @throws See #catchError.
   */
  getSummaryData(
    memberId: number,
    numberWeeks = this.#defaultWeeksToRetrieve,
  ): Observable<TSummary> {
    this.logger.trace(`${SummaryService.name}: getSummaryData called`);

    return this.summaryDataProvider.getSummaryData(memberId, numberWeeks).pipe(
      tap((_scoresTotals: TSummary) => {
        this.logger.trace(`${SummaryService.name}: Fetched summary data`);
      }),
      catchError(this.#catchError),
    );
  }
}
