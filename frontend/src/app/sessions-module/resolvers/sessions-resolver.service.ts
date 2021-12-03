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
import { UtilsService } from '../../app-module/services/utils-service/utils.service';
import { ISessions } from '../models/sessions-models';

@Injectable({
  providedIn: 'root',
})
export class MemberSessionsResolverService implements Resolve<any> {
  constructor(
    private sessionsService: SessionsService,
    private utils: UtilsService,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      `${MemberSessionsResolverService.name}: Starting MemberSessionsResolverService`,
    );
  }

  resolve(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<ISessions> {
    this.logger.trace(`${MemberSessionsResolverService.name}: Calling resolve`);

    /* get id of member from the route */
    const memberId = +(route.paramMap.get('id') || '0');

    return this.sessionsService
      .getOrCreateSessions(memberId, this.utils.getLastSunday())
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
