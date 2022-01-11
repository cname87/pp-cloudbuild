import { Component, Input, Output, EventEmitter } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { AbstractControl, FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';

import {
  ISession,
  sessionTypeNames,
  ESessionType,
  ERpeScore,
  rpeNames,
} from '../../models/sessions-models';

/**
 * @title Training session update form.
 *
 * This component displays a form allowing detail on a training session be entered.
 *
 * Inputs:
 * 1. A session object is passed in from the parent component.
 *
 * Outputs:
 * 1. An event which registers that the session data is submitted.  It passes the updated session data, or undefined.
 *
 * Methods:
 * There are no exposed methods.
 *
 * Requirements:
 *
 * 1. This component displays a form corresponding to the session object passed in from the parent component.
 * Note: The displayed form allows data for a specific training session be updated for a specific member.
 *
 * 2. The user can edit session properties in the form. The updated values are saved for submission.
 *
 * 3. The user can press a cancel button which emits an event with an emitted target of undefined.
 * Note: The parent component registers the event and will cause the sessions table component to be displayed with the same sessions data as before.
 *
 * 4. The user can press a submit button which emits an event with an emitted target of the latest form data.
 * Note: The parent component registers the event and will cause the sessions table component to be displayed with updated sessions data showing the updated data for the edited session.
 *
 */

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss'],
  providers: [],
})
export class SessionComponent {
  //
  /* session to be edited - this is set to the form model in the template */
  @Input() session!: ISession;
  /* event to communicate form submission */
  @Output() doneSession = new EventEmitter<ISession>();

  /* define the text info card */
  line1 = '- Enter data in each field and click the UPDATE button';
  line2 = '- Click the CANCEL button to return without change';
  line3 = '';
  line4 = '';
  isGoBackVisible = false;

  /* form definition */
  form = new FormGroup({});
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[] = [
    {
      key: 'type',
      type: 'select',
      templateOptions: {
        type: 'select',
        label: 'Select the type of the session from the dropdown',
        options: sessionTypeNames.map((value: ESessionType) => {
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
          ): boolean => {
            /* must have a value & exclude the blank value */
            return (
              !!field.formControl?.value &&
              field.formControl?.value !== ESessionType.Blank
            );
          },
          message: (_control: AbstractControl, _field: FormlyFieldConfig) => {
            return `You must select an session type`;
          },
        },
      },
    },
    {
      key: 'rpe',
      type: 'select',
      templateOptions: {
        type: 'select',
        label: 'Select the Rate of Perceived Exertion from the dropdown',
        options: rpeNames.map((value: ERpeScore) => {
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
            return `You must select an rpe score`;
          },
        },
      },
    },
    {
      key: 'duration',
      type: 'input',
      templateOptions: {
        type: 'number',
        label: 'Enter the training time in minutes',
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

  constructor(private logger: NGXLogger) {
    this.logger.trace(`${SessionComponent.name}: Starting SessionComponent`);
  }

  /**
   * Emits an event to pass an updated session or to indicate no changes were made
   * @param sessionOrUndefined$ An updated session object or undefined (to indicate no changes made).
   */
  #emitDone(sessionOrUndefined: ISession | undefined = undefined): void {
    this.logger.trace(`${SessionComponent.name}: Starting #emitDone`);
    this.doneSession.emit(sessionOrUndefined);
  }

  /* called when cancel button pressed */
  cancel(): void {
    this.form.disable();
    this.#emitDone();
  }

  /* called when update button pressed */
  update(): void {
    this.form.disable();
    this.#emitDone(this.session);
  }
}
