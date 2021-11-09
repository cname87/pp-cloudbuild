/**
 * Summary table types and constants.
 */

export type TDateData = string[];
export type TValueData = Array<string | number>;
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

/* identify row numbers */
export enum ERowNumbers {
  'Date' = 0,
  'Score' = 1,
  'Load' = 2,
  'Delta' = 3,
  'Monotony' = 4,
  'ACWR' = 5,
  'Sessions' = 6,
}

/* identify names and first data column numbers */
export enum EColumns {
  'Names' = 0,
  'FirstData' = 1,
}

export const rowNames = [
  '',
  'Score',
  'Load',
  'Delta %',
  'Monotony',
  'ACWR',
  'Sessions',
];
