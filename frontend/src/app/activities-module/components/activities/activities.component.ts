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
 * @title This component shows a form table allowing activities for a member to be viewed and entered or edited.
 */
@Component({
  selector: 'app-activities',
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.scss'],
  providers: [],
})
export class ActivitiesComponent implements OnInit {
  //
  /* clicked activityId */
  @Output() activityEvent = new EventEmitter<IActivity>();

  /* activity list */
  @Input() activities!: IActivity[];

  /* columns to display */
  displayedColumns = displayedColumns;
  /* table data source */
  dataSource!: MatTableDataSource<IActivity>;
  /* define the text info card */
  line1 = '- This is a log of miscellaneous activities ';
  line2 = '- Click the edit button to edit a previously entered activity';
  line3 = '';
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
    this.dataSource = new MatTableDataSource(this.activities);
    /* set up paginator, sort and filter */
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.filterPredicate = (session: IActivity, filter: string) => {
      return !filter || session.type === filter;
    };
  }

  getSession(activity: IActivity): void {
    this.activityEvent.emit(activity);
  }

  applyFilter(value: string) {
    this.dataSource.filter = value;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
}
