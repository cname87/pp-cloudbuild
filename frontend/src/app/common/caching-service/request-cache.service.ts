import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';
import { StatusCodes } from 'http-status-codes';

import { apiConfiguration } from '../../data-providers/configuration';
import { GetMembersCache } from './get-members-cache.service';
import { GetMemberCache } from './get-member-cache.service';

@Injectable({ providedIn: 'root' })
export class RequestCacheService {
  private _members = `${apiConfiguration.basePath}/${apiConfiguration.membersPath}`;
  /* Note: must match 'members/1' but not 'members/1/sessions' */
  private _memberRegex = new RegExp(this._members + `\/[1-9]\d*$`);
  private _cacheServices = [this.membersCache, this.memberCache];

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
  public clearCache(cache?: GetMembersCache): void {
    this.logger.trace(`${RequestCacheService.name}: running clearCache`);
    if (!cache) {
      this._cacheServices.forEach((cache) => cache.clearCache());
    } else {
      cache.clearCache();
    }
  }

  /**
   * Called by a http interceptor asking for a cached http response to a http request. It will only match to a specific url which is 'api-v1/members'
   * @param request: The http interceptor sends in the request for which a cached response is required.
   * @returns
   * - Returns a cached http response if it has one.
   * - Returns undefined if there is no cached response.
   */
  public getCache(request: HttpRequest<any>): HttpResponse<any> | undefined {
    this.logger.trace(`${RequestCacheService.name}: running getCache`);
    /* return cache for get all members */
    if (request.method === 'GET' && request.urlWithParams === this._members) {
      return this.membersCache.response;
    }
    /* return cache for get one member */
    if (
      request.method === 'GET' &&
      this._memberRegex.test(request.urlWithParams) &&
      /**
       * TODO Extend getMember cache so it stores Requests - currently it returns the same member even if you switch members on the list page
       */
      false
    ) {
      return this.memberCache.response;
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
  public putCache(
    request: HttpRequest<any>,
    response: HttpResponse<any>,
  ): void {
    this.logger.trace(`${RequestCacheService.name}: running putCache`);

    /* clear all caches if anything other than a 200 or 201 response */
    if (
      response.status !== StatusCodes.OK &&
      response.status !== StatusCodes.CREATED
    ) {
      this.clearCache();
      return;
    }

    /* decide action based on the request method & url */
    switch (request.method) {
      case 'GET': {
        /* set members cache */
        if (request.urlWithParams === this._members) {
          this.membersCache.setGetAll(response);
        }
        /* set member cache */
        if (this._memberRegex.test(request.urlWithParams)) {
          this.memberCache.setGetAll(response);
        }
        /* don't set any cache for any other GET */
        break;
      }

      case 'POST': {
        /* set members cache, i.e. add a member */
        if (request.urlWithParams === this._members) {
          this.membersCache.setPostOne(response);
        } else {
          /* clear all caches */
          this.clearCache();
        }
        break;
      }

      case 'PUT': {
        /* set members cache, i.e. update a member */
        if (request.urlWithParams === this._members) {
          this.membersCache.setPutOne(response);
        } else {
          /* clear all caches */
          this.clearCache();
        }
        break;
      }

      case 'DELETE': {
        /* set members cache i.e. delete a member */
        const id = +request.urlWithParams.slice(this._members.length + 1);
        if (request.urlWithParams === this._members && id && !isNaN(id)) {
          /* if id != 0 and is a number */
          this.membersCache.setDeleteOne(request);
        } else {
          /* clear all caches */
          this.clearCache();
        }
        break;
      }
      /* all other request types */
      default: {
        /* clear all caches */
        this.clearCache();
        break;
      }
    }
  }
}
