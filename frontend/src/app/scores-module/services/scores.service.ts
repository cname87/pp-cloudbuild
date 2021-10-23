import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';
import { StatusCodes } from 'http-status-codes';
import { ToastrService } from 'ngx-toastr';

import { ScoresDataProvider } from '../data-providers/scores.data-provider';
import { IScores } from '../data-providers/scores-models';
import { IErrReport } from '../../configuration/configuration';

/**
 * This service provides functions to call all the api functions providing appropriate responses, messaging and errorhandling.
 */
@Injectable({ providedIn: 'root' })
export class ScoresService {
  constructor(
    private scoresDataProvider: ScoresDataProvider,
    private logger: NGXLogger,
    private toastr: ToastrService,
  ) {
    this.logger.trace(`${ScoresService.name}: starting ScoresService`);
  }

  /* common toastr message */
  private toastrMessage = 'A server access error has occurred';

  /**
   * Gets a scores table by date. Only one scores table object can be linked to any particular day so the backend server attempts to find the one scores object corresponding to the day in the supplied date and returns it. If a scores table with that day does not exist then one is created with empty data.
   * @param
   * - date: The date of the scores table to be returned.
   * @returns
   * - An observable containing a scores table object.
   * @throws
   * - Throws an observable with an error if any response other than a successful response is received from the server.
   */
  getOrCreateScores(memberId: number, date: Date): Observable<IScores> {
    this.logger.trace(`${ScoresService.name}: getOrCreateScores called`);

    return this.scoresDataProvider.getOrCreateScores(memberId, date).pipe(
      tap((data: IScores) => {
        this.logger.trace(
          `${
            ScoresService.name
          }: Fetched or created scores table with date = ${data.date.toISOString()}`,
        );
      }),

      catchError((errReport: IErrReport) => {
        this.logger.trace(`${ScoresService.name}: catchError called`);

        /* inform user */
        if (
          errReport.error &&
          errReport.error.status === StatusCodes.NOT_FOUND
        ) {
          /* 404: scores table did not exist */
          this.logger.trace(
            `${
              ScoresService.name
            }: ERROR: Did not find scores table with date = ${date.toDateString()}`,
          );
        } else {
          /* otherwise a general fail */
          this.toastr.error('ERROR!', this.toastrMessage);
        }
        errReport.isHandled = false;

        this.logger.trace(`${ScoresService.name}: Throwing the error on`);
        return throwError(errReport);
      }),
    );
  }

  /**
   * Updates a scores table on the server.
   * @param
   * - scores: A scores table object.
   * @returns
   * - An observable containing the updated scores table.
   * @throws
   * - Throws an observable with an error if any response other than a successful response is received from the server.
   */
  updateScoresTable(scores: IScores): Observable<IScores> {
    this.logger.trace(`${ScoresService.name}: updateScoresTable called`);

    return this.scoresDataProvider.updateScoresTable(scores).pipe(
      tap((data: IScores) => {
        this.logger.trace(
          `${
            ScoresService.name
          }: Updated scores table with date = ${data.date.toISOString()}`,
        );
      }),

      catchError((errReport: IErrReport) => {
        this.logger.trace(`${ScoresService.name}: catchError called`);

        /* inform user */
        if (
          errReport.error &&
          errReport.error.status === StatusCodes.NOT_FOUND
        ) {
          /* 404: scores table did not exist */
          this.logger.trace(
            `${ScoresService.name}: ERROR: Did not find scores table with id = ${scores.id}`,
          );
        } else {
          /* otherwise a general fail */
          this.toastr.error('ERROR!', this.toastrMessage);
        }
        errReport.isHandled = false;

        this.logger.trace(`${ScoresService.name}: Throwing the error on`);
        return throwError(errReport);
      }),
    );
  }
}
