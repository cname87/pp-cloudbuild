import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Data, ParamMap } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { Observable, of, Subject } from 'rxjs';

import { IMember } from '../../data-providers/members.data-provider';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { UserIdStateService } from '../../services/user-id-state-service/user-id-state.service';
import { AuthService } from '../../services/auth-service/auth.service';
import { ScoresService } from '../../../scores-module/services/scores.service';
import { SessionsService } from '../../../sessions-module/services/sessions.service';
import { SummaryService } from '../../../summary-module/services/summary.service';
import { ActivitiesService } from '../../../activities-module/services/activities.service';

/**
 * @title This member shows detail on a member whose id is passed in via the url id parameter.
 * It also loads all lazy loaded modules after startup and makes calls to other data to preload the cache to speed up subsequent pages loads.
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
  #memberId = 0;
  /* used to unsubscribe */
  #destroy$ = new Subject<void>();

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private summary: SummaryService,
    private scores: ScoresService,
    private sessions: SessionsService,
    private activities: ActivitiesService,
    private logger: NGXLogger,
    private userIdStateService: UserIdStateService,
  ) {
    this.logger.trace(
      `${MemberDetailComponent.name}: Starting MemberDetailComponent`,
    );
  }

  /* define the text info card */
  line1 = '- Click on SCORES to enter your weekly Wellness Questionaire';
  line2 = '- Click on SESSIONS to enter your weekly training sessions';
  line3 =
    '- Click on SUMMARY to see your training data over the last 12 months';
  line4 = `- Click on ACTIVITIES to enter miscellaneous training activities`;
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
    this.logger.trace(`${MemberDetailComponent.name}: Starting ngOnInit`);

    /* get the data as supplied from the route resolver */
    this.route.data
      .pipe(takeUntil(this.#destroy$), catchError(this.#catchError))
      .subscribe((data: Data) => {
        this.member$ = of(data.member);
      });

    /* get member id from route state */
    this.route.paramMap
      .pipe(
        map((paramMap: ParamMap) => {
          const id = paramMap.get('id');
          if (!id) {
            throw new Error('id path parameter was null');
          }
          this.#memberId = +id;
          return id;
        }),
        takeUntil(this.#destroy$),
        catchError(this.#catchError),
      )
      .subscribe((id) => this.userIdStateService.updateIdState(id));
  }

  ngAfterViewInit(): void {
    /* load all lazy loaded modules to shorten their eventual load times */
    import('../../../scores-module/components/scores.component');
    import('../../../sessions-module/components/sessions-parent.component');
    import('../../../summary-module/components/summary.component');
    import('../../../activities-module/components/activities-parent.component');
    /* calls to load caches */
    this.scores.getOrCreateScores(this.#memberId).subscribe(() => {
      this.logger.trace(
        `${MemberDetailComponent.name}: getOrCreateScores called to load cache`,
      );
    });
    this.sessions.getOrCreateSessions(this.#memberId).subscribe(() => {
      this.logger.trace(
        `${MemberDetailComponent.name}: getOrCreateSessions called to load cache`,
      );
    });
    this.summary.getSummaryData(this.#memberId).subscribe(() => {
      this.logger.trace(
        `${MemberDetailComponent.name}: getSummaryData called to load cache`,
      );
    });
    this.activities.getActivities(this.#memberId).subscribe(() => {
      this.logger.trace(
        `${MemberDetailComponent.name}: getActivities called to load cache`,
      );
    });
  }

  ngOnDestroy(): void {
    this.logger.trace(
      `${MemberDetailComponent.name}: Starting ngOnDestroy called`,
    );
    this.#destroy$.next();
    this.#destroy$.complete();
  }
}
