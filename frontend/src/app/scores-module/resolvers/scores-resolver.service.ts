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
import { UtilsService } from '../../app-module/services/utils-service/utils.service';
import { IScores } from '../models/scores-models';

@Injectable({
  providedIn: 'root',
})
export class MemberScoresResolverService implements Resolve<IScores | unknown> {
  constructor(
    private scoresService: ScoresService,
    private utils: UtilsService,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      `${MemberScoresResolverService.name}: Starting MemberScoresResolverService`,
    );
  }

  resolve(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<IScores | unknown> {
    this.logger.trace(`${MemberScoresResolverService.name}: Calling resolve`);

    /* get id of member from the route */
    const memberId = +(route.paramMap.get('id') || '0');

    return this.scoresService
      .getOrCreateScores(memberId, this.utils.getLastSunday())
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
