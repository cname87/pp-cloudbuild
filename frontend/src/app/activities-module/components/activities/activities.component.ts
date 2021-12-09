import {
  Component,
  ViewChild,
  Input,
  OnInit,
  Output,
  EventEmitter,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NGXLogger } from 'ngx-logger';

import {
  activityTypeNames,
  displayedColumns,
  IActivity,
} from '../../models/activity-models';

/**
 * @title This component shows a table allowing records for miscellaneous activities for a member be viewed. A separate component can be called to enter new activity records or edit existing ones.
 *
 * This component is enabled when an activities array is input from the parent component.  This activities array is displayed in the table.
 *
 * If the user clicks on a row then an event is emitted to the parent component, (which displays a component to allow the activity record be edited or deleted).
 * If the user clicks on the Add button then an event is emitted to the parent component, (which displays a component to allow a new activity record be entered).
 *
 * When the activity entry/edit component closes this component is reopened with an updated activities array.
 */
@Component({
  selector: 'app-activities',
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.scss'],
  providers: [],
})
export class ActivitiesComponent implements OnInit {
  //
  /* activity list */
  @Input() activities!: IActivity[] | null;

  /* clicked table row */
  @Output() editActivityEvent = new EventEmitter<IActivity>();
  /* clicked add activity button */
  @Output() addActivityEvent = new EventEmitter<void>();

  /* columns to display */
  displayedColumns = displayedColumns;
  /* table data source */
  dataSource!: MatTableDataSource<IActivity>;
  /* define the text info card */
  line1 = '- This is a log of miscellaneous activities ';
  line2 = '- Click the add button to enter a new activity record';
  line3 = '- Click an edit button to edit a previously entered activity';
  line4 = '';
  isGoBackVisible = false;
  /* activity types for template */
  types = activityTypeNames;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private logger: NGXLogger) {
    this.logger.trace(
      `${ActivitiesComponent.name}: Starting ActivitiesComponent`,
    );
  }

  ngOnInit(): void {
    this.logger.trace(`${ActivitiesComponent.name}: Starting ngOnInit`);
    if (this.activities) {
      this.dataSource = new MatTableDataSource(this.activities);
    } else {
      throw new Error('Required activities array was invalid');
    }
    /* set up paginator, sort and filter */
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (session: IActivity, filter: string) => {
      return !filter || session.type === filter;
    };
  }

  editActivity(activity: IActivity): void {
    this.editActivityEvent.emit(activity);
  }

  addActivity(): void {
    this.addActivityEvent.emit();
  }

  applyFilter(value: string) {
    this.dataSource.filter = value;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
