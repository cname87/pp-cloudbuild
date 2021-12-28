import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Data, ParamMap } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { Observable, of, Subject } from 'rxjs';

import { RouteStateService } from '../../app-module/services/route-state-service/router-state.service';
// import { SessionsService } from '../services/sessions.service';
import { ISession, ISessions, ISessionsData } from '../models/sessions-models';

/**
 * @title This is the parent component of both the sessions table and the specific session editing table.
 *
 * On startup it receives a sessions object from the route resolver and sets the sessions$ variable which causes the sessions table component to be shown. the session variable is undefined on startup which causes the session edit table not to be shown.
 *
 * The sessions object will fire an event when the sessions table is clicked, causing the detail on an individual session to be passed in. This causes the session update form to be displayed, displaying the passed in session detail.
 *
 * When the session form is submitted the updated detail is passed back to this component via an event.
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
  /* sessions list observable passed to, and enabling, sessions component */
  sessions$!: Observable<ISessions> | undefined;
  /* clicked session passed to, and enabling, session component */
  session: ISession | undefined = undefined;
  /* used to store sessions data temporarily */
  sessionsTemp!: ISessions;
  /* index row of edited row */
  rowIndex!: number;
  /* used to unsubscribe */
  #destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    // private sessionsService: SessionsService,
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

  #getSessions(session: ISession): ISessions {
    this.logger.trace(
      `${SessionsParentComponent.name}: Starting #getSessions$`,
    );
    this.sessionsTemp.sessions[this.rowIndex].type = session.type;
    this.sessionsTemp.sessions[this.rowIndex].rpe = session.rpe;
    this.sessionsTemp.sessions[this.rowIndex].duration = session.duration;
    this.sessionsTemp.sessions[this.rowIndex].comment = session.comment;
    return this.sessionsTemp;
  }

  ngOnInit(): void {
    this.logger.trace(`${SessionsParentComponent.name}: Starting ngOnInit`);
    /* get the data as supplied from the route resolver */
    this.sessions$ = this.route.data.pipe(
      takeUntil(this.#destroy$),
      map((data: Data) => {
        return data.sessions;
      }),
      catchError(this.#catchError),
    );
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
    this.sessionsTemp = sessionsData.sessions;
    this.rowIndex = sessionsData.rowIndex;
    this.sessions$ = undefined;
    this.session = sessionsData.session;
  }

  /**
   * Called when an updated session is passed from the session update component. Causes an updated sessions table to be shown.
   */
  doneSession(session: ISession | undefined): void {
    this.logger.trace(`${SessionsParentComponent.name}: Starting doneSession`);
    this.session = undefined;
    if (!!session) {
      this.sessions$ = of(this.#getSessions(session));
    } else {
      this.sessions$ = of(this.sessionsTemp);
    }
  }

  ngOnDestroy(): void {
    this.logger.trace(`${SessionsParentComponent.name}: #ngDestroy called`);
    this.#destroy$.next();
    this.#destroy$.complete();
    this.routeStateService.updateIdState('');
  }
}
