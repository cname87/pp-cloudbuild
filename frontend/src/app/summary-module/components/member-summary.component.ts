import { Component } from '@angular/core';
// import { Location } from '@angular/common';
import { ParamMap, ActivatedRoute, Data } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';

import { NGXLogger } from 'ngx-logger';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';

import { IMember } from '../../app-module/models/member';
import { columnsToDisplay } from '../models/summary-models';

import { RouteStateService } from '../../app-module/services/route-state-service/router-state.service';
import { SingleSeries } from '@swimlane/ngx-charts';

type rowData = Array<string | number>;

/**
 * @title This component shows a scrollable table detailing all summary data by week linked to a member.
 */
@Component({
  selector: 'app-summary',
  templateUrl: './member-summary.component.html',
  styleUrls: ['./member-summary.component.scss'],
  providers: [],
})
export class MemberSummaryComponent {
  //
  /* used to unsubscribe */
  #destroy$ = new Subject<void>();
  member$!: Observable<IMember>;
  /* sets which columns to display */
  #nameColumnToDisplay: string;
  #dataColumnsToDisplay: string[];
  columnsToDisplay: string[];
  /* defines the names column */
  dataNames: {
    columnDef: string;
    header: string;
    cell: (rowData: Array<string>) => string;
  };
  /* defines the data columns */
  dataColumns: {
    columnDef: string;
    header: Date;
    cell: (rowData: Array<number>) => number;
  }[] = [];
  /* data sent to the table */
  dataSource!: MatTableDataSource<rowData>;
  /* data sent to chart showing one table row of data */
  rowChartData: SingleSeries = [];
  rowName = 'Metric';
  isChartShown = false;

  /* generate chart data */
  getChartData = (rowData: rowData) => {
    const valueData = rowData.slice(1);
    for (let i = 0; i < this.dataColumns.length; i++) {
      this.rowChartData[i] = {
        name: this.dataColumns[i].header,
        value: valueData[i] as number,
      };
    }
  };

  /* call up a chart of a summary row */
  clickRow = (rowData: rowData) => {
    this.getChartData(rowData);
    this.rowName = rowData[0] as string;
    this.isChartShown = true;
  };

  constructor(
    private route: ActivatedRoute,
    private routeStateService: RouteStateService,
    // private location: Location,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      `${MemberSummaryComponent.name}: Starting MemberSummaryComponent`,
    );

    /* define the displayed columns */
    this.#nameColumnToDisplay = columnsToDisplay[0];
    this.#dataColumnsToDisplay = columnsToDisplay.slice(1);
    this.columnsToDisplay = columnsToDisplay;

    /* define the first column */
    this.dataNames = {
      columnDef: this.#nameColumnToDisplay,
      header: '',
      cell: (rowData) => rowData[0],
    };

    /* define the columns that contain the data */
    const addDays = (date: Date, numDays: number) => {
      const newDate = new Date();
      newDate.setDate(date.getDate() + numDays);
      return newDate;
    };
    for (let i = 0; i < this.#dataColumnsToDisplay.length; i++) {
      const firstDate = new Date();
      const date = addDays(firstDate, 7 * i);
      this.dataColumns[i] = {
        columnDef: this.#dataColumnsToDisplay[i],
        header: date,
        cell: (rowData) => {
          const valueData = rowData.slice(1);
          return valueData[i];
        },
      };
    }

    /* get data from route resolver and load the model which fills and renders the table */
    /* Note: loading in constructor to avoid angular change after checked error */
    this.route.data
      .pipe(takeUntil(this.#destroy$), catchError(this.#catchError))
      .subscribe((data: Data) => {
        this.dataSource = new MatTableDataSource(data.summary);
      });
  }

  /**
   * Picks up any upstream errors, displays a toaster message and throws on the error.
   * @param err An error object
   * @throws Throws the received error object
   */
  #catchError = (err: any): never => {
    this.logger.trace(`${MemberSummaryComponent.name}: #catchError called`);
    this.logger.trace(`${MemberSummaryComponent.name}: Throwing the error on`);
    throw err;
  };

  ngOnInit() {
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
  }

  ngOnDestroy = (): void => {
    this.logger.trace(`${MemberSummaryComponent.name}: #ngDestroy called`);
    this.#destroy$.next();
    this.#destroy$.complete();
    this.routeStateService.updateIdState('');
  };
}
