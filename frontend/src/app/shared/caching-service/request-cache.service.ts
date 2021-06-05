import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';
import { StatusCodes } from 'http-status-codes';

// import { maxAge } from '../../config';
import { apiConfiguration } from '../../data-providers/configuration';
import { GetMembersCache } from './get-members-cache.service';

@Injectable({ providedIn: 'root' })
export class RequestCacheService {
  private baseUrl = `${apiConfiguration.basePath}/${apiConfiguration.membersPath}`;

  constructor(
    private membersCache: GetMembersCache,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      `${RequestCacheService.name}: Starting RequestCacheService`,
    );
  }

  /**
   * Called to clear the getMembers request cache.
   * @returns void
   */
  public clearCache(): void {
    this.logger.trace(`${RequestCacheService.name}: running clearCache`);
    this.membersCache.clearCache();
  }

  /**
   * Called by a http interceptor asking for a cached http response to a http request. It will only match to a specific url (this.baseUrl) which is 'api-v1/members'
   * @param request: The http interceptor sends in the request for which a cached response is required.
   * @returns
   * - Returns a cached http response if it has one.
   * - Returns undefined if there is no cached response.
   */
  public getCache(request: HttpRequest<any>): HttpResponse<any> | undefined {
    this.logger.trace(`${RequestCacheService.name}: running getCache`);
    /* return cache for /members, i.e. get all members */
    if (request.method === 'GET' && request.urlWithParams === this.baseUrl) {
      return this.membersCache.response;
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

    /* clear cache if anything other than a 200 or 201 response */
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
        /* set cache, i.e.store  get all members */
        if (request.urlWithParams === this.baseUrl) {
          this.membersCache.setGetAll(response);
        }
        /* don't change cache for any other GET */
        break;
      }

      case 'POST': {
        /* set cache, ie. add a member */
        if (request.urlWithParams === this.baseUrl) {
          this.membersCache.setPostOne(response);
        } else {
          this.clearCache();
        }
        break;
      }

      case 'PUT': {
        /* set cache, ie. update a member */
        if (request.urlWithParams === this.baseUrl) {
          this.membersCache.setPutOne(response);
        } else {
          this.clearCache();
        }
        break;
      }

      case 'DELETE': {
        const id = +request.urlWithParams.slice(this.baseUrl.length + 1);
        if (request.urlWithParams === this.baseUrl && id && !isNaN(id)) {
          /* if id != 0 and is a number */
          this.membersCache.setDeleteOne(request);
        } else {
          this.clearCache();
        }
        break;
      }
      /* all other request types */
      default: {
        /* otherwise clear the cache */
        this.clearCache();
        break;
      }
    }
  }
}
