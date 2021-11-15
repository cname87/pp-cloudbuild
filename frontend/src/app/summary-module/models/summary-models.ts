/**
 * Summary table types and constants.
 */

export type TDateData = string[];
export type TValueData = [string, ...number[]];
export type TSummary = [
  TDateData,
  TValueData,
  TValueData,
  TValueData,
  TValueData,
  TValueData,
  TValueData,
];

export interface ISummaryItem {
  date: string;
  total: number;
}

export interface ISessionsSummaryItem extends ISummaryItem {
  count: number;
  average: number;
  stdDev: number;
}

/* identify date row number */
export enum ERowNumbers {
  'Date' = 0,
}

/* identify names and first data column numbers */
export enum EColumns {
  'Names' = 0,
  'FirstData' = 1,
}
