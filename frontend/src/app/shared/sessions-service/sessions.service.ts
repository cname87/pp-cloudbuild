import { Injectable, Inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';
import { StatusCodes } from 'http-status-codes';
import { ToastrService } from 'ngx-toastr';

import { SessionsDataProvider } from '../../data-providers/sessions.data-provider';
import {
  ICount,
  ISession,
  ISessionWithoutId,
} from '../../data-providers/models/models';
import { MessageService } from '../message-service/message.service';
import { IErrReport, errorSearchTerm, E2E_TESTING } from '../../config';

/**
 * This service provides functions to call all the functions that call the backend according to the defined api providing appropriate responses, messaging and errorhandling.
 */
@Injectable({ providedIn: 'root' })
export class SessionsService {
  constructor(
    @Inject(E2E_TESTING) private isTesting: boolean,
    private messageService: MessageService,
    private sessionsDataProvider: SessionsDataProvider,
    private logger: NGXLogger,
    private toastr: ToastrService,
  ) {
    this.logger.trace(`${SessionsService.name}: starting SessionsService`);
  }

  /* common toastr message */
  private toastrMessage = 'A server access error has occurred';

  /**
   * Gets all sessions from all user members from the server.
   * @param matchString: Returns only those sessions whose 'type' start with that string.
   * @returns
   * - An observable with an array of the sessions returned from the server.
   * - 404 is received from the server if there are no sessions in the stored team or if there are no sessions matching the supplied term.  In this case an empty array is returned.
   * @throws
   * - Throws an observable with an error if any response other than a successful response, or a Not Found/404, is received from the server.
   */
  getAllSessions(matchString?: string): Observable<ISession[]> {
    this.logger.trace(`${SessionsService.name}: getAllSessions called`);

    /* e2e error test - only if e2e test and match to a specific term */
    if (this.isTesting && matchString === errorSearchTerm) {
      this.logger.trace(
        `${SessionsService.name}: e2e testing - throwing an error`,
      );
      throw new Error('Test application error');
    }

    if (typeof matchString === 'string' && matchString.trim() === '') {
      this.logger.trace(
        `${SessionsService.name}: Search term exists but is blank - returning empty sessions array`,
      );
      return of([]);
    }

    return this.sessionsDataProvider.getAllSessions(matchString).pipe(
      tap((sessions) => {
        if (sessions.length > 0) {
          if (matchString) {
            this.log(`Found sessions matching "${matchString}"`);
          } else {
            this.log('Fetched all sessions');
          }
        } else if (matchString) {
          this.log(`Did not find any sessions matching "${matchString}"`);
        } else {
          this.log('There are no sessions to fetch');
        }
      }),
      catchError((err: IErrReport) => {
        this.logger.trace(`${SessionsService.name}: catchError called`);

        /* inform user and mark as handled */
        this.log('ERROR: Failed to get sessions from server');
        this.toastr.error('ERROR!', this.toastrMessage);
        err.isHandled = true;

        this.logger.trace(`${SessionsService.name}: Throwing the error on`);
        return throwError(err);
      }),
    );
  }

  /**
   * Gets sessions from the server tied to a particular user team member.
   * @param memberId: The member whose sessions will be returned.
   * @param matchString: Returns only those sessions whose 'type' start with that string.
   * @returns
   * - An observable with an array of the sessions returned from the server.
   * - 404 is received from the server if there are no sessions in the stored team or if there are no sessions matching the supplied term.  In this case an empty array is returned.
   * @throws
   * - Throws an observable with an error if any response other than a successful response, or a Not Found/404, is received from the server.
   */
  getSessions(memberId: number, matchString?: string): Observable<ISession[]> {
    this.logger.trace(`${SessionsService.name}: getSessions called`);

    /* e2e error test - only if e2e test and match to a specific term */
    if (this.isTesting && matchString === errorSearchTerm) {
      this.logger.trace(
        `${SessionsService.name}: e2e testing - throwing an error`,
      );
      throw new Error('Test application error');
    }

    if (typeof matchString === 'string' && matchString.trim() === '') {
      this.logger.trace(
        `${SessionsService.name}: Search term exists but is blank - returning empty sessions array`,
      );
      return of([]);
    }

    return this.sessionsDataProvider.getSessions(memberId, matchString).pipe(
      tap((sessions) => {
        if (sessions.length > 0) {
          if (matchString) {
            this.log(`Found sessions matching "${matchString}"`);
          } else {
            this.log('Fetched all sessions');
          }
        } else if (matchString) {
          this.log(`Did not find any sessions matching "${matchString}"`);
        } else {
          this.log('There are no sessions to fetch');
        }
      }),
      catchError((err: IErrReport) => {
        this.logger.trace(`${SessionsService.name}: catchError called`);

        /* inform user and mark as handled */
        this.log('ERROR: Failed to get sessions from server');
        this.toastr.error('ERROR!', this.toastrMessage);
        err.isHandled = true;

        this.logger.trace(`${SessionsService.name}: Throwing the error on`);
        return throwError(err);
      }),
    );
  }

  /**
   * Gets a particular session.
   * @param sessionOrId: The id of the session that will be returned.
   * @returns An observable containing a session object.
   * @throws: Throws an observable with an error if any response other than a successful response is received from the server.
   */
  getSession(SessionId: number): Observable<ISession> {
    this.logger.trace(`${SessionsService.name}: getSession called`);

    return this.sessionsDataProvider.getSession(SessionId).pipe(
      tap((_) => {
        this.log(`Fetched session with id = ${SessionId}`);
      }),

      catchError((errReport: IErrReport) => {
        this.logger.trace(`${SessionsService.name}: catchError called`);

        /* inform user */
        if (
          errReport.error &&
          errReport.error.status === StatusCodes.NOT_FOUND
        ) {
          /* 404: session did not exist */
          this.log(`ERROR: Did not find session with id = ${SessionId}`);
        } else {
          /* otherwise a general fail */
          this.log('ERROR: Failed to get session from server');
        }
        this.toastr.error('ERROR!', this.toastrMessage);
        /* mark as handled */
        errReport.isHandled = true;

        this.logger.trace(`${SessionsService.name}: Throwing the error on`);
        return throwError(errReport);
      }),
    );
  }

  /**
   * Adds a new session to the member record.
   * @param: session: Session object to be added (without an id field).
   * @returns:An observable containing the added session.
   * @throws: Throws an observable with an error if any response other than a successful response is received from the server.
   */
  addSession(session: ISessionWithoutId): Observable<ISession> {
    this.logger.trace(`${SessionsService.name}: addSession called`);

    return this.sessionsDataProvider.addSession(session).pipe(
      tap((newSession: ISession) => {
        this.log(`Added session with id = ${newSession.id}`);
      }),

      catchError((err: IErrReport) => {
        this.logger.trace(`${SessionsService.name}: catchError called`);

        /* inform user and mark as handled */
        this.log('ERROR: Failed to add session to server');
        this.toastr.error('ERROR!', this.toastrMessage);
        err.isHandled = true;

        this.logger.trace(`${SessionsService.name}: Throwing the error on`);
        return throwError(err);
      }),
    );
  }

  /**
   * Deletes a particular session.
   * @param sessionOrId: The id of the session, or the session object, that will be deleted.
   * @returns An observable containing a session object.
   * @throws: Throws an observable with an error if any response other than a successful response is received from the server.
   */
  deleteSession(sessionOrId: ISession | number): Observable<ICount> {
    this.logger.trace(`${SessionsService.name}: deleteSession called`);

    const sessionId =
      typeof sessionOrId === 'number' ? sessionOrId : sessionOrId.id;

    return this.sessionsDataProvider.deleteSession(sessionId).pipe(
      tap(() => {
        this.log(`Deleted session with id = ${sessionId}`);
      }),

      catchError((errReport: IErrReport) => {
        this.logger.trace(`${SessionsService.name}: catchError called`);

        /* inform user */
        if (
          errReport.error &&
          errReport.error.status === StatusCodes.NOT_FOUND
        ) {
          /* 404: session did not exist */
          this.log(`ERROR: Did not find session with id = ${sessionId}`);
        } else {
          /* otherwise a general fail */
          this.log('ERROR: Failed to delete session from server');
          this.toastr.error('ERROR!', this.toastrMessage);
        }
        /* mark as handled */
        errReport.isHandled = true;

        this.logger.trace(`${SessionsService.name}: Throwing the error on`);
        return throwError(errReport);
      }),
    );
  }

  /**
   * Updates a particular session.
   * @param session: The session object to be updated, which must contain an id field.
   * @returns An observable containing a session object.
   * @throws: Throws an observable with an error if any response other than a successful response is received from the server.
   */
  updateSession(session: ISession): Observable<ISession> {
    this.logger.trace(`${SessionsService.name}: updateSession called`);

    return this.sessionsDataProvider.updateSession(session).pipe(
      tap(() => {
        this.log(`Updated session with id = ${session.id}`);
      }),

      catchError((errReport: IErrReport) => {
        this.logger.trace(`${SessionsService.name}: catchError called`);

        /* inform user */
        if (
          errReport.error &&
          errReport.error.status === StatusCodes.NOT_FOUND
        ) {
          /* 404: session did not exist */
          this.log(`ERROR: Did not find session with id = ${session.id}`);
        } else {
          /* otherwise a general fail */
          this.log('ERROR: Failed to update session on the server');
          this.toastr.error('ERROR!', this.toastrMessage);
        }
        /* mark as handled */
        errReport.isHandled = true;

        this.logger.trace(`${SessionsService.name}: Throwing the error on`);
        return throwError(errReport);
      }),
    );
  }

  /**
   * Displays a message on the web page message log.
   */
  private log(message: string): void {
    this.logger.trace(`${SessionsService.name}: Reporting: ${message}`);
    this.messageService.add(`SessionsService: ${message}`);
  }
}
