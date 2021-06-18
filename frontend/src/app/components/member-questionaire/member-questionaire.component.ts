import { Component } from '@angular/core';
import { ActivatedRoute, Data, ParamMap } from '@angular/router';
import { Location } from '@angular/common';
import { NGXLogger } from 'ngx-logger';
import { of, Subject, throwError } from 'rxjs';
import { AbstractControl, FormGroup } from '@angular/forms';
import { FormlyFieldConfig, FormlyFormOptions } from '@ngx-formly/core';
import { IsLoadingService } from '@service-work/is-loading';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';
import { ToastrService } from 'ngx-toastr';

import { QuestionairesService } from '../../shared/questionaires-service/questionares.service';
import {
  IQuestionaireWithoutId,
  IQuestionaire,
  IQuestionaireChange,
  QUESTIONAIRE_MODE,
} from '../../data-providers/models/models';
import { IErrReport } from '../../config';
import { RouteStateService } from '../../shared/route-state-service/router-state-service';
import { Score } from './score-field';

interface routeData extends Data {
  memberAndQuestionaire: IQuestionaireChange;
}

/**
 * @title This component shows a questionaire form, allowing answers on questions regarding a member's health to be entered.
 */
@Component({
  selector: 'app-questionaire',
  templateUrl: './member-questionaire.component.html',
  styleUrls: ['./member-questionaire.component.scss'],
  providers: [],
})
export class MemberQuestionaireComponent {
  change: IQuestionaireChange = {
    mode: QUESTIONAIRE_MODE.ADD,
    member$: of({}) as any,
    questionaire$: of({}) as any,
  };
  //
  private destroy = new Subject<void>();
  private toastrMessage = 'A member access error has occurred';
  addLabel = 'ADD QUESTIONAIRE';
  updateLabel = 'UPDATE QUESTIONAIRE';
  /* default button label */
  buttonLabel = 'ADD QUESTIONAIRE';

  /* form definition */
  form = new FormGroup({});
  model!: IQuestionaire | IQuestionaireWithoutId;
  options: FormlyFormOptions = {};
  fields: FormlyFieldConfig[] = [
    {
      /* Customizing Datepicker is complex - see https://material.angular.io/components/datepicker/overview#setting-the-locale-code */
      key: 'date',
      type: 'datepicker',
      templateOptions: {
        type: 'datepicker',
        label: 'Enter date questionaire was taken',
      },
      validators: {
        date: {
          expression: (
            _control: AbstractControl,
            field: FormlyFieldConfig,
          ): boolean => {
            return !!field.formControl?.value;
          },
          message: (_control: AbstractControl, _field: FormlyFieldConfig) => {
            return `You must select a date`;
          },
        },
      },
    },
    new Score('QUALITY OF SLEEP', 'sleep', 5).field,
    new Score('FATIGUE', 'fatigue', 5).field,
    new Score('MUSCLE SORENESS', 'muscle', 5).field,
    new Score('STRESS', 'stress', 5).field,
    new Score('MOTIVATION', 'motivation', 5).field,
    new Score('HEALTH', 'health', 5).field,
    new Score('MOOD', 'mood', 5).field,
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
    private questionairesService: QuestionairesService,
    private location: Location,
    private isLoadingService: IsLoadingService,
    private logger: NGXLogger,
    private routeStateService: RouteStateService,
    private toastr: ToastrService,
  ) {
    this.logger.trace(
      `${MemberQuestionaireComponent.name}: Starting MemberQuestionaireComponent`,
    );
  }

  ngOnInit() {
    /* get the data as supplied from the route resolver */
    this.route.data
      .pipe(
        switchMap((data: Data) => {
          const routeData = data as routeData;
          this.change = {
            mode: routeData.memberAndQuestionaire.mode,
            member$: routeData.memberAndQuestionaire.member$,
            questionaire$: routeData.memberAndQuestionaire.questionaire$,
          };
          this.buttonLabel =
            this.change.mode === QUESTIONAIRE_MODE.ADD
              ? this.addLabel
              : this.updateLabel;
          return this.change.questionaire$;
        }),
        takeUntil(this.destroy),
      )
      .subscribe((questionaire) => {
        this.model = questionaire;
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
          this.logger.trace(
            `${MemberQuestionaireComponent.name}: catchError called`,
          );

          /* inform user and mark as handled */
          this.toastr.error('ERROR!', this.toastrMessage);
          err.isHandled = true;

          this.logger.trace(
            `${MemberQuestionaireComponent.name}: Throwing the error on`,
          );
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
            return mode === QUESTIONAIRE_MODE.ADD
              ? this.questionairesService.addQuestionaire(this.model)
              : this.questionairesService.updateQuestionaire(
                  this.model as IQuestionaire,
                );
          }),
          takeUntil(this.destroy),
        )
        .subscribe((questionaire) => {
          const verb =
            this.change.mode === QUESTIONAIRE_MODE.ADD ? 'added' : 'updated';
          this.logger.trace(
            `${
              MemberQuestionaireComponent.name
            }: Questionaire ${verb}: ${JSON.stringify(questionaire)}`,
          );
          /* clear the form */
          if (this.options.resetModel) {
            this.options.resetModel();
          }
          /* renable the form */
          this.form.enable();
          /* allow errors go to errorHandler */

          if (this.change.mode === QUESTIONAIRE_MODE.EDIT) {
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
            return this.questionairesService.deleteQuestionaire(
              this.model as IQuestionaire,
            );
          }),
          takeUntil(this.destroy),
        )
        .subscribe((count) => {
          this.logger.trace(
            `${MemberQuestionaireComponent.name}: ${JSON.stringify(
              count,
            )} questionaire deleted: ${JSON.stringify(this.model)}`,
          );
          this.goBack();
        }),
    );
  }
}
