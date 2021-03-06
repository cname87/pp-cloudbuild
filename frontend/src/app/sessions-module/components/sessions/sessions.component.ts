import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter as AngularEventEmitter,
  Input,
  Output,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core/';
import { NGXLogger } from 'ngx-logger';
import { EventEmitter } from 'events';

import { EARLIEST_DATE } from '../../../scores-module/models/scores-models';
import { UtilsService } from '../../../app-module/services/utils-service/utils.service';
import {
  ERpeScore,
  ESessionType,
  ISessions,
} from '../../models/sessions-models';
import { Observable } from 'rxjs';

/**
 * @title Training sessions table.
 *
 * This component displays a table showing data on all the training sessions for a week.
 *
 * Inputs:
 * 1. A sessions object is passed in from the parent component.
 *
 * Outputs:
 * 1. An event which registers a click on a session row of the displayed table. It passes the zero-based index of the clicked row.
 * 2. An event which registers a new date selection from the datepicker of the displayed table. It passes the new date selected.
 *
 * Methods:
 * There are no exposed methods.
 *
 * Requirements:
 *
 * 1. This component displays a table corresponding to a sessions object passed in from the parent component.
 * Note: The displayed table shows data on all the training sessions for a specific week for a specific member.
 *
 * 2. The user can select a date from a displayed datepicker. This component then emits an event with the date.
 * Note: The parent component registers the event and calls a method in the sessions store which retrieves data from the backend and updates the sessions observable which causes this component to update the displayed table as per requirement #1.
 *
 * 3. This component registers an event handler so that if the user clicks on a row in the table an event is emitted which contains the zero-based index of the clicked row.
 * Note: The parent component registers the event and passes the session data corresponding to the row index to a session component which displays data on a specific training session, so it can be updated.
 *
 * Note: This component uses an ngx-datatable component as a custom ngx-formly type to display the data table. This component is part of the formly-base module, contained in the shared module.
 */
@Component({
  selector: 'app-sessions',
  styleUrls: ['./sessions.component.scss'],
  templateUrl: './sessions.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SessionsComponent {
  //
  /* sessions object passed in from parent and passed as the form model to the datatable */
  @Input() sessions!: ISessions;

  /* event to parent to allow a new sessions object for a new date be loaded */
  @Output() newDate = new AngularEventEmitter<Date>();

  /* used to report a table click from the datatable subcomponent */
  @Output() tableClick$ = new AngularEventEmitter<Observable<number>>();

  /* used to report a table change to the datatable subcomponent, causing it to update - not currently used */
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
        tableClick: this.tableClick$,
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

  constructor(private utils: UtilsService, private logger: NGXLogger) {
    this.logger.trace(`${SessionsComponent.name}: Starting SessionsComponent`);
  }

  /**
   * Called by the datepicker in the DataTableComponent when a new date is selected, and it emits an event with the date.
   * Note: The event is registered by the parent component which calls a method in the sessions store which loads a sessions object according to the date, and causes the sessions$ model to be updated and the table to be redrawn.
   * @param date The date of the required sessions data.
   */

  /**
   * * TO DO - add isLoadingService
   */
  #onDateChange = (date: Date): void => {
    this.logger.trace(`${SessionsComponent.name}: #onDateChange called`);
    if (this.form.valid) {
      this.newDate.emit(date);
    }
  };
}
