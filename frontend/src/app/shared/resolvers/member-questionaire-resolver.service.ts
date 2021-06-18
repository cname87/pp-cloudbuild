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
  IQuestionaireChange,
  IQuestionaireWithoutId,
  QUESTIONAIRE_MODE,
} from '../../data-providers/models/models';

@Injectable({
  providedIn: 'root',
})
export class MemberQuestionaireResolverService
  implements Resolve<IQuestionaireChange>
{
  constructor(
    private membersService: MembersService,
    private questionairesService: QuestionairesService,
    private logger: NGXLogger,
    private errorHandler: ErrorHandler,
  ) {
    this.logger.trace(
      `${MemberQuestionaireResolverService.name}: Starting MemberQuestionaireResolverService`,
    );
  }

  resolve(
    route: ActivatedRouteSnapshot,
    _state: RouterStateSnapshot,
  ): Observable<IQuestionaireChange> {
    this.logger.trace(
      `${MemberQuestionaireResolverService.name}: Calling resolve`,
    );

    /* get id of member and questionaire from the route */
    const memberId = +(route.paramMap.get('id') || '0');
    const questionaireId = +(route.paramMap.get('qid') || '0');

    let errorHandlerCalled = false;
    const dummyMember: IMember = {
      id: memberId,
      name: 'ERROR',
    };
    const blankQuestionaireWoId: any = {
      memberId: memberId,
      date: new Date().toISOString(),
      sleep: '',
      fatigue: '',
      muscle: '',
      stress: '',
      motivation: '',
      health: '',
      mood: '',
      comment: '',
    };

    return of({}).pipe(
      switchMap(() => {
        console.log('questionireId: ' + questionaireId);
        const mode = questionaireId
          ? QUESTIONAIRE_MODE.EDIT
          : QUESTIONAIRE_MODE.ADD;
        const member$ = this.membersService.getMember(memberId);
        const questionaire$ = questionaireId
          ? this.questionairesService.getQuestionaire(questionaireId)
          : of(blankQuestionaireWoId);

        const output: Observable<IQuestionaireChange> = of({
          mode: mode,
          member$: member$,
          questionaire$: questionaire$,
        });
        return output;
      }),
      publishReplay(1),
      refCount(),

      catchError((error: any) => {
        if (!errorHandlerCalled) {
          this.logger.trace(
            `${MemberQuestionaireResolverService.name}: catchError called`,
          );
          errorHandlerCalled = true;
          this.errorHandler.handleError(error);
        }
        blankQuestionaireWoId.comment = 'ERROR';
        const dummyOutput: Observable<IQuestionaireChange> = of({
          mode: QUESTIONAIRE_MODE.ADD,
          member$: of(dummyMember),
          questionaire$: of(
            blankQuestionaireWoId,
          ) as Observable<IQuestionaireWithoutId>,
        });
        return dummyOutput;
      }),
    );
  }
}
