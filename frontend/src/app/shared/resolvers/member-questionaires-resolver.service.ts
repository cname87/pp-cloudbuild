import { Injectable, ErrorHandler } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import {
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { Observable, of } from 'rxjs';
import { publishReplay, refCount, catchError, switchMap } from 'rxjs/operators';

import { MembersService } from '../members-service/members.service';
import { QuestionairesService } from '../questionaires-service/questionares.service';
import {
  IMember,
  IQuestionaire,
  IQuestionairesTable,
} from '../../data-providers/models/models';

@Injectable({
  providedIn: 'root',
})
export class MemberQuestionairesResolverService implements Resolve<any> {
  constructor(
    private membersService: MembersService,
    private questionairesService: QuestionairesService,
    private logger: NGXLogger,
    private errorHandler: ErrorHandler,
  ) {
    this.logger.trace(
      `${MemberQuestionairesResolverService.name}: Starting MemberQuestionairesResolverService`,
    );
  }

  resolve(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<IQuestionairesTable> {
    this.logger.trace(
      `${MemberQuestionairesResolverService.name}: Calling resolve`,
    );

    /* get id of member from the route */
    const memberId = +(route.paramMap.get('id') || '0');

    let errorHandlerCalled = false;
    const dummyMember: IMember = {
      id: memberId,
      name: 'ERROR',
    };
    const dummyQuestionaire: IQuestionaire = {
      id: 0,
      date: new Date().toISOString(),
      sleep: 0,
      fatigue: 0,
      muscle: 0,
      stress: 0,
      motivation: 0,
      health: 0,
      diet: 0,
      mood: 0,
      comment: '',
      memberId: memberId,
    };

    return of(memberId).pipe(
      switchMap((id: number) => {
        const member$ = this.membersService.getMember(id);
        const questionaires$ = this.questionairesService.getQuestionaires(id);
        const output: Observable<IQuestionairesTable> = of({
          member: member$,
          questionaires: questionaires$,
        });
        return output;
      }),
      publishReplay(1),
      refCount(),

      catchError((error: any) => {
        if (!errorHandlerCalled) {
          this.logger.trace(
            `${MemberQuestionairesResolverService.name}: catchError called`,
          );
          errorHandlerCalled = true;
          this.errorHandler.handleError(error);
        }
        const dummyOutput: Observable<IQuestionairesTable> = of({
          member: of(dummyMember),
          questionaires: of([dummyQuestionaire]),
        });
        return dummyOutput;
      }),
    );
  }
}
