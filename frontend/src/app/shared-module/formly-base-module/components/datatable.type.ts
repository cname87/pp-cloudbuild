import {
  Component,
  ViewChild,
  OnInit,
  TemplateRef,
  ElementRef,
} from '@angular/core';
import {
  FormlyFieldConfig,
  FieldArrayType,
  // FormlyField,
} from '@ngx-formly/core';
import { SelectionType, TableColumn } from '@swimlane/ngx-datatable';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'formly-field-datatable',
  styleUrls: ['./datatable.type.scss'],
  templateUrl: './datatable.type.html',
})
export class DatatableTypeComponent extends FieldArrayType implements OnInit {
  //
  /* get the cell template to apply as the column template*/
  @ViewChild('defaultColumn', { static: true })
  defaultColumn!: TemplateRef<any>;
  /* get a clicked field to send a second click to open the select dropdown */
  @ViewChild('clickedField', { read: ElementRef, static: false })
  set clickedField(fieldToClickAgain: ElementRef) {
    setTimeout(() => {
      if (fieldToClickAgain) {
        this.#secondClick(fieldToClickAgain);
      }
    }, 0);
  }

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
  }

  /* send a second click to a clicked data entry cell to drop the select dropdown (if there is one) */
  #secondClick = (fieldToClick: ElementRef) => {
    this.logger.trace(`${DatatableTypeComponent.name}: running #secondClick`);
    const selectDropdown =
      fieldToClick.nativeElement.getElementsByClassName('mat-select-value')[0];
    if (selectDropdown) {
      selectDropdown.click();
    }
  };

  /* clear any cell selections if enter or esc keys are pressed */
  #onEnterOrEsc = (event: any) => {
    const codeEnter = 13;
    const codeEsc = 27;
    if (event.keyCode === codeEnter || event.keyCode === codeEsc) {
      this.logger.trace(
        `${DatatableTypeComponent.name}: Escape or Enter key pressed`,
      );
      event.preventDefault();
      /* clear clicked cell selection */
      this.clickedCell = { name: 'NAME', row: 1 };
      /* force datatable table update */
      this.to.columns = [...this.to.columns];
    }
  };

  /**
   * Runs when a field is clicked. Sets the cell detail of the cell that was clicked and sets the field to be passed to the formly form.
   */
  setCellAndField(
    field: FormlyFieldConfig,
    column: TableColumn & { propIndex: number; clickable: boolean },
    rowIndex: number,
  ) {
    this.logger.trace(
      `${DatatableTypeComponent.name}: Running setCellAndField`,
    );

    /* exit if the column is not a data entry column */
    if (!column.clickable) {
      return;
    }

    /* sets the field entry cell that was clicked */
    column.name = column.name ? column.name : '';
    this.clickedCell = { name: column.name, row: rowIndex };

    /* sets the field to be set for the field entry cell */
    /* Note: the input field parameter below is the ngx-table containing an array of row fields, each of which is an array of fields */
    this.formlyField = (
      (field.fieldGroup as FormlyFieldConfig[])[rowIndex]
        .fieldGroup as FormlyFieldConfig[]
    )[column.propIndex];
  }

  /**
   * A scan is run of every cell.  For each cell this checks if the cell name and row index matches the stored clicked cell reference - this is used to show either a formly form cell or a value */
  isCellAField(name: string, rowIndex: number): boolean {
    return name === this.clickedCell.name && rowIndex === this.clickedCell.row;
  }

  ngOnInit() {
    this.logger.trace(`${DatatableTypeComponent.name}: Starting ngOnInit`);

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
    });

    /* detect enter or esc key presses */
    document.addEventListener('keyup', this.#onEnterOrEsc);
  }
}
