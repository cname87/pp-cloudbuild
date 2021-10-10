import { Component, OnInit, ErrorHandler } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { IsLoadingService } from '@service-work/is-loading';

import { Observable, of, Subject } from 'rxjs';
import { ActivatedRoute, Data } from '@angular/router';
import { catchError, publishReplay, refCount, takeUntil } from 'rxjs/operators';
import {
  IMember,
  IMemberWithoutId,
} from '../../../common/data-providers/members.data-provider';
import { MembersService } from '../../../common/services/members-service/members.service';
import { routes } from '../../../common/configuration';

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
      '\nCAUTION: Confirm you wish to delete this member\n\n',
    );

    const stopSignal$ = new Subject();
    console.log(`Message: ${message}`);
    if (message) {
      /* set an isLoadingService indicator (that loads a progress bar) and clears it when the returned observable emits. */
      this.isLoadingService.add(
        this.membersService
          .deleteMember(member.id)
          .pipe(takeUntil(stopSignal$))
          .subscribe((_count) => {
            this.members$ = this.getMembers();
            /* allow errors go to errorHandler */
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
