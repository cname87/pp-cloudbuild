import { Injectable, ErrorHandler } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { publishReplay, refCount, catchError, switchMap } from 'rxjs/operators';

import { MembersService } from '../../app-module/services/members-service/members.service';
import { SessionsService } from '../services/activities.service';
import {
  IMember,
  ISessionChange,
  ISessionWithoutId,
  SESSION_MODE,
} from '../models/activity-models';

@Injectable({
  providedIn: 'root',
})
export class ActivityResolver implements Resolve<ISessionChange> {
  constructor(
    private membersService: MembersService,
    private sessionsService: SessionsService,
    private logger: NGXLogger,
    private errorHandler: ErrorHandler,
  ) {
    this.logger.trace(`${ActivityResolver.name}: Starting ActivityResolver`);
  }

  resolve(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<ISessionChange> {
    this.logger.trace(`${ActivityResolver.name}: Calling resolve`);

    /* get id of member and session from the route */
    const memberId = +(route.paramMap.get('id') || '0');
    const sessionId = +(route.paramMap.get('sid') || '0');

    let errorHandlerCalled = false;
    const dummyMember: IMember = {
      id: memberId,
      name: 'ERROR',
    };
    const blankSessionWoId: any = {
      memberId: memberId,
      date: new Date().toISOString(),
      type: '',
      score: '',
      duration: '',
      metric: 0,
      comment: '',
    };

    return of({}).pipe(
      switchMap(() => {
        const mode = sessionId ? SESSION_MODE.EDIT : SESSION_MODE.ADD;
        const member$ = this.membersService.getMember(memberId);
        const session$ = sessionId
          ? this.sessionsService.getSession(sessionId)
          : of(blankSessionWoId);

        const output: Observable<ISessionChange> = of({
          mode: mode,
          member$: member$,
          session$: session$,
        });
        return output;
      }),
      publishReplay(1),
      refCount(),

      catchError((error: any) => {
        if (!errorHandlerCalled) {
          this.logger.trace(`${ActivityResolver.name}: catchError called`);
          errorHandlerCalled = true;
          this.errorHandler.handleError(error);
        }
        blankSessionWoId.comment = 'ERROR';
        const dummyOutput: Observable<ISessionChange> = of({
          mode: SESSION_MODE.ADD,
          member$: of(dummyMember),
          session$: of(blankSessionWoId) as Observable<ISessionWithoutId>,
        });
        return dummyOutput;
      }),
    );
  }
}
