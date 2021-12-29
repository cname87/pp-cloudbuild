import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { FormlyMatDatepickerModule } from '@ngx-formly/material/datepicker';
import { FormlyMatToggleModule } from '@ngx-formly/material/toggle';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import {
  MatFormFieldDefaultOptions,
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
} from '@angular/material/form-field';
import { NgxDatatableModule } from '@swimlane/ngx-datatable';

import { SessionsDatatableTypeComponent } from './components/sessions-datatable/datatable-type.component';
import { ScoresDatatableTypeComponent } from './components/scores-datatable/datatable.type';
import { DatepickerTypeComponent } from './components/datepicker/datepicker-type.component';
import { BaseModule } from '../base-module/base.module';

const appearance: MatFormFieldDefaultOptions = {
  appearance: 'outline',
};

@NgModule({
  declarations: [
    ScoresDatatableTypeComponent,
    SessionsDatatableTypeComponent,
    DatepickerTypeComponent,
  ],
  imports: [
    BaseModule,
    CommonModule,
    FormsModule,
    FormlyModule.forRoot({
      extras: { lazyRender: true },
      validationMessages: [
        { name: 'required', message: 'This field is required' },
      ],
      types: [
        {
          name: 'sessions-datatable',
          component: SessionsDatatableTypeComponent,
          defaultOptions: {
            templateOptions: {},
          },
        },
        {
          name: 'scores-datatable',
          component: ScoresDatatableTypeComponent,
          defaultOptions: {
            templateOptions: {},
          },
        },
        {
          name: 'datepicker',
          component: DatepickerTypeComponent,
          wrappers: ['form-field'],
          defaultOptions: {
            templateOptions: {
              datepickerOptions: {},
            },
          },
        },
      ],
    }),
    FormlyMaterialModule,
    FormlyMatDatepickerModule,
    FormlyMatToggleModule,
    ReactiveFormsModule,
    NgxDatatableModule,
  ],
  exports: [
    FormsModule,
    FormlyModule,
    FormlyMaterialModule,
    FormlyMatDatepickerModule,
    FormlyMatToggleModule,
    ReactiveFormsModule,
  ],
  providers: [
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: appearance,
    },
  ],
})
export class FormlyBaseModule {}
