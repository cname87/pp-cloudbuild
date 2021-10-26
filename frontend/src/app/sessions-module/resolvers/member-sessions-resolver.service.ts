import { Injectable, ErrorHandler } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, switchMap, shareReplay } from 'rxjs/operators';

import { MembersService } from '../../app-module/services/members-service/members.service';
import { SessionsService } from '../services/sessions.service';
import { IMember } from '../../app-module/models/models';
import {
  dummySessions,
  ISessionsAndMember,
} from '../data-providers/sessions-models';

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

  /**
   * @returns Returns the Sunday that is equal or prior to today. The date returned is in Date format.
   */
  #getLastSunday(): Date {
    let dateTemp = new Date();
    /* get last Sunday */
    dateTemp.setDate(dateTemp.getDate() - dateTemp.getDay());
    /* remove hours, minutes and seconds */
    dateTemp = new Date(dateTemp.toDateString());
    /* move stored UTC value by local time offset to prevent the wrong day being stored */
    dateTemp = new Date(
      dateTemp.getTime() - dateTemp.getTimezoneOffset() * 60 * 1000,
    );
    return dateTemp;
  }

  resolve(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<ISessionsAndMember> {
    this.logger.trace(`${MemberSessionsResolverService.name}: Calling resolve`);

    /* get id of member from the route */
    const memberIdString = route.paramMap.get('id');
    const memberId = +(memberIdString || '0');

    let errorHandlerCalled = false;
    const dummyMember: IMember = {
      id: memberId,
      name: 'ERROR',
    };

    return of(memberId).pipe(
      switchMap((id: number) => {
        const member$ = this.membersService.getMember(id);
        const sessions$ = this.sessionsService.getOrCreateSessions(
          memberId,
          this.#getLastSunday(),
        );
        const output: Observable<ISessionsAndMember> = of({
          member$: member$,
          sessions$: sessions$,
        });
        return output;
      }),
      shareReplay(1),
      catchError((error: any) => {
        if (!errorHandlerCalled) {
          this.logger.trace(
            `${MemberSessionsResolverService.name}: catchError called`,
          );
          errorHandlerCalled = true;
          this.errorHandler.handleError(error);
        }
        const dummyOutput: Observable<ISessionsAndMember> = of({
          member$: of(dummyMember),
          sessions$: of(dummySessions),
        });
        return dummyOutput;
      }),
    );
  }
}
