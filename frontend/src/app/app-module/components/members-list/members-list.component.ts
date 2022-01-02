import { Component, OnDestroy, OnInit } from '@angular/core';
import { NGXLogger } from 'ngx-logger';
import { IsLoadingService } from '@service-work/is-loading';

import { Observable, of, Subject } from 'rxjs';
import { ActivatedRoute, Data, ParamMap } from '@angular/router';
import { catchError, map, shareReplay, takeUntil } from 'rxjs/operators';
import {
  IMember,
  IMemberWithoutId,
} from '../../data-providers/members.data-provider';
import { MembersService } from '../../services/members-service/members.service';
import { routes } from '../../../configuration/configuration';
import { UserIdStateService } from '../../services/user-id-state-service/user-id-state.service';

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
export class MembersListComponent implements OnInit, OnDestroy {
  /* observable of array of members returned from search */
  members$!: Observable<IMember[]>;
  /* mode for input box */
  inputMode = 'add';
  /* route paths */
  routes = routes;
  /* used to unsubscribe */
  #destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private membersService: MembersService,
    private userIdStateService: UserIdStateService,
    private logger: NGXLogger,
    private isLoadingService: IsLoadingService,
  ) {
    this.logger.trace(
      `${MembersListComponent.name}: Starting MembersListComponent`,
    );
  }

  /**
   * Picks up any upstream errors and throws on the error.
   * @param err An error object
   * @throws Throws the received error object
   */
  #catchError = (err: any): never => {
    this.logger.trace(`${MembersListComponent.name}: #catchError called`);
    this.logger.trace(`${MembersListComponent.name}: Throwing the error on`);
    throw err;
  };

  ngOnInit() {
    /* get the data as supplied from the route resolver */
    this.route.data
      .pipe(takeUntil(this.#destroy$), catchError(this.#catchError))
      .subscribe((data: Data) => {
        this.members$ = of(data.members);
      });
    this.route.paramMap
      .pipe(
        map((paramMap: ParamMap) => {
          const id = paramMap.get('id');
          return id;
        }),
        takeUntil(this.#destroy$),
        catchError(this.#catchError),
      )
      .subscribe((id) => this.userIdStateService.updateIdState(id));
  }

  /* getMembers called after add() and delete() to reload from server */
  getMembers() {
    this.logger.trace(`${MembersListComponent.name}: Calling getMembers`);

    return this.membersService
      .getMembers()
      .pipe(
        shareReplay(1),
        takeUntil(this.#destroy$),
        catchError(this.#catchError),
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
      this.membersService
        .addMember(member)
        .pipe(takeUntil(this.#destroy$), catchError(this.#catchError))
        .subscribe((_addedMember) => {
          /* retrieve members list from server */
          this.members$ = this.getMembers();
          return this.members$;
        }),
    );
  }

  delete(member: IMember): void {
    this.logger.trace(`${MembersListComponent.name}: Calling deleteMember`);

    const message = confirm(
      // eslint-disable-next-line max-len
      '\nCAUTION: Confirm you wish to delete this member\n\n',
    );

    if (message) {
      /* set an isLoadingService indicator (that loads a progress bar) and clears it when the returned observable emits. */
      this.isLoadingService.add(
        this.membersService
          .deleteMember(member.id)
          .pipe(takeUntil(this.#destroy$), catchError(this.#catchError))
          .subscribe((_count) => {
            this.members$ = this.getMembers();
            return this.members$;
          }),
      );
    }
  }

  ngOnDestroy(): void {
    this.logger.trace(`${MembersListComponent.name}: #ngDestroy called`);
    this.#destroy$.next();
    this.#destroy$.complete();
  }

  trackByFn(_index: number, member: IMember): number | null {
    if (!member) {
      return null;
    }
    return member.id;
  }
}
