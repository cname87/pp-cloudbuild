import { Component } from '@angular/core';
import { Location } from '@angular/common';
import { ParamMap, ActivatedRoute } from '@angular/router';
import { MatTableDataSource } from '@angular/material/table';

import { IsLoadingService } from '@service-work/is-loading';
import { NGXLogger } from 'ngx-logger';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { Observable, of, Subject, throwError } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

import { IMember, columnsToDisplay } from '../../data-providers/models/models';
import { RouteStateService } from '../../common/route-state-service/router-state-service';
import { IErrReport } from '../../common/config';
import { SingleSeries } from '@swimlane/ngx-charts';

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
/* Temporary */
type namesData = [string, string, string, string, string, string];
type rowData = Array<string | number>;
type rowsData = [rowData, rowData, rowData, rowData, rowData, rowData];

const rowNames: namesData = [
  'Score',
  'Load',
  'Delta %',
  'Monotony',
  'ACWR',
  'Sessions',
];

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
const summaryTable: rowsData = [
  score,
  load,
  delta,
  monotony,
  acwr,
  sessionsCount,
];

// >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>

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
  #destroy = new Subject<void>();
  #toastrMessage = 'A member access error has occurred';

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
    private isLoadingService: IsLoadingService,
    private location: Location,
    private logger: NGXLogger,
    private toastr: ToastrService,
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

    /* get the data as supplied from the route resolver */
    // this.route.data.pipe(takeUntil(this.destroy)).subscribe((data: Data) => {
    //   this.member$ = data.memberAndSummary.member;
    //   this.#summary$ = data.memberAndSummary.questionaires;
    // });
    this.member$ = of({ id: 1, name: 'testMember' });
    /* loads summary and fills table */
    this.isLoadingService.add(
      of(summaryTable)
        .pipe(
          takeUntil(this.#destroy),
          map((summary) => {
            this.logger.trace(
              `${MemberSummaryComponent.name}: Summary retrieved`,
            );
            return summary;
          }),
        )
        .subscribe((summaryTable: rowsData) => {
          this.dataSource = new MatTableDataSource(summaryTable);
        }),
    );
  }

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
        takeUntil(this.#destroy),
        catchError((err: IErrReport) => {
          this.logger.trace(
            `${MemberSummaryComponent.name}: catchError called`,
          );

          /* inform user and mark as handled */
          this.toastr.error('ERROR!', this.#toastrMessage);
          err.isHandled = true;

          this.logger.trace(
            `${MemberSummaryComponent.name}: Throwing the error on`,
          );
          return throwError(err);
        }),
      )
      .subscribe((id) => this.routeStateService.updateIdState(id));
  }

  ngOnDestroy(): void {
    this.#destroy.next();
    this.#destroy.complete();
  }

  /* Overrides banner goBack function */
  goBackOverride = () => {
    if (this.isChartShown) {
      this.isChartShown = false;
    } else {
      this.location.back();
    }
  };
}
