import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
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
 * @title This component shows a form allowing detail on a training session be entered.
 *
 * This component is enabled when detail on a specific training session is input from the parent sessions component. The session detail is displayed in a form.
 *
 * The session properties can be edited and submitted.
 *
 * An event is emitted when the form is submitted. This is picked up by the sessions-parent component which redisplays an updated activities component.
 */

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss'],
  providers: [],
})
export class SessionComponent implements OnInit {
  //
  /* session to be retrieved */
  @Input() session!: ISession;
  @Output() doneEvent = new EventEmitter<ISession | undefined>();

  /* define the text info card */
  line1 = '- Enter data in each field and click the UPDATE button';
  line2 = '- Click the CANCEL button to return without change';
  line3 = '';
  line4 = '';
  isGoBackVisible = false;

  /* form definition */
  form = new FormGroup({});
  model!: ISession;
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
          ): boolean => !!field.formControl?.value,
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

  ngOnInit(): void {
    this.logger.trace(`${SessionComponent.name}: Starting ngOnInit`);
    this.model = this.session;
  }

  #emitDone(session: ISession | undefined = undefined): void {
    this.doneEvent.emit(session);
  }

  cancel(): void {
    this.#emitDone();
  }

  update(): void {
    /* disable to avoid multiple submissions */
    this.form.disable();
    this.#emitDone(this.model);
  }
}
