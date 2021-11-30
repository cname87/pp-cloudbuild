import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';
import cloneDeep from 'lodash.clonedeep';
import {
  IDate,
  ISessions,
} from '../../../sessions-module/models/sessions-models';

/**
 * This service provides a cache holding a Map of get sessions requests and responses. This cache is triggered by a http interceptor so all get sessions requests are served out of cache, if there is a hit, rather than incurring a server request.
 */

@Injectable({ providedIn: 'root' })
export class GetSessionsCache {
  //
  /**
   * The key identifies a Request by a combination of the url, including the member id, and the date. (Each scores table for a member has a unique date)
   * The value is the response body.  A response is created from this.
   */
  #cache = new Map<string, ISessions>();

  constructor(private logger: NGXLogger) {
    this.logger.trace(`${GetSessionsCache.name}: Starting GetSessionsCache`);
  }

  /**
   * Returns a key for a scores request that is unique across all scores tables.
   * @param request A get or create scores table request that has a date object in the body.
   * @returns A string used as a key in the cache map.
   */
  #getRequestKey(request: HttpRequest<IDate>): string {
    this.logger.trace(`${GetSessionsCache.name}: running getRequestKey`);

    /* create a request key that includes the member id, which is in the request url, and the scores table date */
    const idString = request.urlWithParams;
    const dateString = `${request.body?.date.toISOString()}`;
    if (!idString || !dateString) {
      throw new Error(
        `${GetSessionsCache.name}: id or date invalid in scores request`,
      );
    }
    return `${idString}:${dateString}`;
  }

  /**
   * Gets the scores table cached response corresponding to a request, or returns undefined if no cached response.
   * @param request A request, (with a date body), whose cached response is to be returned.
   * @returns A cached http response or undefined if there is no cache hit.
   */
  getCache(request: HttpRequest<IDate>): HttpResponse<ISessions> | undefined {
    this.logger.trace(`${GetSessionsCache.name}: running getCache`);

    /* generate the cache map key from the request */
    const requestKey = this.#getRequestKey(request);

    /* get the cached body from the cache map value */
    const cachedBody = this.#cache.get(requestKey);

    /* deep clone so the cache content is never changed */
    const clonedBody = cloneDeep(cachedBody);

    /* create the response */
    const cachedResponse = new HttpResponse({
      body: clonedBody,
      status: 200,
    });

    /* return undefined if no cache hit */
    return clonedBody ? cachedResponse : undefined;
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
      return;
    }
    this.#cache.clear();
  }

  /**
   * Caches a request/response pair from a fulfilled get or create a scores table request.
   * It copies a unique request key and the response body to the cache map.
   * @param request A get or create scores table request to be cached.
   * @param response The response from the get or create scores table request - to be cached.
   */
  setGetOrPost(
    request: HttpRequest<IDate>,
    response: HttpResponse<ISessions>,
  ): void {
    this.logger.trace(`${GetSessionsCache.name}: running setGetOrPost`);

    /* generate the unique request key */
    const requestKey = this.#getRequestKey(request);
    this.logger.trace(
      `${GetSessionsCache.name}: putting ${requestKey} with ${JSON.stringify(
        response.body,
      )} into the cache`,
    );

    /* deep clone the body to be cached as the cache must be immutable */
    const clonedBody = cloneDeep(response.body);
    const frozenBody = Object.freeze(clonedBody);

    /* set the cache */
    if (requestKey && frozenBody) {
      this.#cache.set(requestKey, frozenBody);
    }
  }

  /**
   * Sets the cached response from an update scores table response, i.e. replaces the table associated with the relevant request key.
   * It copies a unique request key and the response body to the cache map.
   * @param request An update scores table request to be updated in the cache table.
   * @param response The response from the update scores table request - to be cached.
   */
  setPutOne(
    request: HttpRequest<IDate>,
    response: HttpResponse<ISessions>,
  ): void {
    this.logger.trace(`${GetSessionsCache.name}: running setPutOne`);

    /* pass to the setGetOrPost request as the action is the same, i.e. the cache key and response are generated the same way and any previous cached response for the request will be replaced */
    this.setGetOrPost(request, response);
  }
}
