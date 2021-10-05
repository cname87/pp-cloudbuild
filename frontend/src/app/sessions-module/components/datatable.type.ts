import { Component, ViewChild, OnInit, TemplateRef } from '@angular/core';
import { FormlyFieldConfig, FieldArrayType } from '@ngx-formly/core';
import { SelectionType, TableColumn } from '@swimlane/ngx-datatable';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'formly-field-datatable',
  styleUrls: ['./datatable.type.scss'],
  templateUrl: './datatable.type.html',
})
export class DatatableTypeComponent extends FieldArrayType implements OnInit {
  @ViewChild('defaultColumn', { static: true })
  defaultColumn!: TemplateRef<any>;

  /* set to null to avoid cell colors when cells are selected on the table */
  selectionType = null as unknown as SelectionType;

  enableSummary = false;

  constructor(private logger: NGXLogger) {
    super();
    this.logger.trace(
      `${DatatableTypeComponent.name}: Starting DatatableTypeComponent`,
    );
  }
  ngOnInit() {
    /* Note: 'this.to' refers to the templateOptions set in the MemberScoresComponent */

    /* assigns a reference to the formly template */
    this.to.columns.forEach((column: any) => {
      column.cellTemplate = this.defaultColumn;
      column.propIndex = this.field.fieldArray?.fieldGroup?.findIndex(
        (f) => f.key === column.prop,
      );
    });
    /* register table model changes */
    this.to.tableChange.on('modelChange', () => {
      this.logger.trace(
        `${DatatableTypeComponent.name}: Table model change reported`,
      );
      /* force datatable table update */
      this.to.columns = [...this.to.columns];
    });
  }

  /* set up table fields */
  getField(
    field: FormlyFieldConfig,
    column: TableColumn & { propIndex: number },
    rowIndex: number,
  ): FormlyFieldConfig {
    return (
      (field.fieldGroup as FormlyFieldConfig[])[rowIndex]
        .fieldGroup as FormlyFieldConfig[]
    )[column.propIndex];
  }
}
