import { Injectable, Inject } from '@angular/core';
import { Observable, throwError, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';
import { StatusCodes } from 'http-status-codes';
import { ToastrService } from 'ngx-toastr';

import { QuestionairesDataProvider } from '../../data-providers/questionaires.data-provider';
import {
  ICount,
  IQuestionaire,
  IQuestionaireWithoutId,
} from '../../data-providers/models/models';
import { IErrReport, errorSearchTerm, E2E_TESTING } from '../config';

/**
 * This service provides functions to call all the functions that call the backend according to the defined api providing appropriate responses, messaging and errorhandling.
 */
@Injectable({ providedIn: 'root' })
export class QuestionairesService {
  constructor(
    @Inject(E2E_TESTING) private isTesting: boolean,
    private questionairesDataProvider: QuestionairesDataProvider,
    private logger: NGXLogger,
    private toastr: ToastrService,
  ) {
    this.logger.trace(
      `${QuestionairesService.name}: starting QuestionairesService`,
    );
  }

  /* common toastr message */
  private toastrMessage = 'A server access error has occurred';

  /**
   * Gets all questionaires from all user members from the server.
   * @param matchString: Returns only those questionaires whose 'type' start with that string.
   * @returns
   * - An observable with an array of the questionaires returned from the server.
   * - 404 is received from the server if there are no questionaires in the stored team or if there are no questionaires matching the supplied term.  In this case an empty array is returned.
   * @throws
   * - Throws an observable with an error if any response other than a successful response, or a Not Found/404, is received from the server.
   */
  getAllQuestionaires(matchString?: string): Observable<IQuestionaire[]> {
    this.logger.trace(
      `${QuestionairesService.name}: getAllQuestionaires called`,
    );

    /* e2e error test - only if e2e test and match to a specific term */
    if (this.isTesting && matchString === errorSearchTerm) {
      this.logger.trace(
        `${QuestionairesService.name}: e2e testing - throwing an error`,
      );
      throw new Error('Test application error');
    }

    if (typeof matchString === 'string' && matchString.trim() === '') {
      this.logger.trace(
        `${QuestionairesService.name}: Search term exists but is blank - returning empty questionaires array`,
      );
      return of([]);
    }

    return this.questionairesDataProvider.getAllQuestionaires(matchString).pipe(
      tap((questionaires) => {
        if (questionaires.length > 0) {
          if (matchString) {
            this.logger.trace(
              `${QuestionairesService.name}: Found questionaires matching "${matchString}"`,
            );
          } else {
            this.logger.trace(
              `${QuestionairesService.name}: Fetched all questionaires`,
            );
          }
        } else if (matchString) {
          this.logger.trace(
            `${QuestionairesService.name}: Did not find any questionaires matching "${matchString}"`,
          );
        } else {
          this.logger.trace(
            `${QuestionairesService.name}: There are no questionaires to fetch`,
          );
        }
      }),
      catchError((err: IErrReport) => {
        this.logger.trace(`${QuestionairesService.name}: catchError called`);

        /* inform user and mark as handled */
        this.toastr.error('ERROR!', this.toastrMessage);
        err.isHandled = true;

        this.logger.trace(
          `${QuestionairesService.name}: Throwing the error on`,
        );
        return throwError(err);
      }),
    );
  }

  /**
   * Gets questionaires from the server tied to a particular user team member.
   * @param memberId: The member whose questionaires will be returned.
   * @param matchString: Returns only those questionaires whose 'type' start with that string.
   * @returns
   * - An observable with an array of the questionaires returned from the server.
   * - 404 is received from the server if there are no questionaires in the stored team or if there are no questionaires matching the supplied term.  In this case an empty array is returned.
   * @throws
   * - Throws an observable with an error if any response other than a successful response, or a Not Found/404, is received from the server.
   */
  getQuestionaires(
    memberId: number,
    matchString?: string,
  ): Observable<IQuestionaire[]> {
    this.logger.trace(`${QuestionairesService.name}: getQuestionaires called`);

    /* e2e error test - only if e2e test and match to a specific term */
    if (this.isTesting && matchString === errorSearchTerm) {
      this.logger.trace(
        `${QuestionairesService.name}: e2e testing - throwing an error`,
      );
      throw new Error('Test application error');
    }

    if (typeof matchString === 'string' && matchString.trim() === '') {
      this.logger.trace(
        `${QuestionairesService.name}: Search term exists but is blank - returning empty questionaires array`,
      );
      return of([]);
    }

    return this.questionairesDataProvider
      .getQuestionaires(memberId, matchString)
      .pipe(
        tap((questionaires) => {
          if (questionaires.length > 0) {
            if (matchString) {
              this.logger.trace(
                `${QuestionairesService.name}: Found questionaires matching "${matchString}"`,
              );
            } else {
              this.logger.trace(
                `${QuestionairesService.name}: Fetched all questionaires`,
              );
            }
          } else if (matchString) {
            this.logger.trace(
              `${QuestionairesService.name}: Did not find any questionaires matching "${matchString}"`,
            );
          } else {
            this.logger.trace(
              `${QuestionairesService.name}: There are no questionaires to fetch`,
            );
          }
        }),
        catchError((err: IErrReport) => {
          this.logger.trace(`${QuestionairesService.name}: catchError called`);

          /* inform user and mark as handled */
          this.toastr.error('ERROR!', this.toastrMessage);
          err.isHandled = true;

          this.logger.trace(
            `${QuestionairesService.name}: Throwing the error on`,
          );
          return throwError(err);
        }),
      );
  }

  /**
   * Gets a particular questionaire.
   * @param questionaireOrId: The id of the questionaire that will be returned.
   * @returns An observable containing a questionaire object.
   * @throws: Throws an observable with an error if any response other than a successful response is received from the server.
   */
  getQuestionaire(QuestionaireId: number): Observable<IQuestionaire> {
    this.logger.trace(`${QuestionairesService.name}: getQuestionaire called`);

    return this.questionairesDataProvider.getQuestionaire(QuestionaireId).pipe(
      tap((_) => {
        this.logger.trace(
          `${QuestionairesService.name}: Fetched questionaire with id = ${QuestionaireId}`,
        );
      }),

      catchError((errReport: IErrReport) => {
        this.logger.trace(`${QuestionairesService.name}: catchError called`);

        /* inform user */
        if (
          errReport.error &&
          errReport.error.status === StatusCodes.NOT_FOUND
        ) {
          /* 404: questionaire did not exist */
          this.logger.trace(
            `${QuestionairesService.name}: ERROR: Did not find questionaire with id = ${QuestionaireId}`,
          );
        } else {
          /* otherwise a general fail */
          this.toastr.error('ERROR!', this.toastrMessage);
        }
        /* mark as handled */
        errReport.isHandled = true;

        this.logger.trace(
          `${QuestionairesService.name}: Throwing the error on`,
        );
        return throwError(errReport);
      }),
    );
  }

  /**
   * Adds a new questionaire to the member record.
   * @param: questionaire: Questionaire object to be added (without an id field).
   * @returns:An observable containing the added questionaire.
   * @throws: Throws an observable with an error if any response other than a successful response is received from the server.
   */
  addQuestionaire(
    questionaire: IQuestionaireWithoutId,
  ): Observable<IQuestionaire> {
    this.logger.trace(`${QuestionairesService.name}: addQuestionaire called`);

    return this.questionairesDataProvider.addQuestionaire(questionaire).pipe(
      tap((newQuestionaire: IQuestionaire) => {
        this.logger.trace(
          `${QuestionairesService.name}: Added questionaire with id = ${newQuestionaire.id}`,
        );
      }),

      catchError((err: IErrReport) => {
        this.logger.trace(`${QuestionairesService.name}: catchError called`);

        /* inform user and mark as handled */
        this.toastr.error('ERROR!', this.toastrMessage);
        err.isHandled = true;

        this.logger.trace(
          `${QuestionairesService.name}: Throwing the error on`,
        );
        return throwError(err);
      }),
    );
  }

  /**
   * Deletes a particular questionaire.
   * @param questionaireOrId: The id of the questionaire, or the questionaire object, that will be deleted.
   * @returns An observable containing a questionaire object.
   * @throws: Throws an observable with an error if any response other than a successful response is received from the server.
   */
  deleteQuestionaire(
    questionaireOrId: IQuestionaire | number,
  ): Observable<ICount> {
    this.logger.trace(
      `${QuestionairesService.name}: deleteQuestionaire called`,
    );

    const questionaireId =
      typeof questionaireOrId === 'number'
        ? questionaireOrId
        : questionaireOrId.id;

    return this.questionairesDataProvider
      .deleteQuestionaire(questionaireId)
      .pipe(
        tap(() => {
          this.logger.trace(
            `${QuestionairesService.name}: Deleted questionaire with id = ${questionaireId}`,
          );
        }),

        catchError((errReport: IErrReport) => {
          this.logger.trace(`${QuestionairesService.name}: catchError called`);

          /* inform user */
          if (
            errReport.error &&
            errReport.error.status === StatusCodes.NOT_FOUND
          ) {
            /* 404: questionaire did not exist */
            this.logger.trace(
              `${QuestionairesService.name}: ERROR: Did not find questionaire with id = ${questionaireId}`,
            );
          } else {
            /* otherwise a general fail */
            this.toastr.error('ERROR!', this.toastrMessage);
          }
          /* mark as handled */
          errReport.isHandled = true;

          this.logger.trace(
            `${QuestionairesService.name}: Throwing the error on`,
          );
          return throwError(errReport);
        }),
      );
  }

  /**
   * Updates a particular questionaire.
   * @param questionaire: The questionaire object to be updated, which must contain an id field.
   * @returns An observable containing a questionaire object.
   * @throws: Throws an observable with an error if any response other than a successful response is received from the server.
   */
  updateQuestionaire(questionaire: IQuestionaire): Observable<IQuestionaire> {
    this.logger.trace(
      `${QuestionairesService.name}: updateQuestionaire called`,
    );

    return this.questionairesDataProvider.updateQuestionaire(questionaire).pipe(
      tap(() => {
        this.logger.trace(
          `${QuestionairesService.name}: Updated questionaire with id = ${questionaire.id}`,
        );
      }),

      catchError((errReport: IErrReport) => {
        this.logger.trace(`${QuestionairesService.name}: catchError called`);

        /* inform user */
        if (
          errReport.error &&
          errReport.error.status === StatusCodes.NOT_FOUND
        ) {
          /* 404: questionaire did not exist */
          this.logger.trace(
            `${QuestionairesService.name}: ERROR: Did not find questionaire with id = ${questionaire.id}`,
          );
        } else {
          /* otherwise a general fail */
          this.toastr.error('ERROR!', this.toastrMessage);
        }
        /* mark as handled */
        errReport.isHandled = true;

        this.logger.trace(
          `${QuestionairesService.name}: Throwing the error on`,
        );
        return throwError(errReport);
      }),
    );
  }
}
