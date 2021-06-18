import { AbstractControl } from '@angular/forms';
import { FormlyFieldConfig } from '@ngx-formly/core';

export class Score {
  //
  field: FormlyFieldConfig;

  constructor(metric: string, key: string, max: number) {
    this.field = {
      key: key,
      type: 'input',
      templateOptions: {
        type: 'number',
        label: `Rate your ${metric} from 1 (awful) to ${max} (excellent)`,
      },
      validators: {
        score: {
          expression: (
            _control: AbstractControl,
            field: FormlyFieldConfig,
          ): boolean => {
            const number = isNaN(Number(field.formControl?.value))
              ? 0
              : Number(field.formControl?.value);
            return number > 0 && number <= max;
          },
          message: (_control: AbstractControl, _field: FormlyFieldConfig) => {
            return `You must rate your ${metric} from 1 to ${max}`;
          },
        },
      },
    };
  }
}
