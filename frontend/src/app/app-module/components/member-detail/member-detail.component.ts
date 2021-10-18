import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Data, ParamMap } from '@angular/router';
import { NGXLogger } from 'ngx-logger';
import { of, Observable, Subject, throwError } from 'rxjs';
import { IsLoadingService } from '@service-work/is-loading';

import { MembersService } from '../../services/members-service/members.service';
import { IMember } from '../../data-providers/members.data-provider';
import { catchError, map, takeUntil } from 'rxjs/operators';
import { RouteStateService } from '../../services/route-state-service/router-state.service';
import { IErrReport } from '../../../configuration/configuration';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth-service/auth.service';

/**
 * @title This member shows detail on a member whose id is passed in via the url id parameter.
 */
@Component({
  selector: 'app-member-detail',
  templateUrl: './member-detail.component.html',
  styleUrls: ['./member-detail.component.scss'],
})
export class MemberDetailComponent implements OnInit, OnDestroy {
  //
  private destroy = new Subject<void>();
  private toastrMessage = 'A member access error has occurred';

  /* member to display */
  member$!: Observable<IMember>;

  /* mode for input box */
  inputMode = 'edit';

  constructor(
    private auth: AuthService,
    private route: ActivatedRoute,
    private membersService: MembersService,
    private logger: NGXLogger,
    private isLoadingService: IsLoadingService,
    private routeStateService: RouteStateService,
    private toastr: ToastrService,
  ) {
    this.logger.trace(
      `${MemberDetailComponent.name}: Starting MemberDetailComponent`,
    );
  }

  ngOnInit() {
    /* get the data as supplied from the route resolver */
    this.route.data.subscribe((data: Data) => {
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
        takeUntil(this.destroy),
        catchError((err: IErrReport) => {
          this.logger.trace(`${MemberDetailComponent.name}: catchError called`);

          /* inform user and mark as handled */
          this.toastr.error('ERROR!', this.toastrMessage);
          err.isHandled = true;

          this.logger.trace(
            `${MemberDetailComponent.name}: Throwing the error on`,
          );
          return throwError(err);
        }),
      )
      .subscribe((id) => this.routeStateService.updateIdState(id));
  }

  ngOnDestroy() {
    this.destroy.next();
    this.destroy.complete();
    this.routeStateService.updateIdState('');
  }

  get userProfile$() {
    return this.auth.userProfile$;
  }

  /**
   * Updates the name property of the member previously retrieved.
   * Called by the input box when the user updates the input string and presses Enter (or clicks on the the Save icon).
   * Note: member$ completes when page displayed => cannot get from id from member$ so got from page instead.
   * @param name
   * name: The input box string is supplied as the name parameter.
   * id: The displayed member id is supplied as the member id.
   */
  save(name: string, id: string): void {
    /* ignore if the input text is empty */
    if (!name) {
      return;
    }
    /* set an isLoadingService indicator (that loads a progress bar) and clears it when the returned observable emits. */
    this.isLoadingService.add(
      this.membersService
        .updateMember({ id: +id, name })
        .subscribe((member) => {
          this.member$ = of(member);
          this.logger.trace(`${MemberDetailComponent.name}: Member updated`);
        }),
    );
  }
}
