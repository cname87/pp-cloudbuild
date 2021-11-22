import {
  Component,
  ViewChild,
  OnInit,
  TemplateRef,
  AfterViewInit,
  // ChangeDetectionStrategy,
  SimpleChanges,
  OnChanges,
} from '@angular/core';
import { FormlyFieldConfig, FieldArrayType } from '@ngx-formly/core';
import { SelectionType, TableColumn } from '@swimlane/ngx-datatable';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'formly-field-datatable',
  styleUrls: ['./datatable.type.scss'],
  templateUrl: './datatable.type.html',
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatatableTypeComponent
  extends FieldArrayType
  implements AfterViewInit, OnInit, OnChanges
{
  @ViewChild('defaultColumn', { static: true })
  defaultColumn!: TemplateRef<any>;

  /* set to null to avoid cell colors when cells are selected on the table */
  selectionType = null as unknown as SelectionType;

  /* set table row height */
  rowHeight = 58;

  cell = document.querySelector('.clickable');
  showField = false;
  oneField = '' as any;
  showObject = { name: 'NAME', row: 1 };

  constructor(private logger: NGXLogger) {
    super();
    this.logger.trace(
      `${DatatableTypeComponent.name}: Starting DatatableTypeComponent`,
    );
    console.timeLog('scores');
  }
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
      /* force datatable table update */
      this.to.columns = [...this.to.columns];
    });
  }

  ngAfterViewInit(): void {
    this.logger.trace(
      `${DatatableTypeComponent.name}: Starting ngAfterViewInit`,
    );
    this.cell?.addEventListener('click', this.onClick);
    document.addEventListener('keyup', this.onKey);
    console.timeLog('scores');
  }

  /* set up table fields */
  getField(
    field: FormlyFieldConfig,
    column: TableColumn & { propIndex: number },
    rowIndex: number,
    _value: number,
  ): FormlyFieldConfig {
    // console.log(`rowIndex: ${rowIndex}`);
    // console.log(`column.name: ${column.name}`);
    // console.log(`field.key: ${field.key}`);
    // console.log(`value: ${value}`);
    // console.timeLog('scores');
    // return '' as any;
    return (
      (field.fieldGroup as FormlyFieldConfig[])[rowIndex]
        .fieldGroup as FormlyFieldConfig[]
    )[column.propIndex];
  }

  /* set up table fields */
  setField(
    field: FormlyFieldConfig,
    column: TableColumn & { propIndex: number },
    rowIndex: number,
  ): FormlyFieldConfig {
    // console.log(`rowIndex: ${rowIndex}`);
    // console.log(`column.name: ${column.name}`);
    // console.log(`field.key: ${field.key}`);
    // console.timeLog('scores');
    return (
      (field.fieldGroup as FormlyFieldConfig[])[rowIndex]
        .fieldGroup as FormlyFieldConfig[]
    )[column.propIndex];
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log(`Changes: ${JSON.stringify(changes.value)}`);
  }

  onClick(event: any, ...rest: any[]) {
    console.log(`Event: ${JSON.stringify(event)}`);
    console.log(`Value: ${rest[3]}`);
    this.oneField = this.setField(rest[0], rest[1], rest[2]);
    this.showObject = { name: rest[1].name, row: rest[2] };
  }

  onKey(event: any) {
    console.log('Test');
    if (event.keyCode === 13) {
      event.preventDefault();
      console.log('Enter key pressed!!!!!');
      this.showObject = { name: 'NAME', row: 1 };
    }
  }

  setShowField(name: string, rowIndex: number): boolean {
    // console.log(`Column.name: ${name}`);
    // console.log(`RowIndex: ${rowIndex}`);
    this.showField =
      name === this.showObject.name && rowIndex === this.showObject.row;
    // console.log(`Showfield: ${this.showField}`);
    return true;
  }
}
