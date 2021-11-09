import {
  AfterViewInit,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
} from '@angular/core';
import { ParamMap, ActivatedRoute, Data } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';
import { NGXLogger } from 'ngx-logger';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { SingleSeries } from '@swimlane/ngx-charts';

import {
  TSummary,
  TValueData,
  EColumns,
  ERowNumbers,
  TDateData,
} from '../models/summary-models';
import { RouteStateService } from '../../app-module/services/route-state-service/router-state.service';

/**
 * @title Summary data table and charts
 * This component shows a scrollable table detailing member summary data by week.  A row on the table can be displayed on a bar chart.
 */
@Component({
  selector: 'app-summary',
  templateUrl: './member-summary.component.html',
  styleUrls: ['./member-summary.component.scss'],
  providers: [],
})
export class MemberSummaryComponent implements OnInit, AfterViewInit {
  @ViewChild('scrollframe', { static: false }) scrollFrame!: ElementRef;
  //
  /* used to unsubscribe */
  #destroy$ = new Subject<void>();
  /* raw table data from resolver */
  #data!: TSummary;
  /* unique column names used by the table template */
  #nameColumnToDisplay = '';
  #dataColumnsToDisplay: string[] = [];
  columnsToDisplay: string[] = [];
  /* called in html template to define the names column */
  dataNames: {
    columnDef: string;
    header: string;
    cell: (rowData: Array<string>) => string;
  };
  /* called in html template to define the data columns - a row of data is passed in to get the cell value */
  dataColumns: {
    columnDef: string;
    header: string;
    cell: (rowData: Array<number>) => number;
  }[] = [];
  /* data retrieved from the resolver and displayed in the table */
  dataSource!: MatTableDataSource<TSummary>;
  /* data sent to chart showing one table row of data */
  rowChartData: SingleSeries = [];
  /* x-axis label sent to chart */
  rowName = 'Metric';
  /* shows chart */
  isChartShown = false;

  /**
   * Returns chart data from a supplied summary table row.
   * @param rowData A row of the summary data table.
   * @returns An array containing a column of data to display in the chart.
   */
  #getChartData = (rowData: TValueData): SingleSeries => {
    /* remove the column containing the name */
    const valueData = rowData.slice(EColumns.Names);
    const chartData = [];
    for (let i = 0; i < this.dataColumns.length; i++) {
      chartData[i] = {
        name: this.dataColumns[i].header,
        value: valueData[i] as number,
      };
    }
    return chartData;
  };

  /**
   * Picks up any upstream errors and throws on the error.
   * @param err An error object
   * @throws Throws the received error object
   */
  #catchError = (err: any): never => {
    this.logger.trace(`${MemberSummaryComponent.name}: #catchError called`);
    this.logger.trace(`${MemberSummaryComponent.name}: Throwing the error on`);
    throw err;
  };

  /**
   * Hides the date row by enabling a 'hidden' style in the template.
   * @param row The data for the row
   * @returns True to hide the row
   */
  rowIsHidden = (row: TDateData | TValueData): boolean => {
    return row[EColumns.Names] === this.#data[ERowNumbers.Date][EColumns.Names];
  };

  /**
   * Causes a chart of a supplied summary row to be displayed.
   * Called by a click on a summary table row.
   * @param rowData A row of the summary data table.
   * @returns Void.
   */
  clickRow = (rowData: TValueData): void => {
    this.rowChartData = this.#getChartData(rowData);
    this.rowName = rowData[EColumns.Names] as string;
    this.isChartShown = true;
  };

  constructor(
    private route: ActivatedRoute,
    private routeStateService: RouteStateService,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      `${MemberSummaryComponent.name}: Starting MemberSummaryComponent`,
    );

    /* get summary data from route resolver and load the model which fills and renders the table */
    this.route.data
      .pipe(takeUntil(this.#destroy$), catchError(this.#catchError))
      .subscribe((data: Data) => {
        this.#data = data.summary;
        this.dataSource = new MatTableDataSource<TSummary>(data.summary);
      });

    /* define the column names used by the table template */
    for (let index = 0; index < this.#data[0].length; index++) {
      this.columnsToDisplay.push(`wk${index}`);
    }
    this.#nameColumnToDisplay = this.columnsToDisplay[EColumns.Names];
    this.#dataColumnsToDisplay = this.columnsToDisplay.slice(
      EColumns.FirstData,
    );

    /* define the first column with names */
    this.dataNames = {
      columnDef: this.#nameColumnToDisplay,
      header: '',
      cell: (rowData) => rowData[EColumns.Names],
    };

    /* define the columns that contain the data */
    for (let i = 0; i < this.#dataColumnsToDisplay.length; i++) {
      this.dataColumns[i] = {
        columnDef: this.#dataColumnsToDisplay[i],
        header: this.#data[ERowNumbers.Date].slice(EColumns.FirstData)[i],
        cell: (rowData) => {
          const valueData = rowData.slice(EColumns.FirstData);
          return valueData[i];
        },
      };
    }
  }

  ngOnInit = (): void => {
    /* update service with routed member id */
    this.route.paramMap
      .pipe(
        map((paramMap: ParamMap) => {
          const id = paramMap.get('id');
          if (!id) {
            throw new Error('id path parameter was null');
          }
          return id;
        }),
        takeUntil(this.#destroy$),
        catchError(this.#catchError),
      )
      .subscribe((id) => this.routeStateService.updateIdState(id));
  };

  ngAfterViewInit(): void {
    const matTable = document.getElementById('summary-table');
    if (matTable) {
      matTable.scrollLeft = matTable.scrollWidth;
    }
  }

  ngOnDestroy = (): void => {
    this.logger.trace(`${MemberSummaryComponent.name}: ngDestroy called`);
    this.#destroy$.next();
    this.#destroy$.complete();
    this.routeStateService.updateIdState('');
  };
}
