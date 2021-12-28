import {
  Component,
  EventEmitter as AngularEventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core/';
import { IsLoadingService } from '@service-work/is-loading';
import { NGXLogger } from 'ngx-logger';
import { Observable, Subject } from 'rxjs';
import { takeUntil, catchError, shareReplay } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';
import { EventEmitter } from 'events';

import { EARLIEST_DATE } from '../../../scores-module/models/scores-models';
import { RouteStateService } from '../../../app-module/services/route-state-service/router-state.service';
import { SessionsService } from '../../services/sessions.service';
import {
  ESessionType,
  ISessions,
  ISessionsData,
} from '../../models/sessions-models';

/**
 * @title Training sessions table.
 *
 * This component is enabled by the parent component which passes in a sessions object. This component then displays a table allowing training sessions for a specific week for a specific member be viewed. The user can review previous weeks' data by selecting a date from a datepicker.
 *
 * If the user clicks on a row in the table then an event is emitted to the parent component. The parent then displays a component to allow the details of a specific training session be edited.  It then updates the backend database and reopens this component by passing in the updated sessions object.
 *
 * Note: This component uses an ngx-datatable component as a custom ngx-formly type to display the data table. This component is part of the formly-base module.
 */
@Component({
  selector: 'app-sessions',
  styleUrls: ['./sessions.component.scss'],
  templateUrl: './sessions.component.html',
})
export class SessionsComponent implements OnDestroy {
  //
  /* sessions object passed in from parent */
  @Input() sessions$!: Observable<ISessions> | undefined;
  /* event to pass data  to parent to allow updating */
  @Output() editSession = new AngularEventEmitter<ISessionsData>();

  /* used to report table click from the datatable subcomponent to this component */
  #tableClick = new AngularEventEmitter();
  /* min width used in the datatable */
  #minWidth =
    (+getComputedStyle(document.documentElement).getPropertyValue(
      '--big-screen',
    ) || 0) / 20;
  /* datatable columns */
  #columns = [
    {
      name: 'Day',
      prop: 'day',
      clickable: false,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 20,
      summaryFunc: () => {
        return `TOTALS:`;
      },
    },
    {
      name: '',
      prop: 'ampm',
      clickable: false,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 10,
      summaryFunc: null,
    },
    {
      name: 'Type',
      prop: 'type',
      clickable: true,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 27,
      summaryFunc: (cells: string[]) => {
        const filteredCells = cells.filter((cell) => cell !== '-');
        return filteredCells.length;
      },
    },
    {
      name: 'RPE',
      prop: 'rpe',
      clickable: true,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 10,
      summaryFunc: (cells: number[]) => this.#sum(cells),
    },
    {
      name: 'Time',
      prop: 'duration',
      clickable: true,
      minWidth: this.#minWidth * 1,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 10,
      summaryFunc: (cells: number[]) => this.#sum(cells),
    },
    {
      name: 'Load',
      prop: 'load',
      clickable: false,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 10,
      summaryFunc: (cells: number[]) => this.#sum(cells),
    },
    {
      name: 'Comment',
      prop: 'comment',
      clickable: true,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 18,
      summaryFunc: null,
    },
  ];
  /* used to report a table change to the table */
  #tableChange = new EventEmitter();

  /* used to unsubscribe */
  #destroy$ = new Subject<void>();
  /* utility */
  #capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1);
  };
  /* type dropdown select options */
  #type = [
    { value: ESessionType.Blank, label: '-' },
    {
      value: ESessionType.Strength,
      label: this.#capitalizeFirstLetter(ESessionType.Strength),
    },
    {
      value: ESessionType.Conditioning,
      label: this.#capitalizeFirstLetter(ESessionType.Conditioning),
    },
    {
      value: ESessionType.Sport,
      label: this.#capitalizeFirstLetter(ESessionType.Sport),
    },
  ];
  /* rpe dropdown select options */
  #rpe = [
    { value: 0, label: '0' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
    { value: 6, label: '6' },
    { value: 7, label: '7' },
    { value: 8, label: '8' },
    { value: 9, label: '9' },
    { value: 10, label: '10' },
  ];

  /* define the text info card */
  line1 = '- Click on a row to update a training session';
  line2 =
    // eslint-disable-next-line max-len
    '- RPE is the Rate of Perceived Exertion of the session. Select 0 for no exertion, to 10 for extreme exertion';
  line3 = '- Click on the calendar to review previous weeks';
  line4 = '';
  isGoBackVisible = false;

  form = new FormGroup({});
  model$!: Observable<ISessions>;
  model!: ISessions;
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[] = [
    {
      fieldGroup: [
        {
          key: 'date', // matches model property
          type: 'datepicker',
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
      /* define the ngx-datatable - see the shared datatabel component */
      key: 'sessions',
      type: 'datatable',
      templateOptions: {
        columns: this.#columns,
        /* passes an event emitter that is used to signal model changes to the datatable (which causes the datatable to be redrawn) */
        tableChange: this.#tableChange,
        tableClick: this.#tableClick,
      },
      fieldArray: {
        fieldGroup: [
          {
            key: 'day',
            type: 'input',
            templateOptions: {
              type: 'text',
              disabled: true,
            },
          },
          {
            key: 'ampm',
            type: 'input',
            templateOptions: {
              type: 'text',
              disabled: true,
            },
          },
          {
            key: 'type',
            type: 'select',
            templateOptions: {
              options: this.#type,
              change: () => this.#onTableChange(),
            },
          },
          {
            key: 'rpe',
            type: 'select',
            defaultValue: 0,
            templateOptions: {
              options: this.#rpe,
              change: () => this.#onTableChange(),
            },
          },
          {
            key: 'duration',
            type: 'input',
            defaultValue: 0,
            templateOptions: {
              type: 'number',
              required: true,
              min: 0,
              max: 999,
              change: () => this.#onTableChange(),
            },
          },
          {
            key: 'load',
            type: 'input',
            templateOptions: {
              type: 'text',
              disabled: true,
            },
            expressionProperties: {
              'model.load': (model) => {
                return (model?.rpe ?? 0) * (model?.duration ?? 0);
              },
            },
          },
          {
            key: 'comment',
            type: 'textarea',
            defaultValue: '-',
            templateOptions: {
              required: false,
              change: () => this.#onTableChange(),
            },
          },
        ],
      },
    },
  ];

  constructor(
    private routeStateService: RouteStateService,
    private sessionsService: SessionsService,
    private isLoadingService: IsLoadingService,
    private logger: NGXLogger,
    private toastr: ToastrService,
  ) {
    this.logger.trace(`${SessionsComponent.name}: Starting SessionsComponent`);
  }

  /**
   * Picks up any upstream errors and throws on the error.
   * @param err An error object
   * @throws Throws the received error object
   */
  #catchError = (err: any): never => {
    this.logger.trace(`${SessionsComponent.name}: #catchError called`);
    this.logger.trace(`${SessionsComponent.name}: Throwing the error on`);
    throw err;
  };

  /**
   * Sums the numbers in an input array.
   * @param cells Array with numbers.
   * @returns Sum of the numbers in the array.
   */
  #sum = (cells: number[]): number => {
    this.logger.trace(`${SessionsComponent.name}: #sum called`);
    const filteredCells = cells.filter((cell) => !!cell);
    return filteredCells.reduce((sum, cell) => (sum += cell), 0);
  };

  /**
   * Runs after every table data change, (i.e. excluding the date), the data is sent to the database and an event is emitted to the datatable type, (which redraws the table).
   * @param updatedModel Updated table model.
   */
  #onTableChange(updatedModel: ISessions = this.model): void {
    this.logger.trace(`${SessionsComponent.name}: #onTableChange called`);
    if (!this.form.valid) {
      this.logger.trace(
        `${SessionsComponent.name}: Form invalid, change not run`,
      );
      /* error message displayed to the user */
      const toastrMessage = 'Invalid Input - please try again';
      this.logger.trace(
        `${SessionsComponent.name}: Displaying a toastr message`,
      );
      this.toastr.error('ERROR!', toastrMessage);
      /* reset the form */
      if (this.options?.resetModel) {
        this.options.resetModel();
      }
      this.#tableChange.emit('modelChange');
      return;
    }
    /* update initial value so we can reset if the form is invalid */
    if (this.options?.updateInitialValue) {
      this.options.updateInitialValue();
    }
    this.sessionsService
      .updateSessionsTable(updatedModel)
      .pipe(takeUntil(this.#destroy$), catchError(this.#catchError))
      .subscribe((sessions: ISessions) => {
        this.logger.trace(
          `${SessionsComponent.name}: Sessions table updated: ${JSON.stringify(
            sessions,
          )}`,
        );
      });
    this.#tableChange.emit('modelChange');
  }

  /**
   * After every date change a new table is requested from the database, loaded into the model, and an event is emitted to the datatable type, (which redraws the table).
   * @param updatedModel Updated table model.
   */
  #onDateChange = (updatedModel: ISessions = this.model): void => {
    this.logger.trace(`${SessionsComponent.name}: #onDateChange called`);
    if (this.form.valid) {
      this.isLoadingService.add(
        this.sessionsService
          .getOrCreateSessions(updatedModel.memberId, updatedModel.date)
          .pipe(takeUntil(this.#destroy$), catchError(this.#catchError))
          .subscribe((sessions) => {
            this.model = sessions;
            this.logger.trace(
              `${SessionsComponent.name}: Sessions table created or retrieved`,
            );
          }),
      );
      this.#tableChange.emit('modelChange');
    }
  };

  ngOnInit(): void {
    this.logger.trace(`${SessionsComponent.name}: Starting ngOnInit`);
    (this.sessions$ as Observable<ISessions>)
      .pipe(
        takeUntil(this.#destroy$),
        shareReplay(1),
        catchError(this.#catchError),
      )
      .subscribe((sessions: ISessions) => {
        this.logger.trace(
          `${SessionsComponent.name}: Received sessions: ${JSON.stringify(
            sessions,
          )}`,
        );
        this.model = sessions;
        this.#onTableChange(sessions);
      });

    /* when the user clicks on the datatable it causes data to be passed to the parent component */
    this.#tableClick.subscribe((rowIndex: number) => {
      const sessionDetail = {
        type: this.model.sessions[rowIndex].type,
        rpe: this.model.sessions[rowIndex].rpe,
        duration: this.model.sessions[rowIndex].duration,
        comment: this.model.sessions[rowIndex].comment,
      };
      this.editSession.emit({
        sessions: this.model,
        session: sessionDetail,
        rowIndex: rowIndex,
      });
    });
  }

  ngOnDestroy(): void {
    this.logger.trace(`${SessionsComponent.name}: #ngDestroy called`);
    this.#destroy$.next();
    this.#destroy$.complete();
    this.routeStateService.updateIdState('');
  }
}
