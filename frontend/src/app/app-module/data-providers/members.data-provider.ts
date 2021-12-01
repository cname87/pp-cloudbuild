/**
 * Project Perform API V2.0.0
 * See https://app.swaggerhub.com/apis/cname87/Project-Perform/2.0.0
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NGXLogger } from 'ngx-logger';
import { catchError, tap } from 'rxjs/operators';

import { apiConfiguration } from '../../configuration/configuration';
import { CustomHttpUrlEncodingCodec } from './encoder';
import { ICount, IMember, IMemberWithoutId } from '../models/models';

export { ICount, IMember, IMemberWithoutId };

/**
 * This service handles communication with the server. It implements all the function to create, get, update and delete members on the server.
 */
@Injectable({
  providedIn: 'root',
})
export class MembersDataProvider {
  //
  private basePath = apiConfiguration.basePath;
  private membersPath = apiConfiguration.membersPath;
  private memberPath = apiConfiguration.memberPath;
  private defaultHeaders = apiConfiguration.defaultHeaders;
  private withCredentials = apiConfiguration.withCredentials;

  constructor(private httpClient: HttpClient, private logger: NGXLogger) {
    this.logger.trace(
      `${MembersDataProvider.name}: Starting MembersDataProvider`,
    );
  }

  /**
   * Picks up any upstream errors and throws on the error.
   * @param err An error object
   * @throws Throws the received error object
   */
  #catchError = (err: any): never => {
    this.logger.trace(`${MembersDataProvider.name}: #catchError called`);
    this.logger.trace(`${MembersDataProvider.name}: Throwing the error on`);
    throw err;
  };

  /**
   * Gets all the members, or as determined by a query string.
   * @param name: An optional search string to limit the returned list.
   * All members with the name property starting with 'name' will be returned.
   * @returns An observable returning an array of the members retrieved.
   */
  public getMembers(name?: string): Observable<IMember[]> {
    this.logger.trace(`${MembersDataProvider.name}: getMembers called`);

    /* set up query parameter */
    let queryParameters = new HttpParams();
    if (name !== undefined && name !== null) {
      /* custom encoder handles '+' properly */
      const encoder = new CustomHttpUrlEncodingCodec();
      name = encoder.encodeValue(name);
      queryParameters = queryParameters.set('name', name);
    }

    let headers = this.defaultHeaders;
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Accept', 'application/json');

    this.logger.trace(
      `${MembersDataProvider.name}: Sending GET request to: ${this.basePath}/${this.membersPath}`,
    );

    return this.httpClient
      .get<IMember[]>(`${this.basePath}/${this.membersPath}`, {
        params: queryParameters,
        withCredentials: this.withCredentials,
        headers,
      })
      .pipe(
        tap((_) => {
          this.logger.trace(`${MembersDataProvider.name}: Received response`);
        }),
        catchError(this.#catchError),
      );
  }

  /**
   * Get a specific member.
   * @param id: The value of the id property of the member.
   * @returns An observable returning the members retrieved.
   */
  public getMember(id: number): Observable<IMember> {
    this.logger.trace(`${MembersDataProvider.name}: getMember called`);

    if (id === null || id === undefined) {
      throw new Error(
        'Required parameter id was null or undefined when calling getMember.',
      );
    }

    let headers = this.defaultHeaders;
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Accept', 'application/json');

    this.logger.trace(
      `${MembersDataProvider.name}: Sending GET request to: ${this.basePath}/${this.memberPath}/${id}`,
    );

    return this.httpClient
      .get<IMember>(
        `${this.basePath}/${this.memberPath}/${encodeURIComponent(String(id))}`,
        {
          withCredentials: this.withCredentials,
          headers,
        },
      )
      .pipe(
        tap((_) => {
          this.logger.trace(`${MembersDataProvider.name}: Received response`);
        }),
        catchError(this.#catchError),
      );
  }

  /**
   * Adds a supplied member.
   * A member object without the id property must be supplied in the body.
   * @param: memberWithoutId: Member object but with no id property.
   * @returns An observable returning the member added.
   */

  public addMember(memberWithoutId: IMemberWithoutId): Observable<IMember> {
    this.logger.trace(`${MembersDataProvider.name}: addMember called`);

    if (!memberWithoutId) {
      throw new Error('Required parameter was invalid.');
    }

    let headers = this.defaultHeaders;
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Accept', 'application/json');

    this.logger.trace(
      `${MembersDataProvider.name}: Sending POST request to: ${this.basePath}/${this.memberPath}`,
    );

    return this.httpClient
      .post<IMember>(`${this.basePath}/${this.memberPath}`, memberWithoutId, {
        headers,
        observe: 'body',
        responseType: 'json',
        withCredentials: this.withCredentials,
      })
      .pipe(
        tap((_) => {
          this.logger.trace(`${MembersDataProvider.name}: Received response`);
        }),
        catchError(this.#catchError),
      );
  }

  /**
   * Updates a member.
   * A member object is supplied which must have an id property.
   * The member with that id is updated.
   * @param member: Team member to be updated detail
   * @returns An observable returning the updated member.
   */
  public updateMember(member: IMember): Observable<IMember> {
    this.logger.trace(`${MembersDataProvider.name}: updateMember called`);

    if (!member?.id) {
      throw new Error(
        'Required parameter member was invalid when calling updateMember.',
      );
    }
    const id = member.id;

    let headers = this.defaultHeaders;
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Accept', 'application/json');

    this.logger.trace(
      `${MembersDataProvider.name}: Sending PUT request to: ${this.basePath}/${this.memberPath}/${id}`,
    );

    return this.httpClient
      .put<IMember>(
        `${this.basePath}/${this.memberPath}/${encodeURIComponent(String(id))}`,
        member,
        {
          withCredentials: this.withCredentials,
          headers,
        },
      )
      .pipe(
        tap((_) => {
          this.logger.trace(`${MembersDataProvider.name}: Received response`);
        }),
        catchError(this.#catchError),
      );
  }

  /**
   * Deletes a member.
   * @param id The ID of the team member to delete.
   * @returns An observable returning a count of the members deleted, (which should always be 1).
   */
  public deleteMember(id: number): Observable<ICount> {
    this.logger.trace(`${MembersDataProvider.name}: deleteMember called`);

    if (!id) {
      throw new Error(
        'Required parameter id was invalid when calling deleteMember.',
      );
    }

    let headers = this.defaultHeaders;
    headers = headers.set('Content-Type', 'application/json');
    headers = headers.set('Accept', 'application/json');

    this.logger.trace(
      `${MembersDataProvider.name}: Sending DELETE request to: ${this.basePath}/${this.memberPath}/${id}`,
    );

    return this.httpClient
      .delete<ICount>(
        `${this.basePath}/${this.memberPath}/${encodeURIComponent(String(id))}`,
        {
          withCredentials: this.withCredentials,
          headers,
        },
      )
      .pipe(
        tap((_) => {
          this.logger.trace(`${MembersDataProvider.name}: Received response`);
        }),
        catchError(this.#catchError),
      );
  }
}
