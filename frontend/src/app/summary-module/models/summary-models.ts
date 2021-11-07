/**
 * Summary table types and constants.
 */

export interface ISummaryItem {
  date: string;
  total: number;
}

type namesData = [string, string, string, string, string, string];
export type rowData = Array<string | number>;
export type ISummary = [rowData, rowData, rowData, rowData, rowData, rowData];

const numberSummaryDataColumns = 52;

export const rowNames: namesData = [
  'Score',
  'Load',
  'Delta %',
  'Monotony',
  'ACWR',
  'Sessions',
];

/* used by the summary table */
export const columnsToDisplay = ['item'];
for (let index = 1; index <= numberSummaryDataColumns; index++) {
  columnsToDisplay.push(`wk${index}`);
}
