import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import { NGXLogger } from 'ngx-logger';
import clonedeep from 'lodash.clonedeep';

import { SessionsService } from '../services/sessions.service';
import { ISession, ISessions } from '../models/sessions-models';
import { catchError, EMPTY, Observable, switchMap, tap } from 'rxjs';

export interface ISessionsState {
  sessions: ISessions | undefined;
  session: ISession | undefined;
  rowIndex: number | undefined;
}

export interface IRowAndSession {
  rowIndex: number;
  session: ISession;
}

const defaultState: ISessionsState = {
  sessions: undefined,
  session: undefined,
  rowIndex: undefined,
};

@Injectable()
export class SessionsStore extends ComponentStore<ISessionsState> {
  //
  constructor(
    private sessionsService: SessionsService,
    private logger: NGXLogger,
  ) {
    super(defaultState);
    this.logger.trace(`${SessionsStore.name}: Starting SessionsStore`);
  }

  /* ******** selectors ******** */

  readonly sessions$ = this.select(({ sessions }) => {
    if (sessions) {
      return sessions;
    } else {
      throw new Error('Sessions object not found');
    }
  });
  readonly session$ = this.select(({ sessions, rowIndex }) => {
    if (sessions && rowIndex !== undefined) {
      return {
        type: sessions.sessions[rowIndex].type,
        rpe: sessions.sessions[rowIndex].rpe,
        duration: sessions.sessions[rowIndex].duration,
        comment: sessions.sessions[rowIndex].comment,
      };
    } else {
      return undefined;
    }
  });
  readonly rowIndex$ = this.select(({ rowIndex }) => rowIndex);

  /* ******** updaters ******** */

  readonly loadSessions = this.updater(
    (state, sessions: ISessions | undefined) => {
      this.logger.trace(`${SessionsStore.name}: Starting loadSessions`);
      const newState = clonedeep(state);
      newState.sessions = sessions;
      return newState;
    },
  );

  readonly loadSession = this.updater(
    (state, session: ISession | undefined) => {
      this.logger.trace(`${SessionsStore.name}: Starting loadSession`);
      const newState = clonedeep(state);
      newState.session = session;
      return newState;
    },
  );

  readonly loadRowIndex = this.updater(
    (state, rowIndex: number | undefined) => {
      this.logger.trace(`${SessionsStore.name}: Starting loadRowIndex`);
      const newState = clonedeep(state);
      newState.rowIndex = rowIndex;
      return newState;
    },
  );

  /**
   * Gets an updated Observable<ISessions> object from an input Observable<ISessions> object by replacing a specific training session with updated data.
   * @param inputSessions An ISessions object that is to be updated.
   * @param inputSession An ISession object, i.e. data on a training session that is to be updated in inputSessions$.
   * @param rowIndex The index of the training sessions array to be replaced.
   * @returns An updated ISessions object,
   */
  readonly updateSessions = this.updater(
    (state, rowAndSession: IRowAndSession) => {
      this.logger.trace(`${SessionsStore.name}: Starting updateSessions`);
      const newState = clonedeep(state);
      if (newState.sessions) {
        newState.sessions.sessions[rowAndSession.rowIndex].type =
          rowAndSession.session.type;
        newState.sessions.sessions[rowAndSession.rowIndex].rpe =
          rowAndSession.session.rpe;
        newState.sessions.sessions[rowAndSession.rowIndex].duration =
          rowAndSession.session.duration;
        newState.sessions.sessions[rowAndSession.rowIndex].comment =
          rowAndSession.session.comment;
      }
      return newState;
    },
  );

  /* ******** effects ******** */

  readonly getOrCreateSessions = this.effect((date$: Observable<Date>) => {
    this.logger.trace(`${SessionsStore.name}: Starting getOrCreateSessions`);
    return date$.pipe(
      // Handle race condition with the proper choice of the flattening operator.
      switchMap((date) =>
        this.sessionsService.getOrCreateSessions(3, date).pipe(
          //Act on the result within inner pipe.
          tap({
            next: (sessions) => this.loadSessions(sessions),
            error: (e) => console.error(e),
          }),
          // Handle potential error within inner pipe.
          catchError(() => EMPTY),
        ),
      ),
    );
  });
}
