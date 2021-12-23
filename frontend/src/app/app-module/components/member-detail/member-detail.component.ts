import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Data, ParamMap } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { Observable, of, Subject } from 'rxjs';

import { IMember } from '../../data-providers/members.data-provider';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { RouteStateService } from '../../services/route-state-service/router-state.service';
import { AuthService } from '../../services/auth-service/auth.service';
import { ScoresService } from '../../../scores-module/services/scores.service';
import { SessionsService } from '../../../sessions-module/services/sessions.service';
import { SummaryService } from '../../../summary-module/services/summary.service';

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
  /* member id from url path */
  #id = 0;
  /* used to unsubscribe */
  #destroy$ = new Subject<void>();

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private summary: SummaryService,
    private scores: ScoresService,
    private sessions: SessionsService,
    private logger: NGXLogger,
    private routeStateService: RouteStateService,
  ) {
    this.logger.trace(
      `${MemberDetailComponent.name}: Starting MemberDetailComponent`,
    );
  }

  /* define the text info card */
  line1 = `- Click on ACTIVITIES to enter miscellaneous training activities`;
  line2 = '- Click on SCORES to enter your weekly self-assessment scores';
  line3 = '- Click on SESSIONS to enter your weekly training sessions';
  line4 =
    '- Click on SUMMARY to see your training data over the last 12 months';
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

  get userProfile$() {
    return this.auth.userProfile$;
  }

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
          this.#id = +id;
          return id;
        }),
        takeUntil(this.#destroy$),
        catchError(this.#catchError),
      )
      .subscribe((id) => this.routeStateService.updateIdState(id));
  }

  ngAfterViewInit(): void {
    /* load all lazy loaded modules to shorten their eventual load times */
    import('../../../scores-module/components/scores.component');
    import('../../../sessions-module/components/sessions.component');
    import('../../../summary-module/components/summary.component');
    /* calls to load caches */
    this.scores.getOrCreateScores(this.#id).subscribe(() => {
      this.logger.trace(
        `${MemberDetailComponent.name}: GetOrCreateScores called to load cache`,
      );
    });
    this.sessions.getOrCreateSessions(this.#id).subscribe(() => {
      this.logger.trace(
        `${MemberDetailComponent.name}: GetOrCreateSessions called to load cache`,
      );
    });
    this.summary.getSummaryData(this.#id).subscribe(() => {
      this.logger.trace(
        `${MemberDetailComponent.name}: GetSummary called to load cache`,
      );
    });
  }

  ngOnDestroy(): void {
    this.logger.trace(`${MemberDetailComponent.name}: #ngDestroy called`);
    this.#destroy$.next();
    this.#destroy$.complete();
    this.routeStateService.updateIdState('');
  }
}
