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
import { IActivity } from '../models/activity-models';

@Injectable({
  providedIn: 'root',
})
export class ActivityLogResolverService implements Resolve<IActivity[]> {
  constructor(
    private activitiesService: ActivitiesService,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      `${ActivityLogResolverService.name}: Starting ActivityLogResolverService`,
    );
  }

  resolve(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<IActivity[]> {
    this.logger.trace(`${ActivityLogResolverService.name}: Calling resolve`);

    /* get id of member from the route */
    const memberId = +(route.paramMap.get('id') || '0');

    return this.activitiesService.getActivities(memberId).pipe(
      shareReplay(1),
      catchError((err: any) => {
        this.logger.trace(
          `${ActivityLogResolverService.name}: catchError called`,
        );
        this.logger.trace(
          `${ActivityLogResolverService.name}: not proceeding and throwing the error to the error handler`,
        );
        throw err;
      }),
    );
  }
}
