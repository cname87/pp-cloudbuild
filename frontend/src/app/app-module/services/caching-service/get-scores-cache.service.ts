import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';
import { IDate, IScores } from '../../../scores-module/models/scores-models';

/**
 * This service provides a cache holding a Map of get scores requests and responses. This cache is triggered by a http interceptor so get all get scores requests are served out of cache, if there is a hit, rather than incurring a server request.
 */

@Injectable({ providedIn: 'root' })
export class GetScoresCache {
  //
  /**
   * Holds the set of dates from the cached Requests with the corresponding responses.
   */
  #cache = new Map<string, HttpResponse<IScores>>();

  constructor(private logger: NGXLogger) {
    this.logger.trace(`${GetScoresCache.name}: Starting GetScoresCache`);
  }

  /**
   * Returns a key for a scores request that is unique across members and scores tables.
   * @param request A get or create scores table request that has a date object in the body.
   * @returns A string used as a key in the cache map.
   */
  #getRequestKey(request: HttpRequest<IDate>): string {
    /* create a request key that includes the member id, which is in the request url, and the scores table date */
    const idString = request.urlWithParams;
    const dateString = `${request.body?.date.toISOString()}`;
    if (!idString || !dateString) {
      throw new Error(
        `${GetScoresCache.name}: id or date invalid in scores cache request`,
      );
    }
    return `${idString}:${dateString}`;
  }

  /**
   * Gets the scores table cached response corresponding to a date, or returns undefined if no cached response.
   * @param request A request, with a date body, whose cached response is to be returned.
   */
  getCache(request: HttpRequest<IDate>): HttpResponse<IScores> | undefined {
    this.logger.trace(`${GetScoresCache.name}: running getCache`);
    const requestKey = this.#getRequestKey(request);
    return this.#cache.get(requestKey);
  }

  /**
   * Clears the cache of a specific request, or entirely if no request is supplied.
   * @param request A request whose cached respone is to be cleared.
   */
  clearCache(request?: HttpRequest<IDate>): void {
    this.logger.trace(`${GetScoresCache.name}: running clearCache`);
    if (request) {
      const requestKey = this.#getRequestKey(request);
      this.#cache.delete(requestKey);
    }
    this.#cache.clear();
  }

  /**
   * Sets the cached response from a get or create a scores table response.
   * It copies a unique request key and the response to the cache map.
   * @param request A get or create scores table request to be cached.
   * @param response The response from the get or create scores table request.
   */
  setGetOrPost(
    request: HttpRequest<IDate>,
    response: HttpResponse<IScores>,
  ): void {
    const requestKey = this.#getRequestKey(request);
    this.logger.trace(
      `${GetScoresCache.name}: putting ${requestKey} with ${JSON.stringify(
        response.body,
      )} into the cache`,
    );
    if (requestKey) {
      this.#cache.set(requestKey, response);
    }
  }

  /**
   * Sets the cached response from an update scores table response, i.e. replaces the table associated with the relevant request key.
   * It copies a unique request key and the response to the cache map.
   * @param request An update scores table request to be updated in the cache table.
   * @param response The response from the update scores table request.
   */
  setPutOne(
    request: HttpRequest<IDate>,
    response: HttpResponse<IScores>,
  ): void {
    /* pass to the setGetOrPost request as the action is the same, i.e. the cache key and response are generated the same way */
    this.setGetOrPost(request, response);
  }
}
