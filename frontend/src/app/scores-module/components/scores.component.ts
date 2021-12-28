import { Component, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Data, ParamMap } from '@angular/router';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core/';
import { IsLoadingService } from '@service-work/is-loading';
import { NGXLogger } from 'ngx-logger';
import { Subject } from 'rxjs';
import { takeUntil, map, catchError } from 'rxjs/operators';
import { EventEmitter } from 'events';

import { IScores, EARLIEST_DATE } from '../models/scores-models';
import { RouteStateService } from '../../app-module/services/route-state-service/router-state.service';
import { ScoresService } from '../services/scores.service';

/**
 * @title This component shows a form table allowing weekly score results for a member to be viewed and entered or edited.
 */
@Component({
  selector: 'app-scores',
  styleUrls: ['./scores.component.scss'],
  templateUrl: './scores.component.html',
})
export class ScoresComponent implements OnDestroy {
  //
  /* used to report table change */
  #tableChange = new EventEmitter();
  /* used to unsubscribe */
  #destroy$ = new Subject<void>();
  /* min width used in the datatable */
  #minWidth = 54;
  /* ngx-datatable columns */
  #columns = [
    {
      name: 'Item',
      prop: 'item',
      minWidth: this.#minWidth * 2,
      clickable: false,
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
      clickable: true,
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
      clickable: true,
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
      clickable: true,
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
      clickable: true,
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
      clickable: true,
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
      clickable: true,
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
      clickable: true,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 1,
      summaryFunc: (cells: number[]) => this.#sum(cells),
    },
  ];
  /* table select options */
  #dropdown = [
    { value: 0, label: '0' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
  ];

  /* define the text info card */
  line1 = '- Click on a CELL to edit a value';
  line2 =
    '- Select 1 to 5, where 1 is the WORST and 5 is the BEST, e.g. High Stress is 1, and Low Stress is 5';
  line3 = '- Click on the calendar to review previous weeks';
  line4 = '';
  isGoBackVisible = false;

  form = new FormGroup({});
  scores!: IScores;
  /* form model */
  model!: IScores;
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[] = [
    {
      fieldGroup: [
        {
          key: 'date',
          type: 'datepicker',
          /* see dates.md in the docs folder */
          parsers: [
            (date: Date) => {
              return new Date(
                date.getTime() - date.getTimezoneOffset() * 60 * 1000,
              );
            },
          ],
          templateOptions: {
            required: true,
            readonly: true,
            label: 'Week commencing Sunday...',
            datepickerOptions: {
              /* allow only a certain period of dates be shown */
              max: new Date(),
              min: EARLIEST_DATE,
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
  ) {
    this.logger.trace(`${ScoresComponent.name}: Starting ScoresComponent`);

    /* get data from route resolver and load the model which fills and renders the table */
    /* Note: loading in constructor to avoid angular change after checked error */
    this.route.data
      .pipe(takeUntil(this.#destroy$), catchError(this.#catchError))
      .subscribe((data: Data) => {
        this.model = data.scores;
      });

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
        catchError(this.#catchError),
      )
      .subscribe((id) => {
        this.routeStateService.updateIdState(id);
      });
  }

  /**
   * Picks up any upstream errors, displays a toaster message and throws on the error.
   * @param err An error object
   * @throws Throws the received error object
   */
  #catchError = (err: any): never => {
    this.logger.trace(`${ScoresComponent.name}: #catchError called`);
    this.logger.trace(`${ScoresComponent.name}: Throwing the error on`);
    throw err;
  };

  /**
   * Sums the numbers in an input array.
   * @param cells Array with numbers.
   * @returns Sum of the numbers in the array.
   */
  #sum = (cells: number[]): number => {
    this.logger.trace(`${ScoresComponent.name}: #sum called`);
    const filteredCells = cells.filter((cell) => !!cell);
    return filteredCells.reduce((sum, cell) => (sum += cell), 0);
  };

  /**
   * Runs after every table data change, (i.e. excluding the date). The data is sent to the database and an event is emitted to the datatable type, (which redraws the table).
   * @param updatedModel Updated table model.
   */
  #onTableChange = (updatedModel: IScores = this.model): void => {
    this.logger.trace(`${ScoresComponent.name}: #onTableChange called}`);
    this.scoresService
      .updateScoresTable(updatedModel)
      .pipe(takeUntil(this.#destroy$), catchError(this.#catchError))
      .subscribe((scores: IScores) => {
        this.logger.trace(
          `${ScoresComponent.name}: Scores table updated ${JSON.stringify(
            scores,
          )}`,
        );
      });
    this.#tableChange.emit('modelChange');
    if (!this.form.valid) {
      this.logger.trace(
        `${ScoresComponent.name}: Form invalid, change not run}`,
      );
      return;
    }
  };

  /**
   * After every date change a new table is requested from the database, loaded into the model, and an event is emitted to the datatable type, (which redraws the table).
   * @param updatedModel Updated table model.
   */
  #onDateChange = (updatedModel: IScores = this.model): void => {
    this.logger.trace(`${ScoresComponent.name}: #onDateChange called`);

    if (this.form.valid) {
      this.isLoadingService.add(
        this.scoresService
          .getOrCreateScores(updatedModel.memberId, updatedModel.date)
          .pipe(takeUntil(this.#destroy$), catchError(this.#catchError))
          .subscribe((scores) => {
            this.model = scores;
            this.logger.trace(
              `${ScoresComponent.name}: Scores table created or retrieved`,
            );
          }),
      );
      this.#tableChange.emit('modelChange');
    }
  };

  ngOnDestroy(): void {
    this.logger.trace(`${ScoresComponent.name}: #ngDestroy called`);
    this.#destroy$.next();
    this.#destroy$.complete();
    this.routeStateService.updateIdState('');
  }
}
