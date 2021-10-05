import { Component, OnDestroy } from '@angular/core';
import { AbstractControl, FormGroup } from '@angular/forms';
import { ActivatedRoute, ParamMap } from '@angular/router';
import { FormlyFormOptions, FormlyFieldConfig } from '@ngx-formly/core/';
import { IsLoadingService } from '@service-work/is-loading';
import { NGXLogger } from 'ngx-logger';
import { ToastrService } from 'ngx-toastr';
import { Observable, of, Subject, throwError } from 'rxjs';
import { takeUntil, map, catchError } from 'rxjs/operators';
import { EventEmitter } from 'events';

import { IErrReport } from '../../common/config';
import { IMember } from '../../data-providers/members.data-provider';
import { ISessions2 } from '../../data-providers/models/sessions2';
import { earliestDate } from '../../data-providers/models/scores';
import { RouteStateService } from '../../common/route-state-service/router-state-service';
import { Sessions2Service } from '../../common/sessions2-service/sessions2.service';
import { SessionType } from '../../data-providers/models/session';

/**
 * @title This component shows a form table allowing weekly session results for a member to be viewed and entered or edited.
 */
@Component({
  selector: 'app-sessions2',
  styleUrls: ['./member-sessions2.component.scss'],
  templateUrl: './member-sessions2.component.html',
})
export class MemberSessions2Component implements OnDestroy {
  //
  /* used to report table change */
  #tableChange = new EventEmitter();
  /* used to unsubscribe */
  #destroy$ = new Subject<void>();
  /* min width used in the datatable */
  #minWidth = 42;
  /* error message displayed to the user */
  #toastrMessage = 'A data access error has occurred';
  /* ngx-datatable columns */
  #columns = [
    {
      name: 'Day',
      prop: 'day',
      minWidth: this.#minWidth * 2,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 3,
    },
    {
      name: 'AM/PM',
      prop: 'ampm',
      minWidth: this.#minWidth,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 2,
    },
    {
      name: 'Type',
      prop: 'type',
      minWidth: this.#minWidth * 3,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 4,
    },
    {
      name: 'RPE',
      prop: 'rpe',
      minWidth: this.#minWidth * 2,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 2,
    },
    {
      name: 'Duration',
      prop: 'duration',
      minWidth: this.#minWidth * 2,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 2,
    },
    {
      name: 'Load',
      prop: 'load',
      minWidth: this.#minWidth,
      resizeable: false,
      sortable: false,
      draggable: false,
      flexGrow: 2,
    },
  ];
  /* type select options */
  #type = [
    { value: SessionType.Strength, label: 'Strength' },
    { value: SessionType.Conditioning, label: 'Conditioning' },
    { value: SessionType.Conditioning, label: 'Sport' },
  ];
  /* rpe select options */
  #rpe = [
    { value: 0, label: '0' },
    { value: 1, label: '1' },
    { value: 2, label: '2' },
    { value: 3, label: '3' },
    { value: 4, label: '4' },
    { value: 5, label: '5' },
    { value: 1, label: '6' },
    { value: 2, label: '7' },
    { value: 3, label: '8' },
    { value: 4, label: '9' },
    { value: 5, label: '10' },
  ];
  #debounceDelay = 1500;
  #changeTimerId!: NodeJS.Timeout;
  member$ = of({}) as Observable<IMember>;
  form = new FormGroup({});
  model$!: Observable<ISessions2>;
  model!: ISessions2;
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[] = [
    {
      template:
        // eslint-disable-next-line max-len
        '<div class="table-help">RPE is the Rate of Perceived Exertion of the session.<br>Select from 0, for no exertion, to 10, for extreme exertion</div>',
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
            label: 'Week commencing Sunday...',
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
              min: 0,
              max: 999,
              change: () => this.#onTableChange(),
            },
            validators: {
              duration: {
                expression: (
                  _control: AbstractControl,
                  field: FormlyFieldConfig,
                ): boolean => {
                  const number = Number(field.formControl?.value);
                  return number >= 0 && number <= 999;
                },
                message: (
                  _control: AbstractControl,
                  _field: FormlyFieldConfig,
                ) => {
                  return `You must rate the session duration from 1 to 999 minutes`;
                },
              },
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
    private sessions2Service: Sessions2Service,
    private isLoadingService: IsLoadingService,
    private logger: NGXLogger,
    private toastr: ToastrService,
  ) {
    this.logger.trace(
      `${MemberSessions2Component.name}: Starting MemberSessions2Component`,
    );
    /* get data from route resolver */
    this.route.data
      .pipe(takeUntil(this.#destroy$), catchError(this.#catcherror))
      .subscribe((data) => {
        this.member$ = data.memberAndSessions.member$;
        this.model$ = data.memberAndSessions.sessions2$;
      });
    /* load the model which fills the table */
    /* Note: loading in constructor to avoid angular change after checked error */
    this.isLoadingService.add(
      this.model$
        .pipe(takeUntil(this.#destroy$), catchError(this.#catcherror))
        .subscribe((model: ISessions2) => {
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
    this.logger.trace(`${MemberSessions2Component.name}: catchError called`);

    /* inform user and mark as handled */
    this.toastr.error('ERROR!', this.#toastrMessage);
    err.isHandled = true;

    this.logger.trace(
      `${MemberSessions2Component.name}: Throwing the error on`,
    );
    return throwError(err);
  }

  /**
   * Updates the backend database with the updated model.
   */
  #submitTable(updatedModel: ISessions2): void {
    /* Set an isLoadingService indicator (that loads a progress bar) and clears it when the returned observable emits. */
    this.isLoadingService.add(
      this.sessions2Service
        .updateSessionsTable(updatedModel)
        .pipe(takeUntil(this.#destroy$))
        .subscribe((sessions2) => {
          this.logger.trace(
            `${
              MemberSessions2Component.name
            }: Sessions table updated: ${JSON.stringify(sessions2)}`,
          );
          /* allow errors go to errorHandler */
        }),
    );
  }

  /**
   * Runs after every table data change, (i.e. excluding the date), the data is sent to the database and an event is emitted to the datatable type, (which redraws the table).
   * @param updatedModel Updated table model.
   */
  #onTableChange(updatedModel: ISessions2 = this.model): void {
    this.logger.trace(
      `${MemberSessions2Component.name}: #onTableChange called}`,
    );
    const runChange = (updatedModel: ISessions2): void => {
      this.logger.trace(`${MemberSessions2Component.name}: #runChange called}`);
      this.#submitTable(updatedModel);
      this.#tableChange.emit('modelChange');
    };
    if (!this.form.valid) {
      this.logger.trace(
        `${MemberSessions2Component.name}: Form invalid, change not run}`,
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
  #submitDate(updatedModel: ISessions2): void {
    /* Set an isLoadingService indicator (that loads a progress bar) and clears it when the returned observable emits. */
    this.isLoadingService.add(
      this.sessions2Service
        .getOrCreateSessions(updatedModel.memberId, updatedModel.date)
        .pipe(takeUntil(this.#destroy$))
        .subscribe((sessions2) => {
          this.model = sessions2;
          this.logger.trace(
            `${
              MemberSessions2Component.name
            }: Sessions table created or retrieved: ${JSON.stringify(
              sessions2,
            )}`,
          );
          /* allow errors go to errorHandler */
        }),
    );
  }

  /**
   * After every date change a new table is requested from the database, loaded into the model, and an event is emitted to the datatable type, (which redraws the table).
   * @param updatedModel Updated table model.
   */
  #onDateChange(updatedModel: ISessions2 = this.model): void {
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
