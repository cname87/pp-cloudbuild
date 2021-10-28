import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';

import { ScoresService } from '../services/scores.service';
import { IScores } from '../data-providers/scores-models';

@Injectable({
  providedIn: 'root',
})
export class MemberScoresResolverService implements Resolve<IScores | unknown> {
  constructor(private scoresService: ScoresService, private logger: NGXLogger) {
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
  ): Observable<IScores | unknown> {
    this.logger.trace(`${MemberScoresResolverService.name}: Calling resolve`);

    /* get id of member from the route */
    const memberId = +(route.paramMap.get('id') || '0');

    return this.scoresService
      .getOrCreateScores(memberId, this.#getLastSunday())
      .pipe(
        shareReplay(1),
        catchError((err: any) => {
          this.logger.trace(
            `${MemberScoresResolverService.name}: catchError called`,
          );
          this.logger.trace(
            `${MemberScoresResolverService.name}: not proceeding and throwing the error to the error handler`,
          );
          throw err;
        }),
      );
  }
}
