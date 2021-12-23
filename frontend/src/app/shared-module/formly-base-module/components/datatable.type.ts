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
  /* when a clicked cell appears, initiate follow-on actions */
  @ViewChild('clickedField', { read: ElementRef })
  set clickedField(ref: ElementRef) {
    setTimeout(() => {
      if (!!ref) {
        this.#afterClickActions(ref);
      }
    }, 0);
  }
  /* the clicked comment cell (that initiates a popup comment box) */
  clickedCommentCell!: HTMLTextAreaElement;
  /* show comment text entry box */
  showCommentArea = false;
  /* comment text entry box content */
  popupComment = '';
  /* set only when the comment text entry becomes visible */
  visibleCommentArea!: ElementRef;
  /* set the focus on the textarea as soon as it is available */
  @ViewChild('popup', { static: false })
  set popup(ref: ElementRef) {
    setTimeout(() => {
      if (!!ref) {
        ref.nativeElement.focus();
        this.visibleCommentArea = ref;
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
      `${DatatableTypeComponent.name}: Starting DatatableTypeComponent`,
    );
  }

  /**
   * Carries out additional actions after a cell is clicked.
   */
  #afterClickActions = (clickedField: ElementRef) => {
    this.logger.trace(
      `${DatatableTypeComponent.name}: running #afterClickActions`,
    );

    /* if there is a dropdown, it sends a second click to a clicked data entry cell to drop the select dropdown */
    const selectDropdown: HTMLSelectElement =
      clickedField.nativeElement.getElementsByClassName('mat-select-value')[0];
    if (selectDropdown) {
      /* clear any comment field */
      this.popupComment = '';
      this.showCommentArea = false;
      selectDropdown.click();
      return;
    }
    /* if its a comment field it opens a comment text area */
    const comment: HTMLTextAreaElement =
      clickedField.nativeElement.getElementsByTagName('textarea')[0];
    if (comment) {
      this.clickedCommentCell = comment;
      /* disable the comment cell that was clicked */
      comment.disabled = true;
      /* show comment area */
      this.showCommentArea = true;
      /* if the comment area is open you must set the area value */
      if (this.visibleCommentArea) {
        this.visibleCommentArea.nativeElement.value =
          /* trim and remove '-' if its the only content */
          comment.value.trim() === '-' ? '' : comment.value.trim();
      }
      /* set the comment area content in the html */
      this.popupComment =
        /* trim and remove '-' if its the only content */
        comment.value.trim() === '-' ? '' : comment.value.trim();
      return;
    }
    /* if an input field is clicked (other than the textarea comment field) it moves the cursor into the input cell */
    const input: HTMLInputElement =
      clickedField.nativeElement.getElementsByClassName('mat-input-element')[0];
    if (input) {
      /* clear any comment field */
      this.popupComment = '';
      this.showCommentArea = false;
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
        `${DatatableTypeComponent.name}: Escape or Enter key pressed`,
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
      `${DatatableTypeComponent.name}: Running setCellAndField`,
    );

    /* exit if the column is not a data entry column */
    if (!column.clickable) {
      this.logger.trace(
        `${DatatableTypeComponent.name}: Non-clickable column clicked`,
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

  /**
   * Adds a comment from the text entry comment area back to the comment cell.
   * @param text The comment to be added.
   */
  addComment(text: string): void {
    this.logger.trace(`${DatatableTypeComponent.name}: running addComment`);
    if (!text) {
      text = '-';
    }
    /* set the value of the text area */
    this.formlyField.formControl?.setValue(text.trim());
    /* hide comment area */
    this.showCommentArea = false;
    /* send a change event to cause the comment cell text area to load the text */
    const changeEvent = new Event('change');
    this.clickedCommentCell.dispatchEvent(changeEvent);
    /* clear clicked cell selection */
    this.clickedCell = { name: 'NAME', row: 1 };
    /* force datatable table update */
    this.to.columns = [...this.to.columns];
  }
  /**
   * Cancels comment entry, i.e. after a pop up comment text area is opened.
   */
  cancelComment(): void {
    this.logger.trace(`${DatatableTypeComponent.name}: running cancelComment`);
    this.popupComment = '';
    this.showCommentArea = false;
    /* clear clicked cell selection */
    this.clickedCell = { name: 'NAME', row: 1 };
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
