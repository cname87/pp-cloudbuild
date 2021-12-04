import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';

import { ActivitiesService } from '../services/activities.service';
import { ISession } from '../models/activity-models';

@Injectable({
  providedIn: 'root',
})
export class ActivitiesResolverService implements Resolve<any> {
  constructor(
    private activitiesService: ActivitiesService,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      `${ActivitiesResolverService.name}: Starting ActivitiesResolverService`,
    );
  }

  resolve(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<ISession[]> {
    this.logger.trace(`${ActivitiesResolverService.name}: Calling resolve`);

    /* get id of member from the route */
    const memberId = +(route.paramMap.get('id') || '0');

    return this.activitiesService.getSessions(memberId).pipe(
      shareReplay(1),
      catchError((err: any) => {
        this.logger.trace(
          `${ActivitiesResolverService.name}: catchError called`,
        );
        this.logger.trace(
          `${ActivitiesResolverService.name}: not proceeding and throwing the error to the error handler`,
        );
        throw err;
      }),
    );
  }
}
