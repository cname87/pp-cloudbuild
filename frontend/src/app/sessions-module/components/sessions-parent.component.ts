import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Data, ParamMap } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { Observable, Subject } from 'rxjs';
import { IsLoadingService } from '@service-work/is-loading';

import { UserIdStateService } from '../../app-module/services/user-id-state-service/user-id-state.service';
import { ISession, ISessions } from '../models/sessions-models';
import { SessionsStore } from '../store/sessions.store';

/**
 * @title Training sessions parent component.
 *
 * There are two simple presentational components:
 * - sessions table
 * - session update form
 *
 * There is a store which stores and manipulates all state.
 *
 * This component handles all logic.
 *
 * Inputs:
 *
 * 1. On startup it receives a sessions object from the route resolver
 * Note: This is passed to a child component which causes the sessions table component to be shown.
 *
 * The sessions component will fire an event when a row in the sessions table is clicked, passing in row data. This component then uses the store to get the corresponding session detail, and then displays the session update form, displaying the passed in session detail.
 *
 * When the session form is submitted by the user the updated session detail is passed back to this component via an event. This component updates the store sessions object with the updated session, updates the backend with the sessions object, and displays the sessions table component with the updated sessions object.
 */
@Component({
  selector: 'app-session-parent',
  templateUrl: './sessions-parent.component.html',
  styleUrls: ['./sessions-parent.component.scss'],
})
export class SessionsParentComponent implements OnInit, OnDestroy {
  //
  /* show session or sessions components */
  showSession = false;
  showSessions = false;
  /* sessions list passed to the sessions component */
  sessions$!: Observable<ISessions>;
  /* clicked session passed to the session component */
  session$!: Observable<ISession>;
  /* used to unsubscribe */
  #destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private userIdStateService: UserIdStateService,
    private isLoadingService: IsLoadingService,
    private store: SessionsStore,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      `${SessionsParentComponent.name}: Starting SessionsParentComponent`,
    );
  }

  /**
   * Picks up any upstream errors and throws on the error.
   * @param err An error object
   * @throws Throws the received error object
   */
  #catchError = (err: any): never => {
    this.logger.trace(`${SessionsParentComponent.name}: #catchError called`);
    this.logger.trace(`${SessionsParentComponent.name}: Throwing the error on`);
    throw err;
  };

  ngOnInit(): void {
    this.logger.trace(`${SessionsParentComponent.name}: Starting ngOnInit`);

    /* loads the sessions object from the route data */
    const inputSessions$ = this.route.data.pipe(
      map((data: Data): ISessions => {
        return data.sessions;
      }),
    );
    /* pass to the sessions store */
    this.store.loadSessions(inputSessions$);
    /* pass an observable to the template */
    this.sessions$ = this.store.sessions$;
    /* show the sessions child component */
    this.showSessions = true;

    /* get member id from route state and pass it to user id service */
    this.route.paramMap
      .pipe(
        map((paramMap: ParamMap) => {
          const id = paramMap.get('id');
          if (!id) {
            throw new Error('id path parameter was invalid');
          }
          return id;
        }),
        takeUntil(this.#destroy$),
        catchError(this.#catchError),
      )
      .subscribe((id) => this.userIdStateService.updateIdState(id));
  }

  /**
   * Called when a clicked row is passed from the sessions component. Causes the session edit form to be shown.
   * @param rowIndex$ The zero-based index of the clicked row.
   */
  editSession(rowIndex$: Observable<number>): void {
    this.logger.trace(`${SessionsParentComponent.name}: Starting editSession`);

    /* exit if the table is loading due get sessions being called following a date change */
    if (this.isLoadingService.isLoading({ key: `${SessionsStore.name}#1` })) {
      return;
    }

    /* store the clicked row in the sessions store */
    this.store.loadRowIndex(rowIndex$);

    /* get the session corresponding click from the store to be sent to the session update page */
    this.session$ = this.store.session$;

    /* change the view to show the session update form */
    this.showSessions = false;
    this.showSession = true;
  }

  /**
   * @summary Takes a date from the sessions child component and calls a method to update the displayed sessions table.
   * @param date The date passed in.
   */
  newDate(date: Date) {
    this.store.getOrCreateSessions(date);
  }

  /**
   * @summary Called when an updated session, or undefined, is passed from the session update component.
   * It sets the sessions$ property and causes an updated sessions table to be shown.
   * @param newSessionOrUndefined The updated session, or undefined if the update was cancelled.
   */
  doneSession(newSessionOrUndefined: ISession | undefined): void {
    this.logger.trace(`${SessionsParentComponent.name}: Starting doneSession`);

    if (!!newSessionOrUndefined) {
      /* get an updated sessions object */
      this.store.updateSessionAtRowIndex(newSessionOrUndefined);
      /* update the backend */
      this.store.updateSessions();
    } else {
      /* if no session is passed in then make no changes */
    }

    /* change the view */
    this.showSessions = true;
    this.showSession = false;
  }

  ngOnDestroy(): void {
    this.logger.trace(`${SessionsParentComponent.name}: Starting ngOnDestroy`);
    this.#destroy$.next();
    this.#destroy$.complete();
  }
}
