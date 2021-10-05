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
import { Sessions2Service } from '../sessions2-service/sessions2.service';
import {
  dummySessions2,
  IMember,
  ISessions2AndMember,
} from '../../data-providers/models/models';

@Injectable({
  providedIn: 'root',
})
export class MemberSessions2ResolverService implements Resolve<any> {
  constructor(
    private membersService: MembersService,
    private sessions2Service: Sessions2Service,
    private logger: NGXLogger,
    private errorHandler: ErrorHandler,
  ) {
    this.logger.trace(
      `${MemberSessions2ResolverService.name}: Starting MemberSessions2ResolverService`,
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
  ): Observable<ISessions2AndMember> {
    this.logger.trace(
      `${MemberSessions2ResolverService.name}: Calling resolve`,
    );

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
        const sessions2$ = this.sessions2Service.getOrCreateSessions(
          memberId,
          this.#getLastSunday(),
        );
        const output: Observable<ISessions2AndMember> = of({
          member$: member$,
          sessions2$: sessions2$,
        });
        return output;
      }),
      publishReplay(1),
      refCount(),

      catchError((error: any) => {
        if (!errorHandlerCalled) {
          this.logger.trace(
            `${MemberSessions2ResolverService.name}: catchError called`,
          );
          errorHandlerCalled = true;
          this.errorHandler.handleError(error);
        }
        const dummyOutput: Observable<ISessions2AndMember> = of({
          member$: of(dummyMember),
          sessions2$: of(dummySessions2),
        });
        return dummyOutput;
      }),
    );
  }
}
