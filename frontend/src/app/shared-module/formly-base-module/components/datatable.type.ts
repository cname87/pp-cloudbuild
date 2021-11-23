import {
  Component,
  ViewChild,
  OnInit,
  TemplateRef,
  AfterViewInit,
} from '@angular/core';
import { FormlyFieldConfig, FieldArrayType } from '@ngx-formly/core';
import { SelectionType, TableColumn } from '@swimlane/ngx-datatable';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'formly-field-datatable',
  styleUrls: ['./datatable.type.scss'],
  templateUrl: './datatable.type.html',
})
export class DatatableTypeComponent
  extends FieldArrayType
  implements AfterViewInit, OnInit
{
  @ViewChild('defaultColumn', { static: true })
  defaultColumn!: TemplateRef<any>;

  /* set to null to avoid cell colors when cells are selected on the table */
  selectionType = null as unknown as SelectionType;

  /* set table row height */
  rowHeight = 58;

  /* the field passed back to the formly form */
  formlyField: FormlyFieldConfig = {};

  /* holds detail on a clicked cell */
  clickedCell = { name: 'NAME', row: 1 };

  constructor(private logger: NGXLogger) {
    super();
    this.logger.trace(
      `${DatatableTypeComponent.name}: Starting DatatableTypeComponent`,
    );
    console.timeLog('scores');
  }

  /* sets the cell that was clicked and the field to be passed to the formly form */
  setCellAndField(
    field: FormlyFieldConfig,
    column: TableColumn & { propIndex: number },
    rowIndex: number,
  ) {
    this.logger.trace(
      `${DatatableTypeComponent.name}: Running setCellAndField`,
    );
    column.name = column.name ? column.name : '';
    this.clickedCell = { name: column.name, row: rowIndex };
    /* the input field parameter is the ngx-table containing an array of row fields, each of which is an array of fields */
    this.formlyField = (
      (field.fieldGroup as FormlyFieldConfig[])[rowIndex]
        .fieldGroup as FormlyFieldConfig[]
    )[column.propIndex];
  }

  /* checks if a supplied cell name and row index matches the stored clicked cell reference */
  isCellShown(name: string, rowIndex: number): boolean {
    return name === this.clickedCell.name && rowIndex === this.clickedCell.row;
  }

  /* clear any cell selections if enter or esc keys are pressed */
  onEnterOrEsc = (event: any) => {
    if (event.keyCode === 13 || event.keyCode === 27) {
      this.logger.trace(`${DatatableTypeComponent.name}: Enterkey pressed`);
      event.preventDefault();
      /* clear clicked cell selection */
      this.clickedCell = { name: 'NAME', row: 1 };
      /* force datatable table update */
      this.to.columns = [...this.to.columns];
    }
  };

  ngOnInit() {
    this.logger.trace(`${DatatableTypeComponent.name}: Starting ngOnInit`);
    console.timeLog('scores');

    /* Note: 'this.to' refers to the templateOptions set in the MemberScoresComponent */
    /* assigns a reference to the formly template */
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
      /* clear clicked cell selection */
      this.clickedCell = { name: 'NAME', row: 1 };
      /* force datatable table update */
      this.to.columns = [...this.to.columns];
      /* detect enter or esc key presses */
      document.addEventListener('keyup', this.onEnterOrEsc);
    });
  }

  ngAfterViewInit(): void {
    this.logger.trace(
      `${DatatableTypeComponent.name}: Starting ngAfterViewInit`,
    );
    console.timeLog('scores');
  }
}
