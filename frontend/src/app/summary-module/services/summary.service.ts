import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';
import { ToastrService } from 'ngx-toastr';

import { UtilsService } from '../../app-module/services/utils-service/utils.service';
import {
  rowData,
  rowNames,
  ISummary,
  ISummaryItem,
} from '../models/summary-models';
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
    private utils: UtilsService,
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
    this.logger.trace(`${SummaryService.name}: #catchError called`);
    this.logger.trace(`${SummaryService.name}: Displaying a toastr message`);
    this.toastr.error('ERROR!', toastrMessage);
    this.logger.trace(`${SummaryService.name}: Throwing the error on`);
    throw err;
  };

  /**
   * Returns an array of summary items, i.e. items of form { date: Date, total number }.  The length of the array is given by an input parameter. The last element of the array is last Sunday's date (at 00:00:00.00Z). Each other array element is 7 days before it's successor. The field 'total' is zero in each element.
   * @param numberWeeks The length of the array to return. (Each element coresponds to a week).
   * @returns An array of summary items with the date field being a set of ascending Sundays withthe last element being last Sunday's date, and the total field being 0.
   */
  #getBlankSummaryRow(numberWeeks: number): ISummaryItem[] {
    if (numberWeeks < 0) {
      throw new Error(`${SummaryService.name}:getBlankSummaryRow error`);
    }
    const outputRow = [];
    const lastSunday = this.utils.getLastSunday();
    outputRow[0] = { date: lastSunday.toISOString(), total: 0 };
    for (let index = 1; index < numberWeeks; index++) {
      lastSunday.setDate(lastSunday.getDate() - 7);
      outputRow.unshift({ date: lastSunday.toISOString(), total: 0 });
    }
    /* check output array length is correct */
    if (outputRow.length !== numberWeeks) {
      throw new Error(`${SummaryService.name}:getBlankSummaryRow error`);
    }
    return outputRow;
  }

  /**
   * Takes an input array of summary items, i.e. items of form { date: Date, total number }, associated with the scores tables stored for a member, and the number of weeks (from last Sunday) that the array covers and returns an array of summary items with a summary item for each date - any dates that were not in the input array are filled with a summary item with total = 0.
   * @param numberWeeks The number of weeks that the output array must cover.
   * @param inputSummaryItems The array of summary items associated with a member in the date range from last Sunday back numberWeeks.
   * @returns An array of summary items of length given by numberWeeks, with dates from last Sunday backwards and the total field taken from the input array, if it exists, or = 0, it=f it didn't.
   */
  #fillScoresRow(numberWeeks: number, inputSummaryItems: ISummaryItem[]) {
    const outputRow = this.#getBlankSummaryRow(numberWeeks);
    let inputIndex = 0;
    const mapDates = (item: ISummaryItem) => {
      if (item.date === inputSummaryItems[inputIndex].date) {
        item.total = inputSummaryItems[inputIndex].total;
        inputIndex++;
      }
    };
    outputRow.map(mapDates);
    return outputRow;
  }

  /**
   * Gets summary data.
   * * TO DO *
   * @returns An observable containing a summary data object.
   * @throws See #catchError.
   */
  getSummaryData(
    memberId: number,
    numberWeeks = this.#defaultWeeksToRetrieve,
  ): Observable<any> {
    this.logger.trace(`${SummaryService.name}: getSummaryData called`);

    return this.summaryDataProvider.getSummaryData(memberId, numberWeeks).pipe(
      map((scoresArray: any) => {
        const filledScoresRow = this.#fillScoresRow(numberWeeks, scoresArray);
        for (let index = 0; index < numberWeeks; index++) {
          summaryTable[0][index] = filledScoresRow[index].total;
        }
        return summaryTable as any;
      }),
      tap((scoresTotals: ISummaryItem[]) => {
        this.logger.trace(`${SummaryService.name}: Fetched summary data`);
        console.log(`Summary data retrieved: ${JSON.stringify(scoresTotals)}`);
      }),
      catchError(this.#catchError),
    );
  }
}
