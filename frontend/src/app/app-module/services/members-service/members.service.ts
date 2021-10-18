import { Injectable, Inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';
import { StatusCodes } from 'http-status-codes';
import { ToastrService } from 'ngx-toastr';

import { MembersDataProvider } from '../../data-providers/members.data-provider';
import { ICount, IMember, IMemberWithoutId } from '../../models/models';
import { IErrReport, errorSearchTerm, E2E_TESTING } from '../../../configuration/configuration';

/**
 * This service provides functions to call all the api functions providing appropriate responses, messaging and errorhandling.
 */
@Injectable({ providedIn: 'root' })
export class MembersService {
  constructor(
    @Inject(E2E_TESTING) private isTesting: boolean,
    private membersDataProvider: MembersDataProvider,
    private logger: NGXLogger,
    private toastr: ToastrService,
  ) {
    this.logger.trace(`${MembersService.name}: starting MembersService`);
  }

  /* common toastr message */
  private toastrMessage = 'A server access error has occurred';

  /**
   * Gets members from the server.
   * @param
   * - term: Returns only those members that start with 'term'.
   * @returns
   * - An observable with an array of the members returned from the server.
   * - 404 is received from the server if there are no members in the stored team or if there are no members matching the supplied term.  In this case an empty array is returned.
   * @throws
   * - Throws an observable with an error if any response other than a successful response, or a Not Found/404, is received from the server.
   */
  getMembers(term?: string): Observable<IMember[]> {
    this.logger.trace(`${MembersService.name}: getMembers called`);

    /* e2e error test - only if e2e test and match to a specific term */
    if (this.isTesting && term === errorSearchTerm) {
      this.logger.trace(
        `${MembersService.name}: e2e testing - throwing an error`,
      );
      throw new Error('Test application error');
    }

    if (typeof term === 'string' && term.trim() === '') {
      this.logger.trace(
        `${MembersService.name}: Search term exists but is blank - returning empty members array`,
      );
      return of([]);
    }

    return this.membersDataProvider.getMembers(term).pipe(
      tap((members) => {
        if (members.length > 0) {
          if (term) {
            this.logger.trace(
              `${MembersService.name}: Found members matching "${term}"`,
            );
          } else {
            this.logger.trace(`${MembersService.name}: Fetched all members`);
          }
        } else if (term) {
          this.logger.trace(
            `${MembersService.name}: Did not find any members matching "${term}"`,
          );
        } else {
          this.logger.trace(
            `${MembersService.name}: There are no members to fetch`,
          );
        }
      }),
      catchError((err: IErrReport) => {
        this.logger.trace(`${MembersService.name}: catchError called`);

        /* inform user and mark as handled */
        this.toastr.error('ERROR!', this.toastrMessage);
        err.isHandled = true;

        this.logger.trace(`${MembersService.name}: Throwing the error on`);
        return throwError(err);
      }),
    );
  }

  /**
   * Gets member by id.
   * @param
   * - id: Returns the member with that id.
   * @returns
   * - An observable containing a member object.
   * @throws
   * - Throws an observable with an error if any response other than a successful response is received from the server.
   */
  getMember(id: number): Observable<IMember> {
    this.logger.trace(`${MembersService.name}: getMember called`);

    return this.membersDataProvider.getMember(id).pipe(
      tap((member) => {
        this.logger.trace(
          `${MembersService.name}: Fetched member ${JSON.stringify(member)}`,
        );
      }),

      catchError((errReport: IErrReport) => {
        this.logger.trace(`${MembersService.name}: catchError called`);

        /* inform user */
        if (
          errReport.error &&
          errReport.error.status === StatusCodes.NOT_FOUND
        ) {
          /* 404: member did not exist */
          this.toastr.error(`ERROR: Did not find member with id = ${id}`);
        } else {
          /* otherwise a general fail */
          this.toastr.error('ERROR!', this.toastrMessage);
        }
        /* mark as handled */
        errReport.isHandled = true;

        this.logger.trace(`${MembersService.name}: Throwing the error on`);
        return throwError(errReport);
      }),
    );
  }

  /**
   * Add a new member to the team.
   * @param
   * - member: Member to be added (without an id field).
   * @returns
   * - An observable containing the added member.
   * @throws
   * - Throws an observable with an error if any response other than a successful response is received from the server.
   */
  addMember(member: IMemberWithoutId): Observable<IMember> {
    this.logger.trace(`${MembersService.name}: addMember called`);

    return this.membersDataProvider.addMember(member).pipe(
      tap((newMember: IMember) => {
        this.logger.trace(
          `${MembersService.name}: Added member with id = ${newMember.id}`,
        );
      }),

      catchError((err: IErrReport) => {
        this.logger.trace(`${MembersService.name}: catchError called`);

        /* inform user and mark as handled */
        this.toastr.error('ERROR!', this.toastrMessage);
        err.isHandled = true;

        this.logger.trace(`${MembersService.name}: Throwing the error on`);
        return throwError(err);
      }),
    );
  }

  /**
   * Delete a member from the team.
   * @param
   * - memberOrId: A member object, or the id of the member to be deleted.
   * @returns
   * - An observable containing the count of the members deleted (i.e. 1).
   * @throws
   * - Throws an observable with an error if any response other than a successful response is received from the server.
   */
  deleteMember(memberOrId: IMember | number): Observable<ICount> {
    this.logger.trace(`${MembersService.name}: deleteMember called`);

    const id = typeof memberOrId === 'number' ? memberOrId : memberOrId.id;

    return this.membersDataProvider.deleteMember(id).pipe(
      tap((_) => {
        this.logger.trace(
          `${MembersService.name}: Deleted member with id = ${id}`,
        );
      }),

      catchError((errReport: IErrReport) => {
        this.logger.trace(`${MembersService.name}: catchError called`);

        /* inform user */
        if (
          errReport.error &&
          errReport.error.status === StatusCodes.NOT_FOUND
        ) {
          /* 404: member did not exist */
          this.toastr.error(`ERROR: Did not find member with id = ${id}`);
        } else {
          /* otherwise a general fail */
          this.toastr.error('ERROR!', this.toastrMessage);
        }
        /* mark as handled */
        errReport.isHandled = true;

        this.logger.trace(`${MembersService.name}: Throwing the error on`);
        return throwError(errReport);
      }),
    );
  }

  /**
   * Update a member on the server.
   * @param
   * - memberOrId: A member object.
   * @returns
   * - An observable containing the updated member.
   * @throws
   * - Throws an observable with an error if any response other than a successful response is received from the server.
   */
  updateMember(member: IMember): Observable<IMember> {
    this.logger.trace(`${MembersService.name}: updateMember called`);

    return this.membersDataProvider.updateMember(member).pipe(
      tap((_) => {
        this.logger.trace(
          `{MembersService.name}: Updated member with id = ${member.id}`,
        );
      }),

      catchError((errReport: IErrReport) => {
        this.logger.trace(`${MembersService.name}: catchError called`);

        /* inform user */
        if (
          errReport.error &&
          errReport.error.status === StatusCodes.NOT_FOUND
        ) {
          /* 404: member did not exist */
        } else {
          /* otherwise a general fail */
          this.toastr.error('ERROR!', this.toastrMessage);
        }
        /* mark as handled */
        errReport.isHandled = true;

        this.logger.trace(`${MembersService.name}: Throwing the error on`);
        return throwError(errReport);
      }),
    );
  }
}
