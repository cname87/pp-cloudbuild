import {
  Component,
  ViewChild,
  OnInit,
  TemplateRef,
  ElementRef,
} from '@angular/core';
import { FormlyFieldConfig, FieldArrayType } from '@ngx-formly/core';
import { SelectionType, TableColumn } from '@swimlane/ngx-datatable';
import { NGXLogger } from 'ngx-logger';

@Component({
  selector: 'formly-field-datatable',
  styleUrls: ['./datatable.type.scss'],
  templateUrl: './datatable.type.html',
})
export class ScoresDatatableTypeComponent
  extends FieldArrayType
  implements OnInit
{
  //
  /* get the cell template to apply as the column template */
  @ViewChild('defaultColumn', { static: true })
  defaultColumn!: TemplateRef<any>;
  /* when a clicked cell appears, initiate follow-on actions */
  @ViewChild('clickedField', { read: ElementRef })
  set clickedField(ref: ElementRef) {
    setTimeout(() => {
      if (!!ref) {
        this.#afterClickActions(ref);
      }
    }, 0);
  }

  /* holds detail on a clicked cell - used to identify which cell was clicked */
  clickedCell = { name: 'NAME', row: 1 };

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
      `${ScoresDatatableTypeComponent.name}: Starting ScoresDatatableTypeComponent`,
    );
  }

  /**
   * Carries out additional actions after a cell is clicked.
   */
  #afterClickActions = (clickedField: ElementRef) => {
    this.logger.trace(
      `${ScoresDatatableTypeComponent.name}: running #afterClickActions`,
    );

    /* if there is a dropdown, it sends a second click to a clicked data entry cell to drop the select dropdown */
    const selectDropdown: HTMLSelectElement =
      clickedField.nativeElement.getElementsByClassName('mat-select-value')[0];
    if (selectDropdown) {
      selectDropdown.click();
      return;
    }
    /* if an input field is clicked (other than the textarea comment field) it moves the cursor into the input cell */
    const input: HTMLInputElement =
      clickedField.nativeElement.getElementsByClassName('mat-input-element')[0];
    if (input) {
      input.focus();
      return;
    }
  };

  /* clear any cell selections if enter or esc keys are pressed */
  #onEnterOrEsc = (event: any) => {
    const codeEnter = 13;
    const codeEsc = 27;
    if (event.keyCode === codeEnter || event.keyCode === codeEsc) {
      this.logger.trace(
        `${ScoresDatatableTypeComponent.name}: Escape or Enter key pressed`,
      );
      /* stop any follow-on default action */
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
      `${ScoresDatatableTypeComponent.name}: Running setCellAndField`,
    );

    /* exit if the column is not a data entry column */
    if (!column.clickable) {
      this.logger.trace(
        `${ScoresDatatableTypeComponent.name}: Non-clickable column clicked`,
      );
      return;
    }

    /* sets the field entry cell that was clicked */
    column.name = column.name ? column.name : '';
    this.clickedCell = { name: column.name, row: rowIndex };

    /* sets the formly field to be set for the field entry cell */
    /* Note: the input field parameter below is the ngx-table containing an array of row fields, each of which is an array of fields */
    this.formlyField = (
      (field.fieldGroup as FormlyFieldConfig[])[rowIndex]
        .fieldGroup as FormlyFieldConfig[]
    )[column.propIndex];
  }

  /**
   * A scan is run of every cell. For each cell this checks if the cell name and row index matches the stored clicked cell reference.
   * @returns If true then template will show a formly field entry cell, if false the template will show a value.
   */
  isCellAField(name: string, rowIndex: number): boolean {
    return name === this.clickedCell.name && rowIndex === this.clickedCell.row;
  }

  ngOnInit() {
    this.logger.trace(
      `${ScoresDatatableTypeComponent.name}: Starting ngOnInit`,
    );

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
        `${ScoresDatatableTypeComponent.name}: Table model change reported`,
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
