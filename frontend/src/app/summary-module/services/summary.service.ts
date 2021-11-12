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
   * Returns a blank array that will be filled with summary data.
   * @param numberWeeks The number of date elements in the array to return. (Each element corresponds to a week).
   * @returns An array consisting of a filled in names column and a filled in top dates row. All other cells are 0.
   */
  #getBlankSummaryTable(numberWeeks: number): TSummary {
    this.logger.trace(`${SummaryService.name}: getBlankSummaryTable called`);

    if (numberWeeks <= 0) {
      throw new Error(`${SummaryService.name}:getBlankSummarTable error`);
    }

    /* capture the summary table length */
    const arrayLength = numberWeeks + 1;

    /* create empty array with names column filled and */
    const dates = [rowNames[ERowNumbers.Date]] as TDateData;
    const scores = [rowNames[ERowNumbers.Score]] as TValueData;
    const loads = [rowNames[ERowNumbers.Load]] as TValueData;
    const delta = [rowNames[ERowNumbers.Delta]] as TValueData;
    const monotony = [rowNames[ERowNumbers.Monotony]] as TValueData;
    const acwr = [rowNames[ERowNumbers.ACWR]] as TValueData;
    const sessionsCount = [rowNames[ERowNumbers.Sessions]] as TValueData;
    for (let index = EColumns.Names + 1; index <= numberWeeks; index++) {
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
   * Returns a b array of summary items, i.e. items of form { date: Date, total number }. The last element of the array is last Sunday's date (at 00:00:00.00Z). Each other array element is a date 7 days before it's successor. The field 'total' is zero in each element. The total number of elements equals the input 'numberWeeks' parameter. An extra blank element is also added.
   * @param numberWeeks The number of date elements in the array to return. (Each element coresponds to a week).
   * @returns An array consisting of one blank cell and a set of summary items with the date field being a set of ascending Sundays with the last element being last Sunday's date, and the total field being 0 in each element.
   */

  /**
   * Takes (i) an input array with two elements, both of which are arrays of summary items, i.e. items of form { date: Date, total number }, and (ii) the number of weeks (from last Sunday) that the output summary array will cover. Calls for a blank summary array and fills in the second 2 rows (under the top date row) with the summary totals for each date - any dates that were not in the input array are filled with summary items = 0.
   * The input array must be sorted as [[scores], [sessions]]
   * @param numberWeeks The number of weeks that the output array must cover.
   * @param array2DInputSummaryItems The array of scores and sessions summary item arrays associated with a member in the date range from last Sunday back <numberWeeks> weeks.
   * @returns The filled in summary array.
   */
  #fillValues(
    summaryTable: TSummary,
    array2DInputSummaryItems: Array<ISummaryItem[]>,
  ): TSummary {
    this.logger.trace(`${SummaryService.name}: #fillValues called`);

    array2DInputSummaryItems.forEach((array1DSummaryItems, itemIndex) => {
      /* The input summary item (date/total) array is sorted ascending by date. Compare the output summary table date to the date in the input date/total array and if there is a match store the value under the date in the output array, and increment inputIndex so the next comparison starts at the next date in the input summary item (date/total) array. */
      let inputIndex = 0;
      for (
        let index = EColumns.FirstData;
        index < summaryTable[ERowNumbers.Date].length;
        index++
      ) {
        if (
          summaryTable[ERowNumbers.Date][index] ===
          array1DSummaryItems[inputIndex]?.date
        ) {
          (summaryTable[itemIndex + 1][index] as number) =
            array1DSummaryItems[inputIndex].total;
          inputIndex++;
        }
      }
    });

    return summaryTable;
  }

  /**
   * Fills in the '% Change from Last Week' row
   * @param table A summary table containing a filled in session row.
   * @returns The summary table with the % Delta row filled out.
   */
  #fillDelta(table: TSummary): TSummary {
    const loadRow = table[ERowNumbers.Load];
    const deltaRow = table[ERowNumbers.Delta];
    /* set first data element (which has no predecessor) to 0 */
    deltaRow[EColumns.FirstData] = 0;
    /* set the following values to the delta */
    for (let index = EColumns.FirstData + 1; index < deltaRow.length; index++) {
      const n0 = loadRow[index - 1] as number;
      const n1 = loadRow[index] as number;
      let n2 = n1 !== 0 ? Math.round(((n1 - n0) * 100) / n1) : 0;
      n2 = Math.min(n2, 999);
      n2 = Math.max(-999, n2);
      deltaRow[index] = n2;
    }
    table[ERowNumbers.Delta] = deltaRow;
    return table;
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
      map((dataFromBackend: Array<ISummaryItem[]>): TSummary => {
        const blankSummaryArray = this.#getBlankSummaryTable(numberWeeks);
        const filledValues = this.#fillValues(
          blankSummaryArray,
          dataFromBackend,
        );
        const filledDelta = this.#fillDelta(filledValues);
        return filledDelta;
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
