import { Component, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core/';
import { IsLoadingService } from '@service-work/is-loading';
import { NGXLogger } from 'ngx-logger';
import { ToastrService } from 'ngx-toastr';
import { Observable, of, Subject, throwError } from 'rxjs';
import { takeUntil, map, catchError } from 'rxjs/operators';
import { EventEmitter } from 'events';

import { IErrReport } from '../../common/configuration';
import { IMember } from '../../common/data-providers/members.data-provider';
import { IScores, earliestDate } from '../data-providers/scores-models';

import { RouteStateService } from '../../common/services/route-state-service/router-state-service';
import { ScoresService } from '../services/scores.service';

/**
 * @title This component shows a form table allowing weekly score results for a member to be viewed and entered or edited.
 */
@Component({
  selector: 'app-scores',
  styleUrls: ['./member-scores.component.scss'],
  templateUrl: './member-scores.component.html',
})
export class MemberScoresComponent implements OnDestroy {
  //
  /* used to report table change */
  #tableChange = new EventEmitter();
  /* used to unsubscribe */
  #destroy$ = new Subject<void>();
  /* min width used in the datatable */
  #minWidth = 54;
  /* error message displayed to the user */
  #toastrMessage = 'A data access error has occurred';
  /* ngx-datatable columns */
  #columns = [
    {
      name: 'Item',
      prop: 'item',
      minWidth: this.#minWidth * 2,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 2,
      summaryFunc: () => {
        return `TOTALS:`;
      },
    },
    {
      name: 'Mon',
      prop: 'monday',
      minWidth: this.#minWidth,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 1,
      summaryFunc: (cells: number[]) => this.#sum(cells),
    },
    {
      name: 'Tue',
      prop: 'tuesday',
      minWidth: this.#minWidth,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 1,
      summaryFunc: (cells: number[]) => this.#sum(cells),
    },
    {
      name: 'Wed',
      prop: 'wednesday',
      minWidth: this.#minWidth,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 1,
      summaryFunc: (cells: number[]) => this.#sum(cells),
    },
    {
      name: 'Thu',
      prop: 'thursday',
      minWidth: this.#minWidth,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 1,
      summaryFunc: (cells: number[]) => this.#sum(cells),
    },
    {
      name: 'Fri',
      prop: 'friday',
      minWidth: this.#minWidth,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 1,
      summaryFunc: (cells: number[]) => this.#sum(cells),
    },
    {
      name: 'Sat',
      prop: 'saturday',
      minWidth: this.#minWidth,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 1,
      summaryFunc: (cells: number[]) => this.#sum(cells),
    },
    {
      name: 'Sun',
      prop: 'sunday',
      minWidth: this.#minWidth,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 1,
      cellClass: 'scoresColumnRight',
      summaryFunc: (cells: number[]) => this.#sum(cells),
    },
  ];
  /* table select options */
  #dropdown = [
    { value: 0, label: '' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
  ];
  #debounceDelay = 1500;
  #changeTimerId!: NodeJS.Timeout;
  member$ = of({}) as Observable<IMember>;
  form = new FormGroup({});
  model$!: Observable<IScores>;
  model!: IScores;
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[] = [
    {
      template:
        // eslint-disable-next-line max-len
        '<div class="table-help">Select 1 to 5, where 1 is the WORST feeling and 5 is the BEST feeling<br>e.g. high stress is 1 and low stress is 5</div>',
    },
    {
      fieldGroup: [
        {
          key: 'date',
          type: 'datepicker',
          /* A date is entered as midnight local time but is stored as a UTC string.  UTC might be different from local time, e.g. one hour behind which means the UTC value is 23.00 of the day before which means the date stored could be a time during the day before. This causes problems if you pass the UTC value to calculate the date. To avoid this, subtract the local UTC offset from the stored value. EG: If IST is 60min ahead of UTC then July 4th 00:00 IST is stored as July 3rd 23:00 UTC.  In this case the IST offset from UTC is -60 min.  Subtracting -60min from the stored value results in the updated stored UTC value being July 4th 00:00 UTC - i.e. if it is used to calculate a date it will return the correct date of July 4th.*/
          parsers: [
            (date) => {
              return new Date(
                date.getTime() - date.getTimezoneOffset() * 60 * 1000,
              );
            },
          ],
          templateOptions: {
            required: true,
            readonly: true,
            datepickerOptions: {
              /* allow only a certain period of dates be shown */
              max: new Date(),
              min: earliestDate,
              dateChange: () => this.#onDateChange(),
              /* allow only Sunday's be shown */
              filter: (date: Date | null): boolean => {
                const enum DayOfTheWeek {
                  'Sunday' = 0,
                }
                const today = new Date();
                date = date || today;
                const dayOfTheWeek = date.getDay();
                return dayOfTheWeek === DayOfTheWeek.Sunday;
              },
            },
          },
        },
      ],
    },
    {
      /* define the ngx-datatable */
      key: 'scores',
      type: 'datatable',
      templateOptions: {
        columns: this.#columns,
        /* passes an event emitter that is used to signal model changes to the datatable (which causes the datatable to be redrawn) */
        tableChange: this.#tableChange,
      },
      fieldArray: {
        fieldGroup: [
          {
            key: 'item',
            type: 'input',
            templateOptions: {
              type: 'text',
              disabled: true,
            },
          },
          {
            key: 'monday',
            type: 'select',
            templateOptions: {
              options: this.#dropdown,
              change: () => this.#onTableChange(),
            },
          },
          {
            key: 'tuesday',
            type: 'select',
            templateOptions: {
              options: this.#dropdown,
              change: () => this.#onTableChange(),
            },
          },
          {
            key: 'wednesday',
            type: 'select',
            templateOptions: {
              options: this.#dropdown,
              change: () => this.#onTableChange(),
            },
          },
          {
            key: 'thursday',
            type: 'select',
            templateOptions: {
              options: this.#dropdown,
              change: () => this.#onTableChange(),
            },
          },
          {
            key: 'friday',
            type: 'select',
            templateOptions: {
              options: this.#dropdown,
              change: () => this.#onTableChange(),
            },
          },
          {
            key: 'saturday',
            type: 'select',
            templateOptions: {
              options: this.#dropdown,
              change: () => this.#onTableChange(),
            },
          },
          {
            key: 'sunday',
            type: 'select',
            templateOptions: {
              options: this.#dropdown,
              change: () => this.#onTableChange(),
            },
          },
        ],
      },
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private routeStateService: RouteStateService,
    private scoresService: ScoresService,
    private isLoadingService: IsLoadingService,
    private logger: NGXLogger,
    private toastr: ToastrService,
  ) {
    this.logger.trace(
      `${MemberScoresComponent.name}: Starting MemberScoresComponent`,
    );
    /* get data from route resolver */
    this.route.data
      .pipe(takeUntil(this.#destroy$), catchError(this.#catcherror))
      .subscribe((data) => {
        this.member$ = data.memberAndScores.member$;
        this.model$ = data.memberAndScores.scores$;
      });
    /* load the model which fills the table */
    /* Note: loading in constructor to avoid angular change after checked error */
    this.isLoadingService.add(
      this.model$
        .pipe(takeUntil(this.#destroy$), catchError(this.#catcherror))
        .subscribe((model: IScores) => {
          this.model = model;
        }),
    );
    /* update route state service with routed member id */
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
        catchError(this.#catcherror),
      )
      .subscribe((id) => {
        this.routeStateService.updateIdState(id);
      });
  }

  /* error handler utility */
  #catcherror(err: IErrReport) {
    this.logger.trace(`${MemberScoresComponent.name}: catchError called`);

    /* inform user and mark as handled */
    this.toastr.error('ERROR!', this.#toastrMessage);
    err.isHandled = true;

    this.logger.trace(`${MemberScoresComponent.name}: Throwing the error on`);
    return throwError(err);
  }

  /**
   * Sums the numbers in an input array.
   * @param cells Array with numbers.
   * @returns Sum of the numbers in the array.
   */
  #sum(cells: number[]): number {
    const filteredCells = cells.filter((cell) => !!cell);
    return filteredCells.reduce((sum, cell) => (sum += cell), 0);
  }

  /**
   * Updates the backend database with the updated model.
   */
  #submitTable(updatedModel: IScores): void {
    /* Set an isLoadingService indicator (that loads a progress bar) and clears it when the returned observable emits. */
    this.isLoadingService.add(
      this.scoresService
        .updateScoresTable(updatedModel)
        .pipe(takeUntil(this.#destroy$))
        .subscribe((scores) => {
          this.logger.trace(
            `${
              MemberScoresComponent.name
            }: Scores table updated: ${JSON.stringify(scores)}`,
          );
          /* allow errors go to errorHandler */
        }),
    );
  }

  /**
   * Runs after every table data change, (i.e. excluding the date), the data is sent to the database and an event is emitted to the datatable type, (which redraws the table).
   * @param updatedModel Updated table model.
   */
  #onTableChange(updatedModel: IScores = this.model): void {
    this.logger.trace(`${MemberScoresComponent.name}: #onTableChange called}`);
    const runChange = (updatedModel: IScores): void => {
      this.logger.trace(`${MemberScoresComponent.name}: #runChange called}`);
      this.#submitTable(updatedModel);
      this.#tableChange.emit('modelChange');
    };
    if (!this.form.valid) {
      this.logger.trace(
        `${MemberScoresComponent.name}: Form invalid, change not run}`,
      );
      return;
    }
    clearTimeout(this.#changeTimerId);
    this.#changeTimerId = setTimeout(
      runChange,
      this.#debounceDelay,
      updatedModel,
    );
  }

  /**
   * Requests a table object from the backend database and loads it into the data model.
   */
  #submitDate(updatedModel: IScores): void {
    /* Set an isLoadingService indicator (that loads a progress bar) and clears it when the returned observable emits. */
    this.isLoadingService.add(
      this.scoresService
        .getOrCreateScores(updatedModel.memberId, updatedModel.date)
        .pipe(takeUntil(this.#destroy$))
        .subscribe((scores) => {
          this.model = scores;
          this.logger.trace(
            `${
              MemberScoresComponent.name
            }: Scores table created or retrieved: ${JSON.stringify(scores)}`,
          );
          /* allow errors go to errorHandler */
        }),
    );
  }

  /**
   * After every date change a new table is requested from the database, loaded into the model, and an event is emitted to the datatable type, (which redraws the table).
   * @param updatedModel Updated table model.
   */
  #onDateChange(updatedModel: IScores = this.model): void {
    if (this.form.valid) {
      this.#submitDate(updatedModel);
      this.#tableChange.emit('modelChange');
    }
  }

  ngOnDestroy(): void {
    /* unsubscribe all */
    this.#destroy$.next();
    this.#destroy$.complete();
    /* update member id in the route state service */
    this.routeStateService.updateIdState('');
  }
}
