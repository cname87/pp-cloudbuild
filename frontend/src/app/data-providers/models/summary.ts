/**
 * Summary data.
 */

const numberSummaryDataColumns = 52;

/* used by the summary table */
export const columnsToDisplay = ['item'];
for (let index = 1; index <= numberSummaryDataColumns; index++) {
  columnsToDisplay.push(`wk${index}`);
}
