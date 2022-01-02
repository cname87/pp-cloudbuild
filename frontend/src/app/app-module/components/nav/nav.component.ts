import { Component, OnInit } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

import { AuthService } from '../../services/auth-service/auth.service';

import { routes, roles } from '../../../configuration/configuration';
import { combineLatest, of } from 'rxjs';
import { UserIdStateService } from '../../services/user-id-state-service/user-id-state.service';

interface ILink {
  path: string;
  display: string;
  disabled: boolean;
  hidden: any;
}

/**
 * @title This component displays a navigation tabbed element.
 */
@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent implements OnInit {
  #membersList = routes.membersList;
  #detail = routes.member;
  #activities = routes.activities;
  #scores = routes.scores;
  #sessions = routes.sessions;
  #summary = routes.summary;
  links!: ILink[];

  constructor(
    private logger: NGXLogger,
    private auth: AuthService,
    private userIdStateService: UserIdStateService,
  ) {
    this.logger.trace(`${NavComponent.name}: Starting ${NavComponent.name}`);
  }

  ngOnInit() {
    combineLatest([
      this.userIdStateService.id$,
      this.auth.userProfile$ || of({ roles: [''] }),
    ]).subscribe(([id, user]) => {
      /* The userIdStateService is used to set the id parameter for the routes(i.e.based on the active user), and also to disable the user routes in routes which have no id parameter, e.g.the member list component. */
      const disabled = !id ? true : false;
      this.links = [
        {
          path: `/${this.#membersList.path}`,
          display: this.#membersList.displayName,
          disabled: !user?.roles.includes(roles.admin),
          hidden: !user?.roles.includes(roles.admin),
        },
        {
          path: `/${this.#detail.path}/${id}`,
          display: this.#detail.displayName,
          disabled: disabled,
          hidden: false,
        },
        {
          path: `/${this.#scores.path}/${id}`,
          display: this.#scores.displayName,
          disabled: disabled,
          hidden: false,
        },
        {
          path: `/${this.#sessions.path}/${id}`,
          display: this.#sessions.displayName,
          disabled: disabled,
          hidden: false,
        },
        {
          path: `/${this.#summary.path}/${id}`,
          display: this.#summary.displayName,
          disabled: disabled,
          hidden: false,
        },
        {
          path: `/${this.#activities.path}/${id}`,
          display: this.#activities.displayName,
          disabled: disabled,
          hidden: false,
        },
      ];
    });
  }

  get isLoggedIn() {
    return this.auth.isLoggedIn;
  }

  trackByFn(_index: number, link: ILink): string | null {
    return link ? link.path : null;
  }
}
