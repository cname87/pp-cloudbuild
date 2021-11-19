import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';
import { TSummary } from '../../../summary-module/models/summary-models';

/**
 * This service provides a cache holding a Map of get summary requests and responses. Specific get summary requests can be deleted from the cache, e.g. following scores or sessions tables updates. This cache is triggered by a http interceptor so get all get summary requests are served out of cache, if there is a hit, rather than incurring a server request.
 */

@Injectable({ providedIn: 'root' })
export class GetSummaryCache {
  //
  /* holds the set of cached Requests with their response */
  #cache = new Map<string, HttpResponse<TSummary>>();

  constructor(private logger: NGXLogger) {
    this.logger.trace(`${GetSummaryCache.name}: Starting GetSummaryCache`);
  }

  /**
   * Gets the cached response, or returns undefined if no cached response.
   * @param request A request whose cached respone is to be returned.
   */
  getCache(request: HttpRequest<TSummary>): HttpResponse<TSummary> | undefined {
    this.logger.trace(`${GetSummaryCache.name}: running getCache`);
    return this.#cache.get(request.urlWithParams);
  }

  /**
   * Clears the cache of a specific request, or entirely if no request is supplied.
   * @param request A request whose cached respone is to be cleared.
   */
  clearCache(request?: HttpRequest<TSummary>): void {
    this.logger.trace(`${GetSummaryCache.name}: running clearCache`);
    if (request) {
      this.#cache.delete(request.urlWithParams);
    }
    this.#cache.clear();
  }

  /**
   * Sets the cached response from a get summary response.
   * It copies the request and response to the cache.
   * @param request A get summary request to be cached.
   * @param response The response from an earlier get summary request.
   */
  setGet(request: HttpRequest<TSummary>, response: HttpResponse<TSummary>) {
    this.logger.trace(
      `${GetSummaryCache.name}: putting ${
        request.urlWithParams
      } with ${JSON.stringify(response.body)} into the cache`,
    );
    this.#cache.set(request.urlWithParams, response);
  }
}
