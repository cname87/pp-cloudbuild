/**
 * Handles calls to <api-prefix>/members/{mid}/summary?weeks={n}
 */

import { Request, Response, NextFunction } from 'express';
import { Context } from 'openapi-backend';
import { setupDebug } from '../utils/src/debugOutput';
import { getLastSunday } from '../handlers/utilities';
import { setup } from './shared'

const { modulename, debug } = setupDebug(__filename);

/* the name of query parmeter in the url */
const filter = 'weeks';

/* the row names in the summary data array */
const rowNames = [
  '',
  'Wellness Score Total',
  'Sessions Load Total',
  '% Change From Last Week',
  'Number of Sessions',
  'Sessions Load Average',
  'Monotony',
  'Strain',
  'ACWR',
];

/* identify row numbers */
const enum ERowNumbers {
  'Date' = 0,
  'Score' = 1,
  'Load' = 2,
  'Delta' = 3,
  'Sessions' = 4,
  'Average' = 5,
  'Monotony' = 6,
  'Strain' = 7,
  'ACWR' = 8,
}

/* identify names and first data column numbers */
const enum EColumns {
  'Names' = 0,
  'FirstData' = 1,
}

/**
 * Returns a blank summary data array that will be filled with summary data.
 * @param numberWeeks The number of date elements in the array to return. (Each element corresponds to a week).
 * @returns An array consisting of a filled in names column and a filled in top dates row. All other cells are 0.
 */
const getBlankSummaryTable = (numberWeeks: number): Summary.TSummary => {
  debug(`${modulename}: getBlankSummaryTable called`);

  if (numberWeeks <= 0) {
    throw new Error(`${modulename}: getBlankSummarTable error`);
  }

  /* capture the array rows length, ie date column + data columns */
  const arrayLength = numberWeeks + 1;

  /* create empty array with names column filled and */
  const dates = [rowNames[ERowNumbers.Date]] as Summary.TDateData;
  const scores = [rowNames[ERowNumbers.Score]] as Summary.TValueData;
  const loads = [rowNames[ERowNumbers.Load]] as Summary.TValueData;
  const delta = [rowNames[ERowNumbers.Delta]] as Summary.TValueData;
  const sessionsCount = [rowNames[ERowNumbers.Sessions]] as Summary.TValueData;
  const sessionsAverage = [rowNames[ERowNumbers.Average]] as Summary.TValueData;
  const monotony = [rowNames[ERowNumbers.Monotony]] as Summary.TValueData;
  const strain = [rowNames[ERowNumbers.Strain]] as Summary.TValueData;
  const acwr = [rowNames[ERowNumbers.ACWR]] as Summary.TValueData;
  /* let every oher cell = 0 */
  for (let index: number = EColumns.FirstData; index < arrayLength; index++) {
    scores[index] = 0;
    loads[index] = 0;
    delta[index] = 0;
    sessionsCount[index] = 0;
    sessionsAverage[index] = 0;
    monotony[index] = 0;
    strain[index] = 0;
    acwr[index] = 0;
  }
  const summaryTable: Summary.TSummary = [
    dates,
    scores,
    loads,
    delta,
    sessionsCount,
    sessionsAverage,
    monotony,
    strain,
    acwr,
  ];

  /** load dates into the dates row */

  /* load last Sunday's date into first column but later shift it right */
  const lastSunday = getLastSunday();
  summaryTable[ERowNumbers.Date][EColumns.Names] = lastSunday.toISOString();
  /* add preceding dates shifting the most recent date (last Sunday) to the right */
  for (let index = 1; index < numberWeeks; index++) {
    lastSunday.setUTCDate(lastSunday.getUTCDate() - 7);
    summaryTable[ERowNumbers.Date].unshift(lastSunday.toISOString());
  }
  /* add name cell */
  summaryTable[ERowNumbers.Date].unshift(rowNames[ERowNumbers.Date]);

  /* check output array length is correct */
  if (summaryTable[ERowNumbers.Date].length !== arrayLength) {
    throw new Error(`${modulename}:getBlankSummaryTable error`);
  }

  return summaryTable;
};

/**
 * Takes (i) an input array with two elements, an array of scores summaries and an array of sessions summaries from the back end, and (ii) the number of weeks (from last Sunday) that the output summary array will cover. Calls for a blank summary array and fills in the second 2 rows (under the top date row) with the scores and sessions summary totals for each date - any dates that were not in the input array are filled with summary items = 0.
 * @param summaryTable The output summary table object.
 * @param array2DInputSummaryItems The array of scores and sessions summary item arrays retrieved from the backend and associated with a member in the date range from last Sunday back <numberWeeks> weeks.
 The input array must be sorted as [[scores], [sessions]]
 * @returns The filled in summary array.
 */
const fillValues = (
  summaryTable: Summary.TSummary,
  array2DInputSummaryItems: [Summary.TScoresSummaryItems, Summary.TSessionsSummaryItems],
): Summary.TSummary => {
  debug(`${modulename}: #fillValues called`);

  console.log(array2DInputSummaryItems);
  array2DInputSummaryItems.forEach((array1DSummaryItems, _itemIndex) => {
    /* The input summary item array is sorted ascending by date. Compare the output summary table date to the date in the input array and if there is a match store the values under the date in the output array, and increment inputIndex so the next comparison starts at the next date in the input summary item array. */
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
        const summaryItem = array1DSummaryItems[inputIndex];
        if ('scoresTotal' in summaryItem) {
          (summaryTable[ERowNumbers.Score][index] as number) =
            summaryItem.scoresTotal;
        }
        if ('sessionsTotal' in summaryItem) {
          (summaryTable[ERowNumbers.Load][index] as number) =
            summaryItem.sessionsTotal;
        }
        if ('count' in summaryItem) {
          (summaryTable[ERowNumbers.Sessions][index] as number) =
            summaryItem.count;
        }
        if ('average' in summaryItem) {
          (summaryTable[ERowNumbers.Average][index] as number) =
            summaryItem.average;
        }
        if ('stdDev' in summaryItem  && summaryItem.stdDev) {
          /* calculate monotony as a percentage*/
          const monotony = summaryItem.average / summaryItem.stdDev;
          (summaryTable[ERowNumbers.Monotony][index] as number) =
            Math.round((monotony + Number.EPSILON) * 100) / 100;
          /* calculate strain */
          (summaryTable[ERowNumbers.Strain][index] as number) =
            Math.round(summaryItem.sessionsTotal * monotony);
        }
        inputIndex++;
      }
    }
  });
  return summaryTable;
};

/**
 * Fills in the '% Change from Last Week' row, i.e. the % change in the Sessions total since last week.
 * @param table A summary table containing a filled in session row.
 * @returns The summary table with the % Change From Last Week row filled out.
 */
const fillDelta = (table: Summary.TSummary): Summary.TSummary => {
  const loadRow = table[ERowNumbers.Load];
  const deltaRow = table[ERowNumbers.Delta];
  /* set first data element (which has no predecessor) to 0 */
  deltaRow[EColumns.FirstData] = 0;
  /* set the following values to the delta */
  for (let index = EColumns.FirstData + 1; index < deltaRow.length; index++) {
    const n0 = loadRow[index - 1] as number;
    const n1 = loadRow[index] as number;
    let n2 = n0 !== 0 ? Math.round(((n1 - n0) * 100) / n0) : 0;
    n2 = Math.min(n2, 999);
    n2 = Math.max(-999, n2);
    deltaRow[index] = n2;
  }
  table[ERowNumbers.Delta] = deltaRow;
  return table;
};

/**
 * Fills in the 'ACWR' row, i.e. the average of the last 4 Sessions totals.
 * @param table A summary table containing a filled in session row.
 * @returns The summary table with the WCR row filled out.
 */
const fillACWR = (table: Summary.TSummary): Summary.TSummary => {
  const loadRow = table[ERowNumbers.Load];
  const acwrRow = table[ERowNumbers.ACWR];

  for (let index = +EColumns.FirstData; index < acwrRow.length; index++) {
    const n0 = +loadRow[index];
    /* ensure no negative indexes in 4 week average calculation*/
    const n1 = index - 1 > 0 ? +loadRow[index - 1] : 0;
    const n2 = index - 2 > 0 ? +loadRow[index - 2] : 0;
    const n3 = index - 3 > 0 ? +loadRow[index - 3] : 0;
    const n4 = index - 4 > 0 ? +loadRow[index - 4] : 0;
    /* ACWR to two significant places and left as zero if the 4 week average is 0 */
    acwrRow[index] = (n1 +n2 + n3 + n4) ? ((4 * n0)/(n1 + n2 +n3 + n4)).toPrecision(2) : 0;
  }
  table[ERowNumbers.ACWR] = acwrRow;
  return table;
};

const getSummary = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  debug(`${modulename}: running getSummary`);

  const {
    mid,
    queryString,
    summaryHandlers,
    miscHandlers,
    dumpError,
  } = setup(context, filter, req, next)!;

  const weeksRequested = +queryString;

  summaryHandlers
    .getSummary(req, mid, weeksRequested)
    .then((payload: [Summary.TScoresSummaryItems, Summary.TSessionsSummaryItems]) => {

      /* convert dates from Date objects to ISO strings */
      payload.map((element) => {
        element.map((element) => {
            element.date = (element.date as Date).toISOString();
        })
      })

      const blankSummaryArray = getBlankSummaryTable(weeksRequested);
      const filledScoresAndSessions = fillValues(
        blankSummaryArray,
        payload,
      );
      const filledDelta = fillDelta(filledScoresAndSessions);
      const filled = fillACWR(filledDelta);

      miscHandlers.writeJson(context, req, res, next, 200, filled);
    })
    .catch((err: any) => {
     console.error(`${modulename}: getSummary returned error`);
      dumpError(err);
      next(err);
    });
};

export const summaryApi = {
  getSummary,
};
