import { Injectable } from '@angular/core';
import { ComponentStore } from '@ngrx/component-store';
import clonedeep from 'lodash.clonedeep';

import { ISession, ISessions } from '../models/sessions-models';

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
  constructor() {
    super(defaultState);
  }

  readonly sessions$ = this.select(({ sessions }) => sessions);
  readonly session$ = this.select(({ sessions, rowIndex }) => {
    console.log(sessions);
    console.log(rowIndex);
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

  readonly loadSessions = this.updater(
    (state, sessions: ISessions | undefined) => {
      const newState = clonedeep(state);
      newState.sessions = sessions;
      return newState;
    },
  );

  readonly loadSession = this.updater(
    (state, session: ISession | undefined) => {
      const newState = clonedeep(state);
      newState.session = session;
      return newState;
    },
  );

  readonly loadRowIndex = this.updater(
    (state, rowIndex: number | undefined) => {
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
}
