import { Injectable } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable } from 'rxjs';
import { catchError, shareReplay } from 'rxjs/operators';

import { SummaryService } from '../services/summary.service';
import { ISummary } from '../models/summary-models';

@Injectable({
  providedIn: 'root',
})
export class MemberSummaryResolverService
  implements Resolve<ISummary | unknown>
{
  constructor(
    private summaryService: SummaryService,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      `${MemberSummaryResolverService.name}: Starting MemberSummaryResolverService`,
    );
  }

  resolve(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<ISummary | unknown> {
    this.logger.trace(`${MemberSummaryResolverService.name}: Calling resolve`);

    /* get id of member from the route */
    const memberId = +(route.paramMap.get('id') || '0');

    /* passing this date returns all objects */
    const earliestDate = new Date(2020, 1, 1);

    return this.summaryService.getSummaryData(memberId, earliestDate).pipe(
      shareReplay(1),
      catchError((err: any) => {
        this.logger.trace(
          `${MemberSummaryResolverService.name}: catchError called`,
        );
        this.logger.trace(
          `${MemberSummaryResolverService.name}: not proceeding and throwing the error to the error handler`,
        );
        throw err;
      }),
    );
  }
}
