import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';
import { IMember } from '../../models/models';

/**
 * This service provides a cache holding a Map of get member requests and responses. Specific get member requests can be deleted from the cache, e.g. following updates or deletes. This cache is triggered by a http interceptor so get all get member requests are served out of cache, if there is a hit, rather than incurring a server request.
 */

@Injectable({ providedIn: 'root' })
export class GetMemberCache {
  //
  /* holds the set of cached Requests with their response */
  #cache = new Map<string, HttpResponse<IMember>>();

  constructor(private logger: NGXLogger) {
    this.logger.trace(`${GetMemberCache.name}: Starting GetMemberCache`);
  }

  /**
   * Gets the cached response, or returns undefined if no cached response.
   * @param request A request whose cached respone is to be returned.
   */
  getCache(request: HttpRequest<IMember>): HttpResponse<IMember> | undefined {
    this.logger.trace(`${GetMemberCache.name}: running getCache`);
    return this.#cache.get(request.urlWithParams);
  }

  /**
   * Clears the cache of a specific request, or entirely if no request is supplied.
   * @param request A request whose cached respone is to be cleared.
   */
  clearCache(request?: HttpRequest<IMember>): void {
    this.logger.trace(`${GetMemberCache.name}: running clearCache`);
    if (request) {
      this.#cache.delete(request.urlWithParams);
    }
    this.#cache.clear();
  }

  /**
   * Sets the cached response from a get member response.
   * It copies the request and response to the cache.
   * @param request A get member request to be cached.
   * @param response The response from an earlier get member request.
   */
  setGet(request: HttpRequest<IMember>, response: HttpResponse<IMember>) {
    this.logger.trace(
      `${GetMemberCache.name}: putting ${
        request.urlWithParams
      } with ${JSON.stringify(response.body)} into the cache`,
    );
    this.#cache.set(request.urlWithParams, response);
  }
}
