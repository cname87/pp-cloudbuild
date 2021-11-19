import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';
import {
  IDate,
  ISessions,
} from '../../../sessions-module/models/sessions-models';

/**
 * This service provides a cache holding a Map of get sessions requests and responses. This cache is triggered by a http interceptor so get all get sessions requests are served out of cache, if there is a hit, rather than incurring a server request.
 */

@Injectable({ providedIn: 'root' })
export class GetSessionsCache {
  //
  /**
   * Holds the set of dates from the cached Requests with the corresponding responses.
   */
  #cache = new Map<string, HttpResponse<ISessions>>();

  constructor(private logger: NGXLogger) {
    this.logger.trace(`${GetSessionsCache.name}: Starting GetSessionsCache`);
  }

  /**
   * Returns a key for a sessions request that is unique across members and sessions tables.
   * @param request A get or create sessions table request that has a date object in the body.
   * @returns A string used as a key in the cache map.
   */
  #getRequestKey(request: HttpRequest<IDate>): string {
    /* create a request key that includes the member id, which is in the request url, and the sessions table date */
    const idString = request.urlWithParams;
    const dateString = `${request.body?.date.toISOString()}`;
    if (!idString || !dateString) {
      throw new Error(
        `${GetSessionsCache.name}: id or date invalid in sessions cache request`,
      );
    }
    return `${idString}:${dateString}`;
  }

  /**
   * Gets the sessions table cached response corresponding to a date, or returns undefined if no cached response.
   * @param request A request, with a date body, whose cached response is to be returned.
   */
  getCache(request: HttpRequest<IDate>): HttpResponse<ISessions> | undefined {
    this.logger.trace(`${GetSessionsCache.name}: running getCache`);
    const requestKey = this.#getRequestKey(request);
    return this.#cache.get(requestKey);
  }

  /**
   * Clears the cache of a specific request, or entirely if no request is supplied.
   * @param request A request whose cached respone is to be cleared.
   */
  clearCache(request?: HttpRequest<IDate>): void {
    this.logger.trace(`${GetSessionsCache.name}: running clearCache`);
    if (request) {
      const requestKey = this.#getRequestKey(request);
      this.#cache.delete(requestKey);
    }
    this.#cache.clear();
  }

  /**
   * Sets the cached response from a get or create a sessions table response.
   * It copies a unique request key and the response to the cache map.
   * @param request A get or create sessions table request to be cached.
   * @param response The response from the get or create sessions table request.
   */
  setGetOrPost(
    request: HttpRequest<IDate>,
    response: HttpResponse<ISessions>,
  ): void {
    const requestKey = this.#getRequestKey(request);
    this.logger.trace(
      `${GetSessionsCache.name}: putting ${requestKey} with ${JSON.stringify(
        response.body,
      )} into the cache`,
    );
    if (requestKey) {
      this.#cache.set(requestKey, response);
    }
  }

  /**
   * Sets the cached response from an update sessions table response, i.e. replaces the table associated with the relevant request key.
   * It copies a unique request key and the response to the cache map.
   * @param request An update sessions table request to be updated in the cache table.
   * @param response The response from the update sessions table request.
   */
  setPutOne(
    request: HttpRequest<IDate>,
    response: HttpResponse<ISessions>,
  ): void {
    /* pass to the setGetOrPost request as the action is the same, i.e. the cache key and response are generated the same way */
    this.setGetOrPost(request, response);
  }
}
