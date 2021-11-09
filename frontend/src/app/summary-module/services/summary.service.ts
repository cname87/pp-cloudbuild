import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';
import { ToastrService } from 'ngx-toastr';

import { UtilsService } from '../../app-module/services/utils-service/utils.service';
import {
  TDateData,
  TValueData,
  TSummary,
  ISummaryItem,
  ERowNumbers,
  EColumns,
  rowNames,
} from '../models/summary-models';
import { SummaryDataProvider } from '../data-providers/summary.data-provider';

/**
 * This service provides functions to access summary data for a member on the backend database.
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
   * Returns an array of summary items, i.e. items of form { date: Date, total number }. The last element of the array is last Sunday's date (at 00:00:00.00Z). Each other array element is a date 7 days before it's successor. The field 'total' is zero in each element. The total number of elements equals the input 'numberWeeks' parameter. An extra blank element is also added.
   * @param numberWeeks The number of date elements in the array to return. (Each element coresponds to a week).
   * @returns An array consisting of one blank cell and a set of summary items with the date field being a set of ascending Sundays with the last element being last Sunday's date, and the total field being 0 in each element.
   */
  #getBlankSummaryTable(numberWeeks: number): TSummary {
    this.logger.trace(`${SummaryService.name}: getBlankSummaryTable called`);

    if (numberWeeks <= 0) {
      throw new Error(`${SummaryService.name}:getBlankSummarTable error`);
    }

    /* capture the summary table length */
    const arrayLength = numberWeeks + 1;

    /* create empty array with names column filled and */
    const dates = [] as TDateData;
    dates[EColumns.Names] = rowNames[ERowNumbers.Date];
    const scores = [] as TValueData;
    scores[EColumns.Names] = rowNames[ERowNumbers.Score];
    const loads = [] as TValueData;
    loads[EColumns.Names] = rowNames[ERowNumbers.Load];
    const delta = [] as TValueData;
    delta[EColumns.Names] = rowNames[ERowNumbers.Delta];
    const monotony = [] as TValueData;
    monotony[EColumns.Names] = rowNames[ERowNumbers.Monotony];
    const acwr = [] as TValueData;
    acwr[EColumns.Names] = rowNames[ERowNumbers.ACWR];
    const sessionsCount = [] as TValueData;
    sessionsCount[EColumns.Names] = rowNames[ERowNumbers.Sessions];
    for (let index = 1; index <= numberWeeks; index++) {
      scores[index] = 0;
      loads[index] = 0;
      delta[index] = 0;
      monotony[index] = 0;
      acwr[index] = 0;
      sessionsCount[index] = 0;
    }
    const summaryTable: TSummary = [
      dates,
      scores,
      loads,
      delta,
      monotony,
      acwr,
      sessionsCount,
    ];

    /* load dates into the dates row */
    const lastSunday = this.utils.getLastSunday();
    summaryTable[ERowNumbers.Date][EColumns.Names] = lastSunday.toISOString();
    for (let index = 1; index < numberWeeks; index++) {
      lastSunday.setUTCDate(lastSunday.getUTCDate() - 7);
      summaryTable[ERowNumbers.Date].unshift(lastSunday.toISOString());
    }
    /* add name cell */
    summaryTable[ERowNumbers.Date].unshift(rowNames[ERowNumbers.Date]);

    /* check output array length is correct */
    if (summaryTable[ERowNumbers.Date].length !== arrayLength) {
      throw new Error(`${SummaryService.name}:getBlankSummaryTable error`);
    }

    return summaryTable;
  }

  /**
   * Takes an input array of summary items, i.e. items of form { date: Date, total number }, associated with the scores tables stored for a member, and the number of weeks (from last Sunday) that the array covers and returns an array of summary items with a summary item for each date - any dates that were not in the input array are filled with a summary item with total = 0.
   * @param numberWeeks The number of weeks that the output array must cover.
   * @param inputSummaryItems The array of summary items associated with a member in the date range from last Sunday back numberWeeks.
   * @returns An array of summary items of length given by numberWeeks, with dates from last Sunday backwards and the total field taken from the input array, if it exists, or = 0, it=f it didn't.
   */
  #fillScores(
    numberWeeks: number,
    inputSummaryItems: ISummaryItem[],
  ): TSummary {
    this.logger.trace(`${SummaryService.name}: #fillScores called`);

    const arrayLength = numberWeeks + 1;
    const summaryTable = this.#getBlankSummaryTable(numberWeeks);

    /* The input date/total array is sorted ascending by date. Compare the table date to the date in the input date/total array and if there is a match store the score value and increment inputIndex so the next comparison starts at the next date in the input date/total array. */
    let inputIndex = 0;
    for (let index = EColumns.FirstData; index < arrayLength; index++) {
      if (
        summaryTable[ERowNumbers.Date][index] ===
        inputSummaryItems[inputIndex]?.date
      ) {
        summaryTable[ERowNumbers.Score][index] =
          inputSummaryItems[inputIndex].total;
        inputIndex++;
      }
    }
    return summaryTable;
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
  getSummaryData(
    memberId: number,
    numberWeeks = this.#defaultWeeksToRetrieve,
  ): Observable<TSummary> {
    this.logger.trace(`${SummaryService.name}: getSummaryData called`);

    return this.summaryDataProvider.getSummaryData(memberId, numberWeeks).pipe(
      map((scoresArray: ISummaryItem[]): TSummary => {
        const filledScores = this.#fillScores(numberWeeks, scoresArray);
        return filledScores;
      }),
      tap((scoresTotals: TSummary) => {
        this.logger.trace(
          `${SummaryService.name}: Fetched summary data:\n${JSON.stringify(
            scoresTotals,
          )}`,
        );
      }),
      catchError(this.#catchError),
    );
  }
}
