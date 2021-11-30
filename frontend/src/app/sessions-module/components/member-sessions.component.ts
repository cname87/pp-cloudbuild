import { Component, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute, Data, ParamMap } from '@angular/router';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core/';
import { IsLoadingService } from '@service-work/is-loading';
import { NGXLogger } from 'ngx-logger';
import { Observable, Subject } from 'rxjs';
import { takeUntil, map, catchError } from 'rxjs/operators';
import { EventEmitter } from 'events';
import { ToastrService } from 'ngx-toastr';

import { ISessions } from '../models/sessions-models';
import { EARLIEST_DATE } from '../../scores-module/models/scores-models';
import { RouteStateService } from '../../app-module/services/route-state-service/router-state.service';
import { SessionsService } from '../services/sessions.service';
import { SessionType } from '../models/sessions-models';

/**
 * @title This component shows a form table allowing weekly session results for a member to be viewed and entered or edited.
 */
@Component({
  selector: 'app-sessions',
  styleUrls: ['./member-sessions.component.scss'],
  templateUrl: './member-sessions.component.html',
})
export class MemberSessionsComponent implements OnDestroy {
  //
  /* used to report table change */
  #tableChange = new EventEmitter();
  /* used to unsubscribe */
  #destroy$ = new Subject<void>();
  /* min width used in the datatable */
  #minWidth = 42;
  /* ngx-datatable columns */
  #columns = [
    {
      name: 'Day',
      prop: 'day',
      clickable: false,
      minWidth: this.#minWidth * 2,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 3,
    },
    {
      name: 'AM/PM',
      prop: 'ampm',
      clickable: false,
      minWidth: this.#minWidth,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 2,
    },
    {
      name: 'Type',
      prop: 'type',
      clickable: true,
      minWidth: this.#minWidth * 3,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 4,
    },
    {
      name: 'RPE',
      prop: 'rpe',
      clickable: true,
      minWidth: this.#minWidth * 2,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 2,
    },
    {
      name: 'Duration',
      prop: 'duration',
      clickable: true,
      minWidth: this.#minWidth * 2,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 2,
    },
    {
      name: 'Load',
      prop: 'load',
      clickable: false,
      minWidth: this.#minWidth,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 2,
    },
  ];
  /* type select options */
  #type = [
    { value: SessionType.Blank, label: '-' },
    { value: SessionType.Strength, label: 'Strength' },
    { value: SessionType.Conditioning, label: 'Conditioning' },
    { value: SessionType.Sport, label: 'Sport' },
  ];
  /* rpe select options */
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
  line1 = '- Click on a cell to edit a value. (Press ESC to cancel)';
  line2 = '- RPE is the Rate of Perceived Exertion of the session';
  line3 = '- Select from 0, for no exertion, to 10, for extreme exertion';
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
          key: 'date',
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
      /* define the ngx-datatable */
      key: 'sessions',
      type: 'datatable',
      templateOptions: {
        columns: this.#columns,
        /* passes an event emitter that is used to signal model changes to the datatable (which causes the datatable to be redrawn) */
        tableChange: this.#tableChange,
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
        ],
      },
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private routeStateService: RouteStateService,
    private sessionsService: SessionsService,
    private isLoadingService: IsLoadingService,
    private logger: NGXLogger,
    private toastr: ToastrService,
  ) {
    this.logger.trace(
      `${MemberSessionsComponent.name}: Starting MemberSessionsComponent`,
    );

    /* get data from route resolver and load the model which fills and renders the table */
    /* Note: loading in constructor to avoid angular change after checked error */
    this.route.data
      .pipe(takeUntil(this.#destroy$), catchError(this.#catchError))
      .subscribe((data: Data) => {
        this.model = data.sessions;
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
    this.logger.trace(`${MemberSessionsComponent.name}: #catchError called`);
    this.logger.trace(`${MemberSessionsComponent.name}: Throwing the error on`);
    throw err;
  };

  /**
   * Runs after every table data change, (i.e. excluding the date), the data is sent to the database and an event is emitted to the datatable type, (which redraws the table).
   * @param updatedModel Updated table model.
   */
  #onTableChange(updatedModel: ISessions = this.model): void {
    this.logger.trace(`${MemberSessionsComponent.name}: #onTableChange called`);
    if (!this.form.valid) {
      this.logger.trace(
        `${MemberSessionsComponent.name}: Form invalid, change not run`,
      );
      /* error message displayed to the user */
      const toastrMessage = 'Invalid Input - please try again';
      this.logger.trace(
        `${MemberSessionsComponent.name}: Displaying a toastr message`,
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
          `${
            MemberSessionsComponent.name
          }: Sessions table updated: ${JSON.stringify(sessions)}`,
        );
      });
    this.#tableChange.emit('modelChange');
  }

  /**
   * After every date change a new table is requested from the database, loaded into the model, and an event is emitted to the datatable type, (which redraws the table).
   * @param updatedModel Updated table model.
   */
  #onDateChange = (updatedModel: ISessions = this.model): void => {
    this.logger.trace(`${MemberSessionsComponent.name}: #onDateChange called`);
    if (this.form.valid) {
      this.isLoadingService.add(
        this.sessionsService
          .getOrCreateSessions(updatedModel.memberId, updatedModel.date)
          .pipe(takeUntil(this.#destroy$), catchError(this.#catchError))
          .subscribe((sessions) => {
            this.model = sessions;
            this.logger.trace(
              `${MemberSessionsComponent.name}: Sessions table created or retrieved`,
            );
          }),
      );
      this.#tableChange.emit('modelChange');
    }
  };

  ngOnDestroy(): void {
    this.logger.trace(`${MemberSessionsComponent.name}: #ngDestroy called`);
    this.#destroy$.next();
    this.#destroy$.complete();
    this.routeStateService.updateIdState('');
  }

  submit(): void {
    alert(this.model);
  }
}
