import { Component, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Data, ParamMap } from '@angular/router';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core/';
import { IsLoadingService } from '@service-work/is-loading';
import { NGXLogger } from 'ngx-logger';
import { ToastrService } from 'ngx-toastr';
import { Subject } from 'rxjs';
import { takeUntil, map, catchError, tap } from 'rxjs/operators';
import { EventEmitter } from 'events';

// import { IErrReport } from '../../configuration/configuration';
import { IScores, EARLIEST_DATE } from '../data-providers/scores-models';
import { RouteStateService } from '../../app-module/services/route-state-service/router-state.service';
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
  form = new FormGroup({});
  scores!: IScores;
  /* form model */
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
          /* The date is entered as midnight local time on that date, e.g. 21st June is entered as 00:00 local time on 21st June. But it is stored as a UTC string.  UTC might be different from local time, e.g. one hour behind, which means that an entered date of 21st June would be stored as a UTC date of 23.00 on 20th June. This causes problems if you pass the UTC value to calculate the date. To avoid this, subtract the local UTC offset from the entered date before storing, so that the stored UTC value has the same date as the entered local value.
          E.G.: If IST is 60min ahead of UTC then, with no intervention, 21st June 00:00 IST would be stored as 20th June 23:00 UTC.  The getTimezoneOffset function returns UTC - IST, i.e. -60 min for Irish Summer time. Subtracting -60min from, (which is equivalent to adding 60min to), the local value before storage, results in the stored value being 21st June 00:00 UTC.  If it is now used to calculate the date of the session it will return the correct date of 21st June.
          This means the stored time will always be of the format 'yyyy-mm-ddT00:00:00.000Z'*/
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
    private toastr: ToastrService,
  ) {
    this.logger.trace(
      `${MemberScoresComponent.name}: Starting MemberScoresComponent`,
    );
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
    /* error message displayed to the user for all update fails */
    const toastrMessage = 'A table update error has occurred';
    this.logger.trace(`${MemberScoresComponent.name}: #catchError called`);
    this.logger.trace(
      `${MemberScoresComponent.name}: Displaying a toastr message`,
    );
    this.toastr.error('ERROR!', toastrMessage);
    this.logger.trace(`${MemberScoresComponent.name}: Throwing the error on`);
    throw err;
  };

  /**
   * Sums the numbers in an input array.
   * @param cells Array with numbers.
   * @returns Sum of the numbers in the array.
   */
  #sum = (cells: number[]): number => {
    this.logger.trace(`${MemberScoresComponent.name}: #sum called`);
    const filteredCells = cells.filter((cell) => !!cell);
    return filteredCells.reduce((sum, cell) => (sum += cell), 0);
  };

  /**
   * Runs after every table data change, (i.e. excluding the date). The data is sent to the database and an event is emitted to the datatable type, (which redraws the table).
   * @param updatedModel Updated table model.
   */
  #onTableChange = (updatedModel: IScores = this.model): void => {
    this.logger.trace(`${MemberScoresComponent.name}: #onTableChange called}`);
    this.scoresService
      .updateScoresTable(updatedModel)
      .pipe(
        takeUntil(this.#destroy$),
        tap(() => {
          this.logger.trace('TEST');
        }),
        catchError(this.#catchError),
      )
      .subscribe((scores: IScores) => {
        this.logger.trace(
          `${
            MemberScoresComponent.name
          }: Scores table updated: ${JSON.stringify(scores)}`,
        );
      });
    this.#tableChange.emit('modelChange');
    if (!this.form.valid) {
      this.logger.trace(
        `${MemberScoresComponent.name}: Form invalid, change not run}`,
      );
      return;
    }
  };

  /**
   * After every date change a new table is requested from the database, loaded into the model, and an event is emitted to the datatable type, (which redraws the table).
   * @param updatedModel Updated table model.
   */
  #onDateChange = (updatedModel: IScores = this.model): void => {
    this.logger.trace(`${MemberScoresComponent.name}: #onDateChange called`);
    if (this.form.valid) {
      this.isLoadingService.add(
        this.scoresService
          .getOrCreateScores(updatedModel.memberId, updatedModel.date)
          .pipe(takeUntil(this.#destroy$), catchError(this.#catchError))
          .subscribe((scores) => {
            this.model = scores;
            this.logger.trace(
              `${
                MemberScoresComponent.name
              }: Scores table created or retrieved: ${JSON.stringify(scores)}`,
            );
          }),
      );
      this.#tableChange.emit('modelChange');
    }
  };

  ngOnDestroy = (): void => {
    this.logger.trace(`${MemberScoresComponent.name}: #ngDestroy called`);
    /* unsubscribe all */
    this.#destroy$.next();
    this.#destroy$.complete();
    /* update member id in the route state service */
    this.routeStateService.updateIdState('');
  };
}
