import {
  Component,
  EventEmitter as AngularEventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core/';
import { IsLoadingService } from '@service-work/is-loading';
import { NGXLogger } from 'ngx-logger';
import { EventEmitter } from 'events';

import { EARLIEST_DATE } from '../../../scores-module/models/scores-models';
import { UtilsService } from '../../../app-module/services/utils-service/utils.service';
import { SessionsService } from '../../services/sessions.service';
import { SessionsStore } from '../../store/sessions.store';
import {
  ERpeScore,
  ESessionType,
  ISessions,
  ISessionsData,
} from '../../models/sessions-models';

/**
 * @title Training sessions table.
 *
 * This component is enabled by the parent component. The parent component passes in a sessions object.
 *
 * Requirements:
 *
 * 1. This component displays a table corresponding to the passed-in sessions object, allowing training sessions for a specific week for a specific member be viewed.
 *
 * 2. The user can select a date from a datepicker. This component then loads the corresponding sessions data from the backend and displays it. The parent component passes in the member id to allow the data be retrieved from the backend.
 *
 * 3. This component registers an event handler so that if the user clicks on a row in the table an event is emitted to the parent component. It passes an updated sessions object, (i.e. updated as required so it corresponds to the latest selected date), along with the index of the clicked row, to the parent component.
 *
 * Note: This component uses an ngx-datatable component as a custom ngx-formly type to display the data table. This component is part of the formly-base module, contained in the shared module.
 */
@Component({
  selector: 'app-sessions',
  styleUrls: ['./sessions.component.scss'],
  templateUrl: './sessions.component.html',
  providers: [SessionsStore],
})
export class SessionsComponent {
  //
  /* sessions object passed in from parent and passed as the form model to the datatable */
  @Input() sessions!: ISessions;
  /* memberId passed in from parent */
  @Input() memberId!: number;
  /* event to pass data  to parent to allow updating */
  @Output() editSession = new AngularEventEmitter<ISessionsData>();

  sessions$ = this.store.sessions$;

  /* used to report table click from the datatable subcomponent to this component */
  #tableClick = new AngularEventEmitter();
  /* used to report a table change to the table, causing it to update */
  #tableChange = new EventEmitter();
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
      summaryFunc: (cells: number[]) => this.utils.sum(cells),
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
      summaryFunc: (cells: number[]) => this.utils.sum(cells),
    },
    {
      name: 'Load',
      prop: 'load',
      clickable: false,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 10,
      summaryFunc: (cells: number[]) => this.utils.sum(cells),
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
  /* type dropdown select options */
  #type = [
    { value: ESessionType.Blank, label: '-' },
    {
      value: ESessionType.Strength,
      label: this.utils.capitalizeFirstLetter(ESessionType.Strength),
    },
    {
      value: ESessionType.Conditioning,
      label: this.utils.capitalizeFirstLetter(ESessionType.Conditioning),
    },
    {
      value: ESessionType.Sport,
      label: this.utils.capitalizeFirstLetter(ESessionType.Sport),
    },
  ];
  /* rpe dropdown select options */
  #rpe = [
    { value: ERpeScore.zero, label: '0' },
    { value: ERpeScore.one, label: '1' },
    { value: ERpeScore.two, label: '2' },
    { value: ERpeScore.three, label: '3' },
    { value: ERpeScore.four, label: '4' },
    { value: ERpeScore.five, label: '5' },
    { value: ERpeScore.six, label: '6' },
    { value: ERpeScore.seven, label: '7' },
    { value: ERpeScore.eight, label: '8' },
    { value: ERpeScore.nine, label: '9' },
    { value: ERpeScore.ten, label: '10' },
  ];

  /* define the text info card */
  line1 = '- Click on a ROW to update a training session';
  line2 =
    '- RPE is the Rate of Perceived Exertion of the session. Select 0 for no exertion, to 10 for extreme exertion';
  line3 = '- Click on the calendar to review previous weeks';
  line4 = '';
  isGoBackVisible = false;

  /* define the formly form */
  form = new FormGroup({});
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
              dateChange: (event: FormlyFieldConfig) => {
                /* apply the parser to the date returned */
                if (event.parsers) {
                  const date: Date = event.parsers[0](
                    event.formControl?.value,
                  ) as Date;
                  return this.#onDateChange(date);
                } else {
                  const date = event.formControl?.value;
                  return this.#onDateChange(date);
                }
              },
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
      /* define the datatable - see the ngx-datatable component in the formly base module */
      key: 'sessions',
      type: 'sessions-datatable',
      templateOptions: {
        columns: this.#columns,
        /* passes an event emitter that is used to signal model changes to the datatable (which causes the datatable to be redrawn) */
        tableChange: this.#tableChange,
        /* passes an event emitter that is used to signal when the user clicks on a table row */
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
            },
          },
          {
            key: 'rpe',
            type: 'select',
            defaultValue: 0,
            templateOptions: {
              options: this.#rpe,
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
            },
          },
        ],
      },
    },
  ];

  constructor(
    private sessionsService: SessionsService,
    private store: SessionsStore,
    private utils: UtilsService,
    private isLoadingService: IsLoadingService,
    private logger: NGXLogger,
  ) {
    this.logger.trace(`${SessionsComponent.name}: Starting SessionsComponent`);
  }

  /**
   * After every date change a new table is requested from the database, loaded into the datatable model, and an event is emitted to the datatable type, (which redraws the table).
   * @param date The date of the required sessions data.
   */
  #onDateChange = (date: Date): void => {
    this.logger.trace(`${SessionsComponent.name}: #onDateChange called`);
    if (this.form.valid) {
      this.isLoadingService.add(
        this.sessionsService
          .getOrCreateSessions(this.memberId, date)
          .subscribe((sessions) => {
            this.sessions = sessions;
          }),
      );
      // this.#tableChange.emit('modelChange');
    }
  };

  ngOnInit(): void {
    this.logger.trace(`${SessionsComponent.name}: Starting ngOnInit`);

    this.store.sessions$.subscribe((sessions) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.sessions = sessions!;
    });

    /* when the user clicks on the datatable it causes required data to be passed to the parent component */
    this.#tableClick.subscribe((rowIndex: number) => {
      this.editSession.emit({
        sessions: this.sessions,
        rowIndex: rowIndex,
      });
    });
  }
}
