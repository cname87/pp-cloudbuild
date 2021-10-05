import { Injectable, ErrorHandler } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { publishReplay, refCount, catchError, switchMap } from 'rxjs/operators';

import { MembersService } from '../../common/services/members-service/members.service';
import { ScoresService } from '../../scores-module/services/scores.service';
import { IMember } from '../../common/models/models';
import { dummyScores, IScoresAndMember } from '../data-providers/scores-models';

@Injectable({
  providedIn: 'root',
})
export class MemberScoresResolverService implements Resolve<any> {
  constructor(
    private membersService: MembersService,
    private scoresService: ScoresService,
    private logger: NGXLogger,
    private errorHandler: ErrorHandler,
  ) {
    this.logger.trace(
      `${MemberScoresResolverService.name}: Starting MemberScoresResolverService`,
    );
  }

  /**
   * @returns Returns the Sunday that is equal or prior to today. The date is returned is in Date format.
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
  ): Observable<IScoresAndMember> {
    this.logger.trace(`${MemberScoresResolverService.name}: Calling resolve`);

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
        const scores$ = this.scoresService.getOrCreateScores(
          memberId,
          this.#getLastSunday(),
        );
        const output: Observable<IScoresAndMember> = of({
          member$: member$,
          scores$: scores$,
        });
        return output;
      }),
      publishReplay(1),
      refCount(),

      catchError((error: any) => {
        if (!errorHandlerCalled) {
          this.logger.trace(
            `${MemberScoresResolverService.name}: catchError called`,
          );
          errorHandlerCalled = true;
          this.errorHandler.handleError(error);
        }
        const dummyOutput: Observable<IScoresAndMember> = of({
          member$: of(dummyMember),
          scores$: of(dummyScores),
        });
        return dummyOutput;
      }),
    );
  }
}
