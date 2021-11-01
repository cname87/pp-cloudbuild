import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { NGXLogger } from 'ngx-logger';
import { ToastrService } from 'ngx-toastr';

import { ScoresDataProvider } from '../data-providers/scores.data-provider';
import { IScores } from '../models/scores-models';

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

  /**
   * Picks up any upstream errors, displays a toaster message and throws on the error.
   * @param err An error object
   * @throws Throws the received error object
   */
  #catchError = (err: any): never => {
    this.logger.trace(`${ScoresService.name}: #catchError called`);
    /* error message displayed to the user for all update fails */
    const toastrMessage = 'A table update error has occurred';
    this.logger.trace(`${ScoresService.name}: #catchError called`);
    this.logger.trace(`${ScoresService.name}: Displaying a toastr message`);
    this.toastr.error('ERROR!', toastrMessage);
    this.logger.trace(`${ScoresService.name}: Throwing the error on`);
    throw err;
  };

  /**
   * Gets a scores table by date. Only one scores table object can be linked to any particular day so the backend server attempts to find the one scores object corresponding to the day in the supplied date and returns it. If a scores table with that day does not exist then one is created with empty data.
   * @param date The date of the scores table to be returned.
   * @returns An observable containing a scores table object.
   * @throws See #catchError.
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
      catchError(this.#catchError),
    );
  }

  /**
   * Updates a scores table on the server.
   * @param scores A scores table object.
   * @returns An observable containing the updated scores table.
   * @throws See #catchError.
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
      catchError(this.#catchError),
    );
  }
}
