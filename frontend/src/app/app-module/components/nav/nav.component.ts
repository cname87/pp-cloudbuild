import { Component, OnInit } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

import { AuthService } from '../../services/auth-service/auth.service';

import { routes, roles } from '../../../configuration/configuration';
import { combineLatest, of } from 'rxjs';
import { RouteStateService } from '../../services/route-state-service/router-state.service';

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
  #scores = routes.scores;
  #sessions = routes.sessions;
  #summary = routes.summary;
  links!: ILink[];

  constructor(
    private logger: NGXLogger,
    private auth: AuthService,
    private routeStateService: RouteStateService,
  ) {
    this.logger.trace(`${NavComponent.name}: Starting ${NavComponent.name}`);
  }

  ngOnInit() {
    combineLatest([
      this.routeStateService.id$,
      this.auth.userProfile$ || of({ roles: [''] }),
    ]).subscribe(([id, user]) => {
      const disabled = id === '' ? true : false;
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
