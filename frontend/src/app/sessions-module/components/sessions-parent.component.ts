import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Data, ParamMap } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import clonedeep from 'lodash.clonedeep';

import { UserIdStateService } from '../../app-module/services/user-id-state-service/user-id-state.service';
import { SessionsService } from '../services/sessions.service';
import { ISession, ISessions, ISessionsData } from '../models/sessions-models';
import { SessionsStore } from '../store/sessions.store';

/**
 * @title Parent component of the sessions table and the specific session editing form.
 *
 * On startup it receives a sessions object from the route resolver and causes the sessions table component to be shown.
 *
 * The sessions component will fire an event when a row in the sessions table is clicked, passing in sessions data and row data. The sessions data is saved for later updating, This component then displays the session update form, displaying the passed in session detail.
 *
 * When the session form is submitted by the user the updated session detail is passed back to this component via an event. This component updates the previously stored sessions object with the updated session, updates the backend with the sessions object, and calls the sessions table component with the updated sessions object.
 */
@Component({
  selector: 'app-session-parent',
  templateUrl: './sessions-parent.component.html',
  styleUrls: ['./sessions-parent.component.scss'],
  providers: [SessionsStore],
})
export class SessionsParentComponent implements OnInit, OnDestroy {
  //
  /* member id passed to sessions component */
  memberId!: number;
  /* show session or sessions components */
  showSession = false;
  showSessions = true;
  /* sessions list passed to the sessions component */
  sessions!: ISessions;
  /* clicked session passed to the session component */
  session!: ISession;
  /* used to store sessions data temporarily */
  sessionsTemp!: ISessions;
  /* index row of edited row */
  rowIndex!: number;
  /* used to unsubscribe */
  #destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private sessionsService: SessionsService,
    private userIdStateService: UserIdStateService,
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

  /**
   * Updates the backend database with a sessions object.
   * @param inputSessions Sessions object to be sent to the database.
   */
  #updateSessions(inputSessions: ISessions): void {
    this.logger.trace(
      `${SessionsParentComponent.name}: #updateSessions called`,
    );
    this.sessionsService
      .updateSessionsTable(inputSessions)
      .pipe(takeUntil(this.#destroy$), catchError(this.#catchError))
      .subscribe((returnedSessions: ISessions) => {
        this.logger.trace(
          `${
            SessionsParentComponent.name
          }: Sessions table updated: ${JSON.stringify(returnedSessions)}`,
        );
      });
  }

  ngOnInit(): void {
    this.logger.trace(`${SessionsParentComponent.name}: Starting ngOnInit`);

    /* loads the sessions object from ten route data to the sessions store */
    const sessions = this.route.data.pipe(
      map((data: Data): ISessions => {
        return data.sessions;
      }),
    );
    this.store.loadSessions(sessions);
    /* TEMP */
    this.store.sessions$.subscribe((sessions) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.sessions = sessions!;
    });

    /* get member id from route state */
    this.route.paramMap
      .pipe(
        map((paramMap: ParamMap) => {
          const id = paramMap.get('id');
          if (!id) {
            throw new Error('id path parameter was invalid');
          }
          this.memberId = +id;
          return id;
        }),
        takeUntil(this.#destroy$),
        catchError(this.#catchError),
      )
      .subscribe((id) => this.userIdStateService.updateIdState(id));
  }

  /**
   * Called when a session is passed from the sessions component. Causes the session edit page to be shown.
   */
  editSession(sessionsData: ISessionsData): void {
    this.logger.trace(`${SessionsParentComponent.name}: Starting editSession`);
    /* store an independent copy of the input sessions data, and the rowIndex, to allow for updating the sessions object with an updated training session object later */
    this.sessionsTemp = clonedeep(sessionsData.sessions);

    /* store the clicked row in the sessions store */
    this.store.loadRowIndex(sessionsData.rowIndex);

    this.rowIndex = sessionsData.rowIndex;
    /* get the session from the input sessions object to allow it be sent to the session update page for updating */
    this.store.session$.subscribe((session) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      this.session = session!;
    });

    /* change the view to show the session update form */
    this.showSessions = false;
    this.showSession = true;
  }

  /**
   * Called when an updated session, or undefined, is passed from the session update component.
   * It sets the sessions$ property and causes an updated sessions table to be shown.
   */
  doneSession(inputSessionOrUndefined: ISession | undefined): void {
    this.logger.trace(`${SessionsParentComponent.name}: Starting doneSession`);
    if (!!inputSessionOrUndefined) {
      /* get an updated sessions object */
      this.store.updateSessions({
        session: inputSessionOrUndefined,
        rowIndex: this.rowIndex,
      });
      this.store.sessions$.subscribe((sessions) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        this.sessions = sessions!;
      });

      this.#updateSessions(this.sessions);
    } else {
      /* if no session is passed in then return the unchanged sessions object back to the sessions page */
      this.sessions = this.sessionsTemp;
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
