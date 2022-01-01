import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Data, ParamMap } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import clonedeep from 'lodash.clonedeep';

import { RouteStateService } from '../../app-module/services/route-state-service/route-state.service';
import { SessionsService } from '../services/sessions.service';
import { ISession, ISessions, ISessionsData } from '../models/sessions-models';

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
  providers: [],
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
    private routeStateService: RouteStateService,
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
   * Gets a specific training session from an Observable<ISessions> object. The specific training session is given by the input rowIndex.
   * @param inputSessions An ISessions object - the ISessions object contains a property 'sessions' which is an array of training session data.
   * @param roIndex The index of the 'sessions' array to return.
   * @returns A specific training session object,
   */
  #getSession(inputSessions: ISessions, rowIndex: number): ISession {
    this.logger.trace(`${SessionsParentComponent.name}: Starting #getSession`);
    return inputSessions.sessions[rowIndex];
  }
  /**
   * Gets an updated Observable<ISessions> object from an input Observable<ISessions> object by replacing a specific training session with updated data.
   * @param inputSessions An ISessions object that is to be updated.
   * @param inputSession An ISession object, i.e. data on a training session that is to be updated in inputSessions$.
   * @param rowIndex The index of the training sessions array to be replaced.
   * @returns An updated ISessions object,
   */
  #getSessions(
    inputSessions: ISessions,
    inputSession: ISession,
    rowIndex: number,
  ): ISessions {
    this.logger.trace(
      `${SessionsParentComponent.name}: Starting #getSessions$`,
    );
    inputSessions.sessions[rowIndex].type = inputSession.type;
    inputSessions.sessions[rowIndex].rpe = inputSession.rpe;
    inputSessions.sessions[rowIndex].duration = inputSession.duration;
    inputSessions.sessions[rowIndex].comment = inputSession.comment;
    return inputSessions;
  }

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
    /* sets the sessions$ object to the data as supplied from the route resolver */
    this.route.data
      .pipe(
        map((data: Data) => {
          return data.sessions;
        }),
        takeUntil(this.#destroy$),
        catchError(this.#catchError),
      )
      .subscribe((sessions) => {
        this.sessions = sessions;
      });
    /* update route state with member id */
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
      .subscribe((id) => this.routeStateService.updateIdState(id));
  }

  /**
   * Called when a session is passed from the sessions component. Causes the session edit page to be shown.
   */
  editSession(sessionsData: ISessionsData): void {
    this.logger.trace(`${SessionsParentComponent.name}: Starting editSession`);
    /* store an independent copy of the input sessions data, and the rowIndex, to allow for updating the sessions object with an updated training session object later */
    this.sessionsTemp = clonedeep(sessionsData.sessions);
    this.rowIndex = sessionsData.rowIndex;
    /* get the session from the input sessions object to allow it be sent to the session update page for updating */
    this.session = this.#getSession(
      sessionsData.sessions,
      sessionsData.rowIndex,
    );
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
      this.sessions = this.#getSessions(
        this.sessionsTemp,
        inputSessionOrUndefined,
        this.rowIndex,
      );
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
    this.logger.trace(`${SessionsParentComponent.name}: #ngDestroy called`);
    this.#destroy$.next();
    this.#destroy$.complete();
  }
}
