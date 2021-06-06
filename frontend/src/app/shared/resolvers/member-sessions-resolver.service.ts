import { Injectable, ErrorHandler } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { publishReplay, refCount, catchError, switchMap } from 'rxjs/operators';

import { MembersService } from '../members-service/members.service';
import { SessionsService } from '../sessions-service/sessions.service';
import {
  IMember,
  ISession,
  ISessionsTable,
  SessionType,
} from '../../data-providers/models/models';

@Injectable({
  providedIn: 'root',
})
export class MemberSessionsResolverService implements Resolve<any> {
  constructor(
    private membersService: MembersService,
    private sessionsService: SessionsService,
    private logger: NGXLogger,
    private errorHandler: ErrorHandler,
  ) {
    this.logger.trace(
      `${MemberSessionsResolverService.name}: Starting MemberSessionsResolverService`,
    );
  }

  resolve(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<ISessionsTable> {
    this.logger.trace(`${MemberSessionsResolverService.name}: Calling resolve`);

    /* get id of member from the route */
    const memberId = +(route.paramMap.get('id') || '0');

    let errorHandlerCalled = false;
    const dummyMember: IMember = {
      id: memberId,
      name: 'ERROR',
    };
    const dummySession: ISession = {
      id: memberId,
      memberId: 0,
      date: '',
      type: SessionType.Conditioning,
      score: 0,
      duration: 0,
      metric: 0,
      comment: 'ERROR',
    };

    return of(memberId).pipe(
      switchMap((id: number) => {
        const member$ = this.membersService.getMember(id);
        const sessions$ = this.sessionsService.getSessions(id);
        const output: Observable<ISessionsTable> = of({
          member: member$,
          sessions: sessions$,
        });
        return output;
      }),
      publishReplay(1),
      refCount(),

      catchError((error: any) => {
        if (!errorHandlerCalled) {
          this.logger.trace(
            `${MemberSessionsResolverService.name}: catchError called`,
          );
          errorHandlerCalled = true;
          this.errorHandler.handleError(error);
        }
        const dummyOutput: Observable<ISessionsTable> = of({
          member: of(dummyMember),
          sessions: of([dummySession]),
        });
        return dummyOutput;
      }),
    );
  }
}
