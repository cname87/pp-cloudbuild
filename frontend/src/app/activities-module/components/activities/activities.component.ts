import {
  Component,
  ViewChild,
  Input,
  OnInit,
  Output,
  EventEmitter,
  AfterViewInit,
} from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { NGXLogger } from 'ngx-logger';
import { catchError, Observable, shareReplay, Subject, takeUntil } from 'rxjs';

import {
  activityTypeNames,
  displayedColumns,
  IActivity,
} from '../../models/activity-models';

/**
 * @title This component shows a table allowing records for miscellaneous activities for a member be viewed. A separate component can be called to enter new activity records or edit existing ones.
 *
 * This component is enabled when an activities array is input from the parent component. This activities array is displayed in a table.
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
})
export class ActivitiesComponent implements OnInit, AfterViewInit {
  //
  /* activities list passed in from parent */
  @Input() activities$!: Observable<IActivity[]> | undefined;

  /* event to pass clicked table row */
  @Output() editActivityEvent = new EventEmitter<IActivity>();
  /* event to pass on clicked add activity button */
  @Output() addActivityEvent = new EventEmitter<void>();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  /* columns to display */
  displayedColumns = displayedColumns;
  /* table data source */
  dataSource!: MatTableDataSource<IActivity>;
  /* define the text info card */
  line1 = '- Click the ADD button to enter a new activity';
  line2 = '- Click on a row or an EDIT button to edit an activity';
  line3 = '';
  line4 = '';
  isGoBackVisible = false;
  /* activity types for template */
  types = activityTypeNames;
  /* used to unsubscribe */
  #destroy$ = new Subject<void>();

  constructor(private logger: NGXLogger) {
    this.logger.trace(
      `${ActivitiesComponent.name}: Starting ActivitiesComponent`,
    );
  }

  /**
   * Picks up any upstream errors and throws on the error.
   * @param err An error object
   * @throws Throws the received error object
   */
  #catchError = (err: any): never => {
    this.logger.trace(`${ActivitiesComponent.name}: #catchError called`);
    this.logger.trace(`${ActivitiesComponent.name}: Throwing the error on`);
    throw err;
  };

  ngOnInit(): void {
    this.logger.trace(`${ActivitiesComponent.name}: Starting ngOnInit`);
    (this.activities$ as Observable<IActivity[]>)
      .pipe(
        takeUntil(this.#destroy$),
        shareReplay(1),
        catchError(this.#catchError),
      )
      .subscribe((activities: IActivity[]) => {
        this.logger.trace(
          `${ActivitiesComponent.name}: Received activities: ${JSON.stringify(
            activities,
          )}`,
        );
        this.dataSource = new MatTableDataSource(activities);
        /* set up filter */
        this.dataSource.filterPredicate = (
          activity: IActivity,
          filter: string,
        ) => {
          return !filter || activity.type === filter;
        };
      });
  }

  ngAfterViewInit(): void {
    this.logger.trace(`${ActivitiesComponent.name}: Starting ngAfterViewInit`);
    /* setTimeout necessary to avoid change detection errors */
    setTimeout(() => {
      if (this.dataSource && this.paginator && this.sort) {
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
      } else {
        throw new Error(
          `${ActivitiesComponent.name}: Paginator or Sort not enabled`,
        );
      }
    }, 0);
  }

  editActivity(activity: IActivity): void {
    this.logger.trace(`${ActivitiesComponent.name}: Starting editActivity`);
    this.editActivityEvent.emit(activity);
  }

  addActivity(): void {
    this.logger.trace(`${ActivitiesComponent.name}: Starting addActivity`);
    this.addActivityEvent.emit();
  }

  applyFilter(value: string) {
    this.logger.trace(`${ActivitiesComponent.name}: Starting applyFilter`);
    this.dataSource.filter = value;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  ngOnDestroy(): void {
    this.logger.trace(`${ActivitiesComponent.name}: #ngDestroy called`);
    this.#destroy$.next();
    this.#destroy$.complete();
  }
}
