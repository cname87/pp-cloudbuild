import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Data, ParamMap } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { Observable, of, Subject } from 'rxjs';

import { IMember } from '../../data-providers/members.data-provider';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { RouteStateService } from '../../services/route-state-service/router-state.service';
import { AuthService } from '../../services/auth-service/auth.service';

/**
 * @title This member shows detail on a member whose id is passed in via the url id parameter.
 */
@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.scss'],
})
export class MemberDetailComponent implements OnInit, AfterViewInit, OnDestroy {
  //
  /* member to display */
  member$!: Observable<IMember>;
  /* used to unsubscribe */
  #destroy$ = new Subject<void>();

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private logger: NGXLogger,
    private routeStateService: RouteStateService,
  ) {
    this.logger.trace(
      `${MemberDetailComponent.name}: Starting MemberDetailComponent`,
    );
  }

  /* define the text info card */
  line1 = '- Click on SCORES to enter your weekly assessment scores';
  line2 = '- Click on SESSIONS to enter your weekly training sessions';
  line3 = '- Click on SUMMARY to see your data over the last 12 months';
  line4 = '';
  isGoBackVisible = false;

  /**
   * Picks up any upstream errors and throws on the error.
   * @param err An error object
   * @throws Throws the received error object
   */
  #catchError = (err: any): never => {
    this.logger.trace(`${MemberDetailComponent.name}: #catchError called`);
    this.logger.trace(`${MemberDetailComponent.name}: Throwing the error on`);
    throw err;
  };

  ngOnInit() {
    /* get the data as supplied from the route resolver */
    this.route.data
      .pipe(takeUntil(this.#destroy$), catchError(this.#catchError))
      .subscribe((data: Data) => {
        this.member$ = of(data.member);
      });

    /* update route state with member id */
    this.route.paramMap
      .pipe(
        map((paramMap: ParamMap) => {
          const id = paramMap.get('id');
          if (!id) {
            throw new Error('id path parameter was null');
          }
          return id;
        }),
        takeUntil(this.#destroy$),
        catchError(this.#catchError),
      )
      .subscribe((id) => this.routeStateService.updateIdState(id));
  }

  ngOnDestroy(): void {
    this.logger.trace(`${MemberDetailComponent.name}: #ngDestroy called`);
    this.#destroy$.next();
    this.#destroy$.complete();
    this.routeStateService.updateIdState('');
  }

  ngAfterViewInit(): void {
    /* load all lazy loaded modules to shorten their eventual load times */
    import('../../../scores-module/components/member-scores.component');
    import('../../../sessions-module/components/member-sessions.component');
    import('../../../summary-module/components/member-summary.component');
  }

  get userProfile$() {
    return this.auth.userProfile$;
  }
}
