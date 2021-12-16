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
export class DatatableTypeComponent extends FieldArrayType implements OnInit {
  //
  /* get the cell template to apply as the column template */
  @ViewChild('defaultColumn', { static: true })
  defaultColumn!: TemplateRef<any>;
  /* when clicked cell appear, initiate follow-on actions */
  @ViewChild('clickedField', { read: ElementRef })
  set clickedField(ref: ElementRef) {
    setTimeout(() => {
      if (!!ref) {
        this.#afterClickActions(ref);
      }
    }, 0);
  }
  /* set the focus on the textarea as soon as it is available */
  @ViewChild('popup', { static: false }) set popup(ref: ElementRef) {
    setTimeout(() => {
      if (!!ref) {
        ref.nativeElement.focus();
      }
    }, 0);
  }

  clickedElement: any = {};
  showField = true;

  /* holds detail on a clicked cell - used to identify which cell was clicked */
  clickedCell = { name: 'NAME', row: 1 };

  /* set to null to avoid cell colors when cells are selected on the table */
  selectionType = null as unknown as SelectionType;

  /* set table row height */
  rowHeight = 55;

  /* the field passed back to the formly form */
  formlyField: FormlyFieldConfig = {};

  /* summary row */
  enableSummary = true;
  summaryPosition = 'bottom';

  /* show comment text entry box */
  showComment = false;
  /* comment text entry box content */
  popupComment = '';

  constructor(private logger: NGXLogger) {
    super();
    this.logger.trace(
      `${DatatableTypeComponent.name}: Starting DatatableTypeComponent`,
    );
  }

  /**
   * Carries out additional actions after a cell is clicked.
   * (i) If there is a dropdown, it sends a second click to a clicked data entry cell to drop the select dropdown.
   * (ii) If there is an input cell, it moves the cursor into the input cell.
   */
  #afterClickActions = (clickedField: ElementRef) => {
    this.logger.trace(
      `${DatatableTypeComponent.name}: running #secondClickAndFocus`,
    );
    /* if a dropdown is clicked */
    const selectDropdown =
      clickedField.nativeElement.getElementsByClassName('mat-select-value')[0];
    if (selectDropdown) {
      selectDropdown.click();
      return;
    }
    /* if the comment field is clicked */
    const comment =
      clickedField.nativeElement.getElementsByTagName('textarea')[0];
    if (comment) {
      this.clickedElement = comment;
      comment.blur();
      this.showComment = true;
      this.popupComment = comment.value;
      return;
    }
    /* if an input field is clicked (other than the textarea comment field) */
    const input =
      clickedField.nativeElement.getElementsByClassName('mat-input-element')[0];
    if (input) {
      input.focus();
      return;
    }
  };

  /* clear any cell selections if enter or esc keys are pressed */
  #onEnterOrEsc = (event: any) => {
    const codeEnter = 13000;
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
   * A scan is run of every cell. For each cell this checks if the cell name and row index matches the stored clicked cell reference.
   * @returns If true then template will show a formly field entry cell, if false the template will show a value.
   */
  isCellAField(name: string, rowIndex: number): boolean {
    return name === this.clickedCell.name && rowIndex === this.clickedCell.row;
  }

  onBlurComment(comment: string) {
    this.clickedElement.value = comment;
    this.showComment = false;
    /* clear clicked cell selection */
    // this.clickedCell = { name: 'NAME', row: 1 };
    /* force datatable table update */
    this.to.columns = [...this.to.columns];
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
      /* clear clicked cell selection */
      this.clickedCell = { name: 'NAME', row: 1 };
      /* force datatable table update */
      this.to.columns = [...this.to.columns];
    });

    /* detect enter or esc key presses */
    document.addEventListener('keyup', this.#onEnterOrEsc);
  }
}
