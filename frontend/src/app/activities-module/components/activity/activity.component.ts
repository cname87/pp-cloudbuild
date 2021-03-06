import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { of, Subject } from 'rxjs';
import { AbstractControl, FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { IsLoadingService } from '@service-work/is-loading';

import { ActivitiesService } from '../../services/activities.service';
import {
  IActivity,
  activityTypeNames,
  EARLIEST_DATE,
  EMode,
  IActivityWithoutId,
} from '../../models/activity-models';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';

/**
 * @title This component shows a form allowing detail on an activity be entered.
 *
 * This component is enabled when an activity record is input from the parent activities component. The activity record is displayed in a form.
 *
 * If the supplied activity has an id property then an update and delete  button is shown. The activity properties can be edited and submitted, or the activity record can be deleted.
 *
 * If the supplied activity does not have an id property then a blank table is shown.  Values can be entered and the activity record can be saved.
 *
 * An event is emitted when the action is completed. This is picked up by the activities-parent component which redisplays an updated activities component.
 */

@Component({
  selector: 'app-activity',
  templateUrl: './activity.component.html',
  styleUrls: ['./activity.component.scss'],
  providers: [],
})
export class ActivityComponent implements OnInit {
  //
  /* activity to be retrieved */
  @Input() activity!: IActivity | IActivityWithoutId;
  @Output() doneEvent = new EventEmitter<EMode>();

  /* used to unsubscribe */
  #destroy$ = new Subject<void>();
  mode!: EMode;
  addLabel = 'ADD';
  updateLabel = 'UPDATE';
  /* default button label */
  buttonLabel = 'ADD';
  /* define the text info card */
  line1 =
    '- If entering a new record, enter data in each field and click the ADD button';
  line2 =
    '- If editing a record, edit the required fields and click the UPDATE field';
  line3 = '- If deleting a record, click on the DELETE button';
  line4 = '';
  isGoBackVisible = false;

  /* form definition */
  form = new FormGroup({});
  model!: IActivity | IActivityWithoutId;
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[] = [
    {
      fieldGroup: [
        {
          key: 'date',
          type: 'datepicker',
          /* see dates.md in the docs folder */
          parsers: [
            (inputDate) => {
              const date = new Date(inputDate);
              return new Date(
                date.getTime() - date.getTimezoneOffset() * 60 * 1000,
              );
            },
          ],
          templateOptions: {
            required: true,
            readonly: true,
            label: 'Select the date',
            datepickerOptions: {
              /* allow only a certain period of dates be shown */
              max: new Date(),
              min: EARLIEST_DATE,
              dateChange: () => {
                /* dummy required */
              },
            },
          },
        },
      ],
    },
    {
      key: 'type',
      type: 'select',
      templateOptions: {
        type: 'select',
        label: 'Select the type of the session from the dropdown',
        options: activityTypeNames.map((value) => {
          return {
            value: value,
            label: value,
          };
        }),
      },
      validators: {
        type: {
          expression: (
            _control: AbstractControl,
            field: FormlyFieldConfig,
          ): boolean => !!field.formControl?.value,
          message: (_control: AbstractControl, _field: FormlyFieldConfig) => {
            return `You must select an activity type`;
          },
        },
      },
    },
    {
      key: 'duration',
      type: 'input',
      templateOptions: {
        type: 'number',
        label: 'Enter the activity time in minutes',
      },
      validators: {
        time: {
          expression: (
            _control: AbstractControl,
            field: FormlyFieldConfig,
          ): boolean => {
            const number = isNaN(Number(field.formControl?.value))
              ? 0
              : Number(field.formControl?.value);
            return number > 0 && number <= 999;
          },
          message: (_control: AbstractControl, _field: FormlyFieldConfig) => {
            return `You must enter a time from 1 to 999 minutes`;
          },
        },
      },
    },
    {
      key: 'comment',
      type: 'textarea',
      templateOptions: {
        type: 'textarea',
        label: 'Enter comments here',
        rows: 2,
      },
    },
  ];

  constructor(
    private activitiesService: ActivitiesService,
    private isLoadingService: IsLoadingService,
    private logger: NGXLogger,
  ) {
    this.logger.trace(`${ActivityComponent.name}: Starting ActivityComponent`);
  }

  ngOnInit(): void {
    this.logger.trace(`${ActivityComponent.name}: Starting ngOnInit`);
    this.model = this.activity;
    this.mode = !!(this.activity as IActivity).id ? EMode.EDIT : EMode.ADD;
    this.buttonLabel = !!(this.activity as IActivity).id
      ? this.updateLabel
      : this.addLabel;
  }

  /**
   * Picks up any upstream errors and throws on the error.
   * @param err An error object
   * @throws Throws the received error object
   */
  #catchError = (err: any): never => {
    this.logger.trace(`${ActivityComponent.name}: #catchError called`);
    this.logger.trace(`${ActivityComponent.name}: Throwing the error on`);
    throw err;
  };

  #emitDone(): void {
    this.doneEvent.emit();
  }

  cancel(): void {
    this.#emitDone();
  }
  update(): void {
    /* disable to avoid multiple submissions */
    this.form.disable();

    /* Set an isLoadingService indicator (that loads a progress bar) and clears it when the returned observable emits. */
    this.isLoadingService.add(
      of(this.mode)
        .pipe(
          switchMap((mode) => {
            return mode === EMode.ADD
              ? this.activitiesService.addActivity(this.model)
              : this.activitiesService.updateActivity(this.model as IActivity);
          }),
          takeUntil(this.#destroy$),
          catchError(this.#catchError),
        )
        .subscribe((activity) => {
          const verb = this.mode === EMode.ADD ? 'added' : 'updated';
          this.logger.trace(
            `${ActivityComponent.name}: Activity ${verb}: ${JSON.stringify(
              activity,
            )}`,
          );
          this.#emitDone();
        }),
    );
  }

  delete(): void {
    /* disable to avoid multiple submissions */
    this.form.disable();

    /* Set an isLoadingService indicator (that loads a progress bar) and clears it when the returned observable emits. */
    this.isLoadingService.add(
      of({})
        .pipe(
          switchMap(() => {
            return this.activitiesService.deleteActivity(
              this.model as IActivity,
            );
          }),
          takeUntil(this.#destroy$),
          catchError(this.#catchError),
        )
        .subscribe((count) => {
          this.logger.trace(
            `${ActivityComponent.name}: ${JSON.stringify(
              count,
            )} session deleted: ${JSON.stringify(this.model)}`,
          );
          this.#emitDone();
        }),
    );
  }

  ngOnDestroy(): void {
    this.logger.trace(`${ActivityComponent.name}: #ngDestroy called`);
    this.#destroy$.next();
    this.#destroy$.complete();
  }
}
