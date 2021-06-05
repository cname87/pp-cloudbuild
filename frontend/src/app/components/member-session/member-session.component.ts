import { Component } from '@angular/core';
import { ActivatedRoute, Data, ParamMap } from '@angular/router';
import { Location } from '@angular/common';
import { NGXLogger } from 'ngx-logger';
import { of, Subject, throwError } from 'rxjs';
import { AbstractControl, FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { IsLoadingService } from '@service-work/is-loading';

import { SessionsService } from '../../shared/sessions-service/sessions.service';
import {
  ISessionWithoutId,
  ISession,
  SessionTypeNames,
  ISessionChange,
  MODE,
} from '../../data-providers/models/models';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { IErrReport } from '../../config';
import { MembersService } from '../../shared/members-service/members.service';
import { MemberDetailComponent } from '../member-detail/member-detail.component';
import { ToastrService } from 'ngx-toastr';
import { RouteStateService } from '../../shared/route-state-service/router-state-service';

interface routeData extends Data {
  memberAndSession: ISessionChange;
}

/**
 * @title This component shows a form allowing detail on a training session to be entered.
 */
@Component({
  selector: 'app-session',
  templateUrl: './member-session.component.html',
  styleUrls: ['./member-session.component.scss'],
  providers: [],
})
export class MemberSessionComponent {
  change: ISessionChange = {
    mode: MODE.ADD,
    member$: of({}) as any,
    session$: of({}) as any,
  };
  //
  private destroy = new Subject<void>();
  private toastrMessage = 'A member access error has occurred';
  addLabel = 'ADD SESSION';
  updateLabel = 'UPDATE SESSION';
  /* default button label */
  buttonLabel = 'ADD SESSION';

  /* form definition */
  form = new FormGroup({});
  model!: ISession | ISessionWithoutId;
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[] = [
    {
      /* Customizing Datepicker is complex - see https://material.angular.io/components/datepicker/overview#setting-the-locale-code */
      key: 'date',
      type: 'datepicker',
      templateOptions: {
        type: 'datepicker',
        label: 'Enter the date of the session',
      },
      validators: {
        date: {
          expression: (
            _control: AbstractControl,
            field: FormlyFieldConfig,
          ): boolean => !!field.formControl?.value,
          message: (_control: AbstractControl, _field: FormlyFieldConfig) => {
            return `You must select a date`;
          },
        },
      },
    },
    {
      key: 'type',
      type: 'select',
      templateOptions: {
        type: 'select',
        label: 'Select the type of the session from the dropdown',
        options: SessionTypeNames.map((value) => {
          return {
            value: value,
            label: value,
          };
        }),
      },
      validators: {
        type: {
          expression: (
            _control: AbstractControl,
            field: FormlyFieldConfig,
          ): boolean => !!field.formControl?.value,
          message: (_control: AbstractControl, _field: FormlyFieldConfig) => {
            return `You must select a session type`;
          },
        },
      },
    },
    {
      key: 'score',
      type: 'input',
      templateOptions: {
        type: 'number',
        label: 'Select a score from 1 to 10',
      },
      validators: {
        score: {
          expression: (
            _control: AbstractControl,
            field: FormlyFieldConfig,
          ): boolean => {
            const number = isNaN(Number(field.formControl?.value))
              ? 0
              : Number(field.formControl?.value);
            return number > 0 && number <= 10;
          },
          message: (_control: AbstractControl, _field: FormlyFieldConfig) => {
            return `You must select a score from 1 to 10`;
          },
        },
      },
    },
    {
      key: 'duration',
      type: 'input',
      templateOptions: {
        type: 'number',
        label: 'Enter the session duration in minutes',
      },
      validators: {
        duration: {
          expression: (
            _control: AbstractControl,
            field: FormlyFieldConfig,
          ): boolean => {
            const number = isNaN(Number(field.formControl?.value))
              ? 0
              : Number(field.formControl?.value);
            return number > 0 && number <= 120;
          },
          message: (_control: AbstractControl, _field: FormlyFieldConfig) => {
            return `You must enter a duration from 1 to 120 minutes`;
          },
        },
      },
    },
    {
      key: 'metric',
      type: 'input',
      templateOptions: {
        type: 'number',
        label: 'This is the calculated score x duration',
        readonly: true,
        disabled: true,
      },
      expressionProperties: {
        'model.metric': (model: ISession | ISessionWithoutId): number => {
          return isNaN(Number(model.score) * Number(model.duration))
            ? 0
            : Number(model.score) * Number(model.duration);
        },
      },
    },
    {
      key: 'comment',
      type: 'textarea',
      templateOptions: {
        type: 'textarea',
        label: 'Enter comments here',
        rows: 5,
      },
    },
  ];

  constructor(
    private route: ActivatedRoute,
    private sessionsService: SessionsService,
    private location: Location,
    private isLoadingService: IsLoadingService,
    private logger: NGXLogger,
    private routeStateService: RouteStateService,
    private toastr: ToastrService,
  ) {
    this.logger.trace(
      `${MemberSessionComponent.name}: Starting MemberSessionComponent`,
    );
  }

  ngOnInit() {
    /* get the data as supplied from the route resolver */
    this.route.data
      .pipe(
        switchMap((data: Data) => {
          const routeData = data as routeData;
          this.change = {
            mode: routeData.memberAndSession.mode,
            member$: routeData.memberAndSession.member$,
            session$: routeData.memberAndSession.session$,
          };
          this.buttonLabel =
            this.change.mode === MODE.ADD ? this.addLabel : this.updateLabel;
          return this.change.session$;
        }),
        takeUntil(this.destroy),
      )
      .subscribe((session) => {
        this.model = session;
      });
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

          this.logger.trace(`${MembersService.name}: Throwing the error on`);
          return throwError(err);
        }),
      )
      .subscribe((id) => this.routeStateService.updateIdState(id));
  }

  onSubmit(): void {
    /* disable to avoid multiple submissions */
    this.form.disable();

    /* Set an isLoadingService indicator (that loads a progress bar) and clears it when the returned observable emits. */
    this.isLoadingService.add(
      of(this.change.mode)
        .pipe(
          switchMap((mode) => {
            return mode === MODE.ADD
              ? this.sessionsService.addSession(this.model)
              : this.sessionsService.updateSession(this.model as ISession);
          }),
          takeUntil(this.destroy),
        )
        .subscribe((session) => {
          const verb = this.change.mode === MODE.ADD ? 'added' : 'updated';
          this.logger.trace(
            `${MemberSessionComponent.name}: Session ${verb}: ${JSON.stringify(
              session,
            )}`,
          );
          /* clear the form */
          if (this.options.resetModel) {
            this.options.resetModel();
          }
          /* renable the form */
          this.form.enable();
          /* allow errors go to errorHandler */

          if (this.change.mode === MODE.EDIT) {
            this.goBack();
          }
        }),
    );
  }

  ngOnDestroy(): void {
    this.destroy.next();
    this.destroy.complete();
    this.routeStateService.updateIdState('');
  }

  goBack(): void {
    this.location.back();
  }

  delete(): void {
    /* Set an isLoadingService indicator (that loads a progress bar) and clears it when the returned observable emits. */
    this.isLoadingService.add(
      of({})
        .pipe(
          switchMap(() => {
            return this.sessionsService.deleteSession(this.model as ISession);
          }),
          takeUntil(this.destroy),
        )
        .subscribe((count) => {
          this.logger.trace(
            `${MemberSessionComponent.name}: ${JSON.stringify(
              count,
            )} session deleted: ${JSON.stringify(this.model)}`,
          );
          this.goBack();
        }),
    );
  }
}
