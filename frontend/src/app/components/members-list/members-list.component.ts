import { Component, OnInit, ErrorHandler } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { IsLoadingService } from '@service-work/is-loading';

import { Observable, of, Subject, zip } from 'rxjs';
import { ActivatedRoute, Data } from '@angular/router';
import {
  catchError,
  map,
  publishReplay,
  refCount,
  switchMap,
  takeUntil,
} from 'rxjs/operators';
import {
  IMember,
  IMemberWithoutId,
} from '../../data-providers/members.data-provider';
import { MembersService } from '../../shared/members-service/members.service';
import { SessionsService } from '../../shared/sessions-service/sessions.service';
import { QuestionairesService } from '../../shared/questionaires-service/questionares.service';
import { routes } from '../../config';
import { ISession } from '../../data-providers/sessions.data-provider';
import { IQuestionaire } from '../../data-providers/models/questionaire';

/**
 * This component displays a list of members.
 * - A delete button is provided on each member to allow that member be deleted.
 * - An input box is provided to allow a user enter a member name to cause a new member to be added to the server.
 */
@Component({
  selector: 'app-members',
  templateUrl: './members-list.component.html',
  styleUrls: ['./members-list.component.scss'],
})
export class MembersListComponent implements OnInit {
  /* observable of array of members returned from search */
  members$!: Observable<IMember[]>;

  /* mode for input box */
  inputMode = 'add';

  /* route paths */
  routes = routes;

  constructor(
    private route: ActivatedRoute,
    private membersService: MembersService,
    private sessionsService: SessionsService,
    private questionairesService: QuestionairesService,
    private logger: NGXLogger,
    private errorHandler: ErrorHandler,
    private isLoadingService: IsLoadingService,
  ) {
    this.logger.trace(
      `${MembersListComponent.name}: Starting MembersListComponent`,
    );
  }

  ngOnInit() {
    /* get the data as supplied from the route resolver */
    this.route.data.subscribe((data: Data) => {
      this.members$ = of(data.members);
    });
  }

  /* getMembers called after add() and delete() to reload from server */
  getMembers() {
    this.logger.trace(`${MembersListComponent.name}: Calling getMembers`);

    let errorHandlerCalled = false;
    const dummyMembers: IMember[] = [];

    /* create a subject to multicast to elements on html page */
    return this.membersService.getMembers().pipe(
      publishReplay(1),
      refCount(),
      catchError((error: any) => {
        if (!errorHandlerCalled) {
          this.logger.trace(`${MembersListComponent.name}: catchError called`);
          errorHandlerCalled = true;
          this.errorHandler.handleError(error);
        }
        /* return dummy member */
        return of(dummyMembers);
      }),
    );
  }

  add(name: string) {
    this.logger.trace(`${MembersListComponent.name}: Calling addMember`);

    /* ignore if the input text is empty */
    if (!name) {
      return;
    }
    /* trim the input text */
    name = name.trim();
    /* add the new member */
    const member: IMemberWithoutId = { name };

    /* set an isLoadingService indicator (that loads a progress bar) and clears it when the returned observable emits. */
    this.isLoadingService.add(
      this.membersService.addMember(member).subscribe((_addedMember) => {
        /* retrieve members list from server */
        this.members$ = this.getMembers();
        return this.members$;
        /* allow errors go to errorHandler */
        /* httpclient observable => unsubscribe not necessary */
      }),
    );
  }

  delete(member: IMember): void {
    this.logger.trace(`${MembersListComponent.name}: Calling deleteMember`);

    const message = confirm(
      // eslint-disable-next-line max-len
      '\nCAUTION: Confirm you wish to delete this member\n\nNOTE: You must first delete all sessions and questionaires associated with the member',
    );

    const stopSignal$ = new Subject();

    if (message) {
      /* set an isLoadingService indicator (that loads a progress bar) and clears it when the returned observable emits. */
      const sessions$: Observable<ISession[]> =
        this.sessionsService.getSessions(member.id);
      const questionaires$: Observable<IQuestionaire[]> =
        this.questionairesService.getQuestionaires(member.id);
      this.isLoadingService.add(
        zip(sessions$, questionaires$)
          .pipe(
            map(([sessions, questionaires]) => {
              console.log('sessions: ' + sessions);
              console.log('questionaires: ' + questionaires);
              if (sessions.length > 0 || questionaires.length > 0) {
                stopSignal$.next();
                confirm(
                  '\nYou must first delete all sessions and questionaires associated with the member first\n\nMember not deleted',
                );
              }
              return of({});
            }),
            takeUntil(stopSignal$),
            switchMap(() => this.membersService.deleteMember(member.id)),
          )
          .subscribe((_count) => {
            this.members$ = this.getMembers();
            /* allow errors go to errorHandler */
            /* httpclient observable => unsubscribe not necessary */
          }),
      );
    }
  }

  trackByFn(_index: number, member: IMember): number | null {
    if (!member) {
      return null;
    }
    return member.id;
  }
}
