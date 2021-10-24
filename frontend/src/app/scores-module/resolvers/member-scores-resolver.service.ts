import { ErrorHandler, Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';

import { ScoresService } from '../../scores-module/services/scores.service';
import { dummyScores, IScores } from '../data-providers/scores-models';

@Injectable({
  providedIn: 'root',
})
export class MemberScoresResolverService implements Resolve<IScores> {
  constructor(
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
  ): Observable<IScores> {
    this.logger.trace(`${MemberScoresResolverService.name}: Calling resolve`);

    /* get id of member from the route */
    const memberId = +(route.paramMap.get('id') || '0');

    let errorHandlerCalled = false;

    return this.scoresService
      .getOrCreateScores(memberId, this.#getLastSunday())
      .pipe(
        shareReplay(1),
        catchError((error: any) => {
          if (!errorHandlerCalled) {
            this.logger.trace(
              `${MemberScoresResolverService.name}: catchError called`,
            );
            errorHandlerCalled = true;
            this.errorHandler.handleError(error);
          }
          return of(dummyScores);
        }),
      );
  }
}
