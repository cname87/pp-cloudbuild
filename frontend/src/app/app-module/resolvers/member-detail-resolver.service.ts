import { Injectable, ErrorHandler } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';

import { MembersService } from '../services/members-service/members.service';
import { IMember } from '../models/models';

@Injectable({
  providedIn: 'root',
})
export class MemberDetailResolverService implements Resolve<IMember> {
  constructor(
    private membersService: MembersService,
    private logger: NGXLogger,
    private errorHandler: ErrorHandler,
  ) {
    this.logger.trace(
      `${MemberDetailResolverService.name}: Starting MemberDetailResolverService`,
    );
  }

  resolve(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<IMember> {
    this.logger.trace(
      `${MemberDetailResolverService.name}: Calling MemberDetailResolver`,
    );

    /* get id of member to be displayed from the route */
    const memberId = +(route.paramMap.get('id') || '0');

    let errorHandlerCalled = false;
    const dummyMember = {
      id: 0,
      name: '',
    };

    return this.membersService.getMember(memberId).pipe(
      shareReplay(1),
      catchError((error: any) => {
        if (!errorHandlerCalled) {
          this.logger.trace(
            `${MemberDetailResolverService.name}: catchError called`,
          );
          errorHandlerCalled = true;
          this.errorHandler.handleError(error);
        }
        return of(dummyMember);
      }),
    );
  }
}
