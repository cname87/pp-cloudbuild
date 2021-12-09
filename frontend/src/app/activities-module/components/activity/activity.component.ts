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
  EMode,
  IActivityWithoutId,
} from '../../models/activity-models';
import { catchError, switchMap, takeUntil } from 'rxjs/operators';

/**
 * @title This component shows a form allowing detail on a training session to be entered.
 *
 * This component is enabled when an activity record is input from the parent component. The activity array is displayed in a table.
 *
 * If the supplied activity has an id property then an update and delete  button is shown. The activity properties can be edited and submitted, or the activity record can be deleted.
 *
 * If the supplied activity does not have an id property then a blank table is shown.  Values can be entered and saved.
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
  addLabel = 'ADD ACTIVITY';
  updateLabel = 'UPDATE ACTIVITY';
  /* default button label */
  buttonLabel = 'ADD ACTIVITY';

  /* form definition */
  form = new FormGroup({});
  model!: IActivity | IActivityWithoutId;
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[] = [
    {
      /* Customizing Datepicker is complex - see https://material.angular.io/components/datepicker/overview#setting-the-locale-code */
      key: 'date',
      type: 'datepicker',
      templateOptions: {
        type: 'datepicker',
        required: true,
        readonly: true,
        label: 'Enter the date of the activity',
      },
      validators: {
        date: {
          expression: (
            _control: AbstractControl,
            field: FormlyFieldConfig,
          ): boolean => {
            return !!field.formControl?.value;
          },
          message: (_control: AbstractControl, _field: FormlyFieldConfig) => {
            return `You must select a date`;
          },
        },
      },
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
            return number > 0 && number <= 180;
          },
          message: (_control: AbstractControl, _field: FormlyFieldConfig) => {
            return `You must enter a time from 1 to 180 minutes`;
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
        rows: 5,
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

  goBack(): void {
    this.doneEvent.emit();
  }

  onSubmit(): void {
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
          /* clear the form */
          if (this.options.resetModel) {
            this.options.resetModel();
          }
          /* renable the form */
          this.form.enable();
          /* allow errors go to errorHandler */

          this.goBack();
        }),
    );
  }

  delete(): void {
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
          this.goBack();
        }),
    );
  }

  ngOnDestroy(): void {
    this.logger.trace(`${ActivityComponent.name}: #ngDestroy called`);
    this.#destroy$.next();
    this.#destroy$.complete();
  }
}
