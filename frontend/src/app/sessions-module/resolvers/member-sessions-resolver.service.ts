import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';

import { SessionsService } from '../services/sessions.service';
import { ISessions } from '../models/sessions-models';

@Injectable({
  providedIn: 'root',
})
export class MemberSessionsResolverService implements Resolve<any> {
  constructor(
    private sessionsService: SessionsService,
    private logger: NGXLogger,
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
  ): Observable<ISessions> {
    this.logger.trace(`${MemberSessionsResolverService.name}: Calling resolve`);

    /* get id of member from the route */
    const memberId = +(route.paramMap.get('id') || '0');

    return this.sessionsService
      .getOrCreateSessions(memberId, this.#getLastSunday())
      .pipe(
        shareReplay(1),
        catchError((err: any) => {
          this.logger.trace(
            `${MemberSessionsResolverService.name}: catchError called`,
          );
          this.logger.trace(
            `${MemberSessionsResolverService.name}: not proceeding and throwing the error to the error handler`,
          );
          throw err;
        }),
      );
  }
}
