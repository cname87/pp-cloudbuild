import {
  Component,
  ViewChild,
  OnInit,
  TemplateRef,
  EventEmitter,
} from '@angular/core';
import { FormlyFieldConfig, FieldArrayType } from '@ngx-formly/core';
import { SelectionType } from '@swimlane/ngx-datatable';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'formly-field-datatable',
  styleUrls: ['./datatable-type.component.scss'],
  templateUrl: './datatable-type.component.html',
})
export class DatatableTypeComponent extends FieldArrayType implements OnInit {
  //
  /* get the cell template to apply as the column template */
  @ViewChild('defaultColumn', { static: true })
  defaultColumn!: TemplateRef<any>;

  /* set to null to avoid cell colors when cells are selected on the table */
  selectionType = null as unknown as SelectionType;

  /* set table row height */
  cssDefaultGap =
    +getComputedStyle(document.documentElement).getPropertyValue('--base') ||
    48;
  rowHeight = 3 * this.cssDefaultGap;

  /* the field passed back to the formly form */
  formlyField!: FormlyFieldConfig;

  /* summary row */
  enableSummary = true;
  summaryPosition = 'bottom';

  constructor(private logger: NGXLogger) {
    super();
    this.logger.trace(
      `${DatatableTypeComponent.name}: Starting DatatableTypeComponent`,
    );
  }

  /**
   * Reports a table click.
   */
  callUpdateSession(rowIndex: number) {
    this.logger.trace(
      `${DatatableTypeComponent.name}: Running setCellAndField`,
    );
    /* send row index to parent */
    (this.to.tableClick as EventEmitter<number>).emit(rowIndex);
  }

  ngOnInit() {
    this.logger.trace(`${DatatableTypeComponent.name}: Starting ngOnInit`);

    /* Note: 'this.to' refers to the templateOptions set in the ScoresComponent */
    /* assigns a reference to the formly field template */
    this.to.columns.forEach((column: any) => {
      column.cellTemplate = this.defaultColumn;
      column.propIndex = this.field.fieldArray?.fieldGroup?.findIndex(
        (field) => field.key === column.prop,
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
}
