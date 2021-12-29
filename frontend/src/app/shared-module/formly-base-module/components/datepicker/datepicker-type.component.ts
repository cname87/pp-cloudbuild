import { Component, ViewChild } from '@angular/core';
import { FieldType } from '@ngx-formly/material';
import { MatInput } from '@angular/material/input';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'app-form-datepicker-type',
  styleUrls: ['./datepicker-type.component.scss'],
  templateUrl: './datepicker-type.component.html',
})
export class DatepickerTypeComponent extends FieldType {
  @ViewChild(MatInput) formFieldControl!: MatInput;

  constructor(private logger: NGXLogger) {
    super();
    this.logger.trace(
      `${DatepickerTypeComponent.name}: Starting DatatableTypeComponent`,
    );
  }
}
