import { Component } from '@angular/core';
import { NGXLogger } from 'ngx-logger';

import { AuthService } from '../../shared/auth-service/auth.service';

import { routes } from '../../config';
import { Observable } from 'rxjs';
import { RouteStateService } from '../../shared/route-state-service/router-state-service';

interface ILink {
  path: string;
  display: string;
  disabled: boolean;
}

/**
 * @title This component displays a navigation tabbed element.
 */
@Component({
  selector: 'app-nav',
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.scss'],
})
export class NavComponent {
  private membersList = routes.membersList;
  private detail = routes.detail;
  private session = routes.session;
  private sessions = routes.sessions;
  private id$: Observable<string>;
  links!: ILink[];

  constructor(
    private logger: NGXLogger,
    private auth: AuthService,
    private routeStateService: RouteStateService,
  ) {
    this.logger.trace(`${NavComponent.name}: Starting ${NavComponent.name}`);
    this.id$ = this.routeStateService.id$;
  }

  ngOnInit() {
    this.id$.subscribe((id) => {
      const disabled = id === '' ? true : false;
      this.links = [
        {
          path: `/${this.membersList.path}`,
          display: this.membersList.displayName,
          disabled: false,
        },
        {
          path: `/${this.detail.path}/${id}`,
          display: this.detail.displayName,
          disabled: disabled,
        },
        {
          path: `/${this.session.path1}/${id}/${this.session.path2}`,
          display: this.session.displayName,
          disabled: disabled,
        },
        {
          path: `/${this.sessions.path}/${id}`,
          display: this.sessions.displayName,
          disabled: disabled,
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
