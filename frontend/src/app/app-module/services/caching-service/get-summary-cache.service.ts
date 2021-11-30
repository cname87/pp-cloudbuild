import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';
import cloneDeep from 'lodash.clonedeep';
import { TSummary } from '../../../summary-module/models/summary-models';
import { apiConfiguration } from '../../../configuration/configuration';

/**
 * This service provides a cache holding a Map of get summary requests and responses. Specific get summary requests can be deleted from the cache, e.g. following scores or sessions tables updates. This cache is triggered by a http interceptor so get all get summary requests are served out of cache, if there is a hit, rather than incurring a server request.
 */

@Injectable({ providedIn: 'root' })
export class GetSummaryCache {
  //
  /* holds the set of cached Requests with their response */
  #cache = new Map<string, TSummary>();

  constructor(private logger: NGXLogger) {
    this.logger.trace(`${GetSummaryCache.name}: Starting GetSummaryCache`);
  }

  #basePath = apiConfiguration.basePath;
  #memberPath = apiConfiguration.memberPath;
  #urlPrefix = `${this.#basePath}/${this.#memberPath}/`;
  #prefixLength = this.#urlPrefix.length;

  /**
   * Returns a key for a summary request that is unique - this just needs to include the member id.
   * @param request A get summary table request
   * @returns A string used as a key in the cache map.
   */
  #getRequestKey(request: HttpRequest<TSummary>): string {
    this.logger.trace(`${GetSummaryCache.name}: running getRequestKey`);

    /* create a request key that includes the member id, which is in the request url */
    const idString = request.urlWithParams.charAt(this.#prefixLength);
    console.log(idString);
    if (!idString) {
      throw new Error(
        `${GetSummaryCache.name}: url invalid in summary request`,
      );
    }
    return `${idString}`;
  }

  /**
   * Gets the cached response, or returns undefined if no cached response.
   * @param request A request whose cached respone is to be returned.
   * @returns A cached summary response or undefined if there is no cache hit.
   */
  getCache(request: HttpRequest<TSummary>): HttpResponse<TSummary> | undefined {
    this.logger.trace(`${GetSummaryCache.name}: running getCache`);

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
  clearCache(request?: HttpRequest<TSummary>): void {
    this.logger.trace(`${GetSummaryCache.name}: running clearCache`);

    if (request) {
      const requestKey = this.#getRequestKey(request);
      this.#cache.delete(requestKey);
      return;
    }
    this.#cache.clear();
  }

  /**
   * Caches a request/response pair from a fulfilled get summary table request.
   * It copies a unique request key and the response body to the cache map.
   * @param request A get summary table request to be cached.
   * @param response The response from the get summary table request - to be cached.
   */
  setGet(request: HttpRequest<TSummary>, response: HttpResponse<TSummary>) {
    this.logger.trace(`${GetSummaryCache.name}: running setGet`);

    /* generate the unique request key */
    const requestKey = this.#getRequestKey(request);

    this.logger.trace(
      `${GetSummaryCache.name}: putting ${requestKey} with ${JSON.stringify(
        response.body,
      )} into the cache`,
    );

    /* deep clone the body to be cached as the cached object must be immutable */
    const clonedBody = cloneDeep(response.body);
    const frozenBody = Object.freeze(clonedBody);

    /* set the cache */
    if (requestKey && frozenBody) {
      this.#cache.set(requestKey, frozenBody as TSummary);
    }
  }
}
