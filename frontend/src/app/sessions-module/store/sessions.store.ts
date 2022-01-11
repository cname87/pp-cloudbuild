import { Injectable } from '@angular/core';
import { ComponentStore, tapResponse } from '@ngrx/component-store';
import { NGXLogger } from 'ngx-logger';
import clonedeep from 'lodash.clonedeep';

import { UserIdStateService } from '../../app-module/services/user-id-state-service/user-id-state.service';
import { SessionsService } from '../services/sessions.service';
import { ISession, ISessions } from '../models/sessions-models';
import { concatMap, Observable, switchMap } from 'rxjs';
import { blankSessions } from '../models/dist/sessions-models';

export interface ISessionsState {
  /* the training sessions object*/
  sessions: ISessions;
  /* the row on the sessions table that was last clicked */
  rowIndex: number | undefined;
}

const defaultState: ISessionsState = {
  sessions: blankSessions as ISessions,
  rowIndex: undefined,
};

@Injectable()
export class SessionsStore extends ComponentStore<ISessionsState> {
  //
  constructor(
    private sessionsService: SessionsService,
    private userId: UserIdStateService,
    private logger: NGXLogger,
  ) {
    super(defaultState);
    this.logger.trace(`${SessionsStore.name}: Starting SessionsStore`);
  }

  /* ******** selectors ******** */

  readonly sessions$ = this.select(({ sessions }) => {
    this.logger.trace(`${SessionsStore.name}: Starting sessions$`);
    return sessions;
  });

  readonly session$ = this.select(({ sessions, rowIndex }) => {
    this.logger.trace(`${SessionsStore.name}: Starting session$`);
    if (rowIndex !== undefined) {
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

  readonly rowIndex$ = this.select(({ rowIndex }) => {
    this.logger.trace(`${SessionsStore.name}: Starting rowIndex$`);
    return rowIndex;
  });

  /* ViewModel for the component */
  readonly vm$ = this.select(
    this.sessions$,
    this.rowIndex$,
    (sessions, rowIndex) => ({
      sessions,
      rowIndex,
    }),
  );

  /* ******** updaters ******** */

  readonly loadSessions = this.updater((state, sessions: ISessions) => {
    this.logger.trace(`${SessionsStore.name}: Starting loadSessions`);
    const newState = clonedeep(state);
    newState.sessions = sessions;
    return newState;
  });

  readonly loadRowIndex = this.updater((state, rowIndex: number) => {
    this.logger.trace(`${SessionsStore.name}: Starting loadRowIndex`);
    const newState = clonedeep(state);
    newState.rowIndex = rowIndex;
    return newState;
  });

  readonly updateSessionAtRowIndex = this.updater(
    (state, session: ISession | undefined) => {
      this.logger.trace(
        `${SessionsStore.name}: Starting updateSessionAtRowIndex`,
      );
      if (!session) {
        return state;
      }
      const rowIndex = state.rowIndex;
      const newState = clonedeep(state);
      if (rowIndex !== undefined && newState.sessions) {
        newState.sessions.sessions[rowIndex].type = session.type;
        newState.sessions.sessions[rowIndex].rpe = session.rpe;
        newState.sessions.sessions[rowIndex].duration = session.duration;
        newState.sessions.sessions[rowIndex].comment = session.comment;
      }
      return newState;
    },
  );

  /* ******** effects ******** */

  readonly getOrCreateSessions = this.effect((date$: Observable<Date>) => {
    return date$.pipe(
      /* use switchMap so a new call made if date changes and the previous one abandoned */
      switchMap((date) => {
        this.logger.trace(
          `${SessionsStore.name}: Starting getOrCreateSessions`,
        );
        return this.sessionsService
          .getOrCreateSessions(this.userId.id, date)
          .pipe(
            /* tapResponse ensures that the effect still runs should an error occur */
            tapResponse(
              (sessions) => {
                this.logger.trace(
                  `${SessionsStore.name}: Received sessions ${JSON.stringify(
                    sessions,
                  )}`,
                );
                return this.loadSessions(sessions);
              },
              (e) => console.error(e),
            ),
          );
      }),
    );
  });

  readonly updateSessions = this.effect((dummy$) => {
    return dummy$.pipe(
      /* use concatMap calls will be completed in order */
      concatMap(() => {
        this.logger.trace(`${SessionsStore.name}: Starting updateSessions`);
        const sessions = this.get().sessions;
        return this.sessionsService.updateSessionsTable(sessions).pipe(
          /* tapResponse ensures that the effect still runs should an error occur */
          tapResponse(
            (sessions) => {
              this.logger.trace(
                `${SessionsStore.name}: Updated sessions ${JSON.stringify(
                  sessions,
                )}`,
              );
            },
            (e) => console.error(e),
          ),
        );
      }),
    );
  });
}
