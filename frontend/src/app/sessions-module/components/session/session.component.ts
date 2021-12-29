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
import { catchError, Observable, Subject, takeUntil } from 'rxjs';

/**
 * @title Training session update form.
 *
 * This component is enabled by the parent component. The parent component passes in a session observable object.
 *
 * This component displays a form allowing detail on a training session be entered.
 *
 * Requirements:
 *
 * 1. This component displays a form corresponding to the passed-in session object, allowing data for a specific training session be updated.
 *
 * 2. The user can edit session properties. The user can press a cancel button or a submit button.
 *
 * 3. An event is emitted to the parent component when the a button is pressed. This passes no data (undefined) is the cancel button is submitted and the updated form session object if the submit button is pressed
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
  @Input() session$!: Observable<ISession>;
  @Output() doneSession = new EventEmitter<ISession>();

  /* used to unsubscribe */
  #destroy$ = new Subject<void>();

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

  /**
   * Picks up any upstream errors and throws on the error.
   * @param err An error object
   * @throws Throws the received error object
   */
  #catchError = (err: any): never => {
    this.logger.trace(`${SessionComponent.name}: #catchError called`);
    this.logger.trace(`${SessionComponent.name}: Throwing the error on`);
    throw err;
  };

  /**
   * Emits an event to pass an updated session or to indicate no changes were made
   * @param sessionOrUndefined An updated session object or undefined (to indicate no changes made).
   */
  #emitDone(sessionOrUndefined: ISession | undefined = undefined): void {
    this.doneSession.emit(sessionOrUndefined);
  }

  /* subscribes to the session$ observable to create an object linked directly to the form model */
  ngOnInit(): void {
    this.logger.trace(`${SessionComponent.name}: Starting ngOnInit`);
    this.session$
      .pipe(takeUntil(this.#destroy$), catchError(this.#catchError))
      .subscribe((session) => {
        this.model = session;
      });
  }

  /* called when cancel button pressed */
  cancel(): void {
    this.form.disable();
    this.#emitDone();
  }

  /* called when update button pressed */
  update(): void {
    this.form.disable();
    this.#emitDone(this.model);
  }

  ngOnDestroy(): void {
    this.logger.trace(`${SessionComponent.name}: #ngDestroy called`);
    this.#destroy$.next();
    this.#destroy$.complete();
  }
}
