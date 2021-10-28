import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';
import { ToastrService } from 'ngx-toastr';

import { SummaryDataProvider } from '../data-providers/summary.data-provider';
import { ISummary } from '../data-providers/summary-models';

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
  getSummaryData(memberId: number): Observable<ISummary> {
    this.logger.trace(`${SummaryService.name}: getSummaryData called`);

    return this.summaryDataProvider.getSummaryData(memberId).pipe(
      tap((_data: ISummary) => {
        this.logger.trace(`${SummaryService.name}: Fetched summary data`);
      }),
      catchError(this.#catchError),
    );
  }
}
