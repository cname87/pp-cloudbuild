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
import { TSummary } from '../models/summary-models';

@Injectable({
  providedIn: 'root',
})
export class MemberSummaryResolverService
  implements Resolve<TSummary | unknown>
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
  ): Observable<TSummary> {
    this.logger.trace(`${MemberSummaryResolverService.name}: Calling resolve`);

    /* get id of member from the route */
    const memberId = +(route.paramMap.get('id') || '0');

    return this.summaryService.getSummaryData(memberId).pipe(
      shareReplay(1),
      catchError((err: any) => {
        this.logger.trace(
          `${MemberSummaryResolverService.name}: catchError called`,
        );
        this.logger.trace(
          `${MemberSummaryResolverService.name}: Not proceeding and throwing the error to the error handler`,
        );
        throw err;
      }),
    );
  }
}
