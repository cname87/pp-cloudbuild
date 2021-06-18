/**
 * Project Perform API V2.0.0
 * See https://app.swaggerhub.com/apis/cname87/Project-Perform/2.0.0
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { NGXLogger } from 'ngx-logger';

import { catchError, tap } from 'rxjs/operators';
import { apiConfiguration } from './configuration';
import { CustomHttpUrlEncodingCodec } from './encoder';
import { ICount, IQuestionaire, IQuestionaireWithoutId } from './models/models';

/**
 * This service handles all communication with the server according to the defined api. It implements all the function to create, get, update and delete health questionaire data on the server.
 */
@Injectable({
  providedIn: 'root',
})
export class QuestionairesDataProvider {
  /* local variables */
  private basePath = apiConfiguration.basePath;
  private membersPath = apiConfiguration.membersPath;
  private questionairesPath = apiConfiguration.questionairesPath;
  private defaultHeaders = apiConfiguration.defaultHeaders;
  private withCredentials = apiConfiguration.withCredentials;

  constructor(private httpClient: HttpClient, private logger: NGXLogger) {
    this.logger.trace(
      `${QuestionairesDataProvider.name}: Starting QuestionairesDataProvider`,
    );
  }

  /**
   * Adds a supplied questionaire to the defined member
   * A questionaire object without the id property must be supplied in the body.
   * @param memberId: The member to whom the questionaire is being added.
   * @param questionaireWithoutId: Questionaire object but with no id property.
   * @returns An observable returning the questionaire added.
   */
  public addQuestionaire(
    questionaireWithoutId: IQuestionaireWithoutId,
  ): Observable<IQuestionaire> {
    this.logger.trace(
      `${QuestionairesDataProvider.name}: addQuestionaire called`,
    );

    if (questionaireWithoutId === null || questionaireWithoutId === undefined) {
      throw new Error(
        'Required parameter questionaireWithoutId was null or undefined when calling addQuestionaire.',
      );
    }

    let headers = this.defaultHeaders;
    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');
    /* set Content-Type header - what content is being sent */
    headers = headers.set('Content-Type', 'application/json');

    const path = `${this.basePath}/${this.questionairesPath}`;
    this.logger.trace(
      `${QuestionairesDataProvider.name}: Sending POST request to: ${path}`,
    );

    return this.httpClient
      .post<IQuestionaire>(`${path}`, questionaireWithoutId, {
        withCredentials: this.withCredentials,
        headers,
      })
      .pipe(
        tap((_) => {
          this.logger.trace(
            `${QuestionairesDataProvider.name}: Received response`,
          );
        }),
        catchError((errReport) => {
          this.logger.trace(
            `${QuestionairesDataProvider.name}: catchError called`,
          );
          /* rethrow all errors */
          this.logger.trace(
            `${QuestionairesDataProvider.name}: Throwing the error on`,
          );
          return throwError(errReport);
        }),
      );
  }

  /**
   * Gets all the questionaires for all members, filtered by a query string.
   * @param matchString: An optional search string to limit the returned list.
   * All questionaires with the name property starting with 'name' will be returned.
   * @returns An observable returning an array of the questionaires retrieved.
   */
  public getAllQuestionaires(
    matchString?: string,
  ): Observable<IQuestionaire[]> {
    this.logger.trace(
      `${QuestionairesDataProvider.name}: getAllQuestionaires called`,
    );

    /* set up query parameter */
    let queryParameters = new HttpParams();
    if (matchString !== undefined && matchString !== null) {
      /* custom encoder handles '+' properly */
      const encoder = new CustomHttpUrlEncodingCodec();
      matchString = encoder.encodeValue(matchString);
      queryParameters = queryParameters.set('type', matchString);
    }

    let headers = this.defaultHeaders;

    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');

    const path = `${this.basePath}/${this.questionairesPath}`;

    this.logger.trace(
      `${QuestionairesDataProvider.name}: Sending GET request to: ${path}`,
    );

    return this.httpClient
      .get<IQuestionaire[]>(`${path}`, {
        params: queryParameters,
        withCredentials: this.withCredentials,
        headers,
      })
      .pipe(
        tap((_) => {
          this.logger.trace(
            `${QuestionairesDataProvider.name}: Received response`,
          );
        }),
        catchError((errReport) => {
          this.logger.trace(
            `${QuestionairesDataProvider.name}: catchError called`,
          );
          /* rethrow all errors */
          this.logger.trace(
            `${QuestionairesDataProvider.name}: Throwing the error on`,
          );
          return throwError(errReport);
        }),
      );
  }

  /**
   * Gets all the questionaires for a particular member, filtered by a query string.
   * @param matchString: An optional search string to limit the returned list.
   *  All questionaires with the 'type' property starting with the matchstring will be returned.
   * @param memberId:
   * - If 0, then all questionaires from every member are returned.
   * - If not 0 then the questionaires belonging to a specific team member is returned.
   * @returns An observable returning an array of the questionaires retrieved.
   */
  public getQuestionaires(
    memberId: number,
    matchString?: string,
  ): Observable<IQuestionaire[]> {
    this.logger.trace(
      `${QuestionairesDataProvider.name}: getQuestionaires called`,
    );

    /* set up query parameter */
    let queryParameters = new HttpParams();
    if (matchString !== undefined && matchString !== null) {
      /* custom encoder handles '+' properly */
      const encoder = new CustomHttpUrlEncodingCodec();
      matchString = encoder.encodeValue(matchString);
      queryParameters = queryParameters.set('type', matchString);
    }

    let headers = this.defaultHeaders;

    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');

    const memberIdString = encodeURIComponent(String(memberId));
    const path = `${this.basePath}/${this.membersPath}/${memberIdString}/${this.questionairesPath}`;

    this.logger.trace(
      `${QuestionairesDataProvider.name}: Sending GET request to: ${path}`,
    );

    return this.httpClient
      .get<IQuestionaire[]>(`${path}`, {
        params: queryParameters,
        withCredentials: this.withCredentials,
        headers,
      })
      .pipe(
        tap((_) => {
          this.logger.trace(
            `${QuestionairesDataProvider.name}: Received response`,
          );
        }),
        catchError((errReport) => {
          this.logger.trace(
            `${QuestionairesDataProvider.name}: catchError called`,
          );
          /* rethrow all errors */
          this.logger.trace(
            `${QuestionairesDataProvider.name}: Throwing the error on`,
          );
          return throwError(errReport);
        }),
      );
  }

  /**
   * Gets a specific questionaire.
   * @param questionaireId: The value of the id property of the questionaire.
   * @returns An observable returning the questionaires retrieved.
   */
  public getQuestionaire(questionaireId: number): Observable<IQuestionaire> {
    this.logger.trace(
      `${QuestionairesDataProvider.name}: getQuestionaire called`,
    );

    if (questionaireId === null || questionaireId === undefined) {
      throw new Error(
        'Required parameter id was null or undefined when calling getQuestionaire.',
      );
    }

    let headers = this.defaultHeaders;
    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');

    const questionaireIdString = encodeURIComponent(String(questionaireId));
    const path = `${this.basePath}/${this.questionairesPath}/${questionaireIdString}`;

    this.logger.trace(
      `${QuestionairesDataProvider.name}: Sending GET request to: ${path}`,
    );

    return this.httpClient
      .get<IQuestionaire>(`${path}`, {
        withCredentials: this.withCredentials,
        headers,
      })
      .pipe(
        tap((_) => {
          this.logger.trace(
            `${QuestionairesDataProvider.name}: Received response`,
          );
        }),
        catchError((errReport) => {
          this.logger.trace(
            `${QuestionairesDataProvider.name}: catchError called`,
          );
          /* rethrow all errors */
          this.logger.trace(
            `${QuestionairesDataProvider.name}: Throwing the error on`,
          );
          return throwError(errReport);
        }),
      );
  }

  /**
   * Updates a questionaire.
   * A questionaire object is supplied which must have an id property.
   * @param questionaire: Team questionaire to be updated detail
   * @returns An observable returning the updated questionaire.
   */
  public updateQuestionaire(
    questionaire: IQuestionaire | IQuestionaire,
  ): Observable<IQuestionaire> {
    this.logger.trace(
      `${QuestionairesDataProvider.name}: updateQuestionaire called`,
    );

    if (questionaire === null || questionaire === undefined) {
      throw new Error(
        'Required parameter questionaire was null or undefined when calling updateQuestionaire.',
      );
    }

    let headers = this.defaultHeaders;
    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');
    /* set Content-Type header - what content is being sent */
    headers = headers.set('Content-Type', 'application/json');

    const path = `${this.basePath}/${this.questionairesPath}`;

    this.logger.trace(
      `${QuestionairesDataProvider.name}: Sending PUT request to: ${path}`,
    );

    return this.httpClient
      .put<IQuestionaire>(`${path}`, questionaire, {
        withCredentials: this.withCredentials,
        headers,
      })
      .pipe(
        tap((_) => {
          this.logger.trace(
            `${QuestionairesDataProvider.name}: Received response`,
          );
        }),
        catchError((errReport) => {
          this.logger.trace(
            `${QuestionairesDataProvider.name}: catchError called`,
          );
          /* rethrow all errors */
          this.logger.trace(
            `${QuestionairesDataProvider.name}: Throwing the error on`,
          );
          return throwError(errReport);
        }),
      );
  }

  /**
   * Deletes a questionaire.
   * @param questionaireId The id property of the questionaire to delete.
   * @returns An observable returning a count of the questionaires deleted, (which should always be 1).
   */
  public deleteQuestionaire(questionaireId: number): Observable<ICount> {
    this.logger.trace(
      `${QuestionairesDataProvider.name}: deleteQuestionaire called`,
    );

    if (questionaireId === null || questionaireId === undefined) {
      throw new Error(
        'Required parameter id was null or undefined when calling deleteQuestionaire.',
      );
    }

    let headers = this.defaultHeaders;
    /* set Accept header - what content we will accept back */
    headers = headers.set('Accept', 'application/json');

    const questionaireIdString = encodeURIComponent(String(questionaireId));
    const path = `${this.basePath}/${this.questionairesPath}/${questionaireIdString}`;

    this.logger.trace(
      `${QuestionairesDataProvider.name}: Sending DELETE request to: ${path}`,
    );

    return this.httpClient
      .delete<ICount>(`${path}`, {
        withCredentials: this.withCredentials,
        headers,
      })
      .pipe(
        tap((_) => {
          this.logger.trace(
            `${QuestionairesDataProvider.name}: Received response`,
          );
        }),
        catchError((errReport) => {
          this.logger.trace(
            `${QuestionairesDataProvider.name}: catchError called`,
          );
          /* rethrow all errors */
          this.logger.trace(
            `${QuestionairesDataProvider.name}: Throwing the error on`,
          );
          return throwError(errReport);
        }),
      );
  }
}
