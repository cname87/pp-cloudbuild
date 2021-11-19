import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';
import { StatusCodes } from 'http-status-codes';

import { apiConfiguration } from '../../../configuration/configuration';
import { GetMembersCache } from './get-members-cache.service';
import { GetMemberCache } from './get-member-cache.service';

@Injectable({ providedIn: 'root' })
export class RequestCacheService {
  //
  #members = `${apiConfiguration.basePath}/${apiConfiguration.membersPath}`;
  #member = `${apiConfiguration.basePath}/${apiConfiguration.memberPath}`;
  /* Note: must match 'member/1' but not 'member/1/sessions' */
  #memberWithId = new RegExp(this.#member + `\/[1-9]\\d*$`);
  #cacheServices = [this.membersCache, this.memberCache];

  constructor(
    private membersCache: GetMembersCache,
    private memberCache: GetMemberCache,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      `${RequestCacheService.name}: Starting RequestCacheService`,
    );
  }

  /**
   * Called to clear a specific cache. If no cache service is passed in then all caches are cleared.
   * @param cache A cache service with a clearCache function
   * @returns void
   */
  clearCache(cache?: GetMemberCache | GetMembersCache): void {
    this.logger.trace(`${RequestCacheService.name}: running clearCache`);
    if (!cache) {
      this.#cacheServices.forEach((cache) => cache.clearCache());
    } else {
      cache.clearCache();
    }
  }

  /**
   * Called by a http interceptor asking for a cached http response to a http request. It will only match to a specific urls'
   * @param request: The http interceptor sends in the request for which a cached response is required.
   * @returns
   * - Returns a cached http response if it has one.
   * - Returns undefined if there is no cached response.
   */
  getCache(request: HttpRequest<any>): HttpResponse<any> | undefined {
    this.logger.trace(`${RequestCacheService.name}: running getCache`);

    /* return cache for get all members */
    if (request.method === 'GET' && request.urlWithParams === this.#members) {
      return this.membersCache.response;
    }
    /* return cache for get one member */
    if (
      request.method === 'GET' &&
      this.#memberWithId.test(request.urlWithParams)
    ) {
      return this.memberCache.getCache(request);
    }
    /* otherwise return that the cache is empty */
    return undefined;
  }

  /**
   * Called by a http interceptor which passes in a http request and its external response in order for the cache service to update the cache appropriately.
   * @param request The request which had been sent.
   * @param response The response to the sent request.
   * @returns void
   */
  putCache(request: HttpRequest<any>, response: HttpResponse<any>): void {
    this.logger.trace(`${RequestCacheService.name}: running putCache`);

    /* clear all caches if anything other than a 200 or 201 response */
    if (
      response.status !== StatusCodes.OK &&
      response.status !== StatusCodes.CREATED
    ) {
      this.logger.trace(
        `${RequestCacheService.name}: response: ${response.status} => clearing cache`,
      );
      this.clearCache();
      return;
    }

    /* exit if not in the cacheable url list */
    if (
      request.urlWithParams !== this.#members &&
      request.urlWithParams !== this.#member &&
      !this.#memberWithId.test(request.urlWithParams)
    ) {
      return;
    }

    /* decide action based on the request method & url */
    switch (request.method) {
      case 'GET': {
        /* set members cache */
        if (request.urlWithParams === this.#members) {
          this.membersCache.setGetAll(response);
        }
        /* set member cache */
        if (this.#memberWithId.test(request.urlWithParams)) {
          this.memberCache.setGetOne(request, response);
        }
        break;
      }

      case 'POST': {
        /* if this is an add member */
        if (request.urlWithParams === this.#member) {
          /* add a member to the members cache */
          this.membersCache.setPostOne(response);
        }
        break;
      }

      case 'PUT': {
        /* if this is a member update */
        if (this.#memberWithId.test(request.urlWithParams)) {
          /* update a member in the members cache and clear the member cache */
          this.membersCache.setPutOne(response);
          this.memberCache.clearCache(request);
        }
        break;
      }

      case 'DELETE': {
        /* if this is a delete member */
        const id = +request.urlWithParams.slice(this.#member.length + 1);
        if (
          this.#memberWithId.test(request.urlWithParams) &&
          id &&
          !isNaN(id)
        ) {
          /* delete a member in the members cache and clear the member cache */
          /* set members cache i.e. delete a member */
          this.membersCache.setDeleteOne(id);
          this.memberCache.clearCache(request);
        }
        break;
      }
      /* all other request types - unexpected */
      default: {
        this.logger.trace(
          `${RequestCacheService.name}: unexpected method => clearing all caches`,
        );
        this.clearCache();
        break;
      }
    }
  }
}
