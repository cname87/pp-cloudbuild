import { Component, ViewChild } from '@angular/core';
import { FieldType } from '@ngx-formly/material';
import { MatInput } from '@angular/material/input';

@Component({
  selector: 'app-form-datepicker-type',
  styleUrls: ['./datepicker-type.component.scss'],
  templateUrl: './datepicker-type.component.html',
})
export class DatepickerTypeComponent extends FieldType {
  @ViewChild(MatInput) formFieldControl!: MatInput;
}
