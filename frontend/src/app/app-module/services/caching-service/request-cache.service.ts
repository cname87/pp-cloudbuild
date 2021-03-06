import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse } from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';
import { StatusCodes } from 'http-status-codes';

import { apiConfiguration } from '../../../configuration/configuration';
import { GetMembersCache } from './get-members-cache.service';
import { GetMemberCache } from './get-member-cache.service';
import { GetScoresCache } from './get-scores-cache.service';
import { GetSessionsCache } from './get-sessions-cache.service';
import { GetSummaryCache } from './get-summary-cache.service';

@Injectable({ providedIn: 'root' })
export class RequestCacheService {
  //
  #members = `${apiConfiguration.basePath}/${apiConfiguration.membersPath}`;
  #member = `${apiConfiguration.basePath}/${apiConfiguration.memberPath}`;
  /* Note: must match 'member/1' but not 'member/1/sessions' */
  #memberWithId = new RegExp(this.#member + `\/[1-9]\\d*$`);
  #scores = `${apiConfiguration.scoresPath}`;
  #scoresWithId = new RegExp(this.#member + `\/[1-9]\\d*\/${this.#scores}`);
  #sessions = `${apiConfiguration.sessionsPath}`;
  #sessionsWithId = new RegExp(this.#member + `\/[1-9]\\d*\/${this.#sessions}`);
  #summary = `${apiConfiguration.summaryPath}`;
  #summaryWithId = new RegExp(this.#member + `\/[1-9]\\d*\/${this.#summary}`);

  #cacheServices = [
    this.membersCache,
    this.memberCache,
    this.scoresCache,
    this.sessionsCache,
    this.summaryCache,
  ];

  constructor(
    private membersCache: GetMembersCache,
    private memberCache: GetMemberCache,
    private scoresCache: GetScoresCache,
    private sessionsCache: GetSessionsCache,
    private summaryCache: GetSummaryCache,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      `${RequestCacheService.name}: Starting RequestCacheService`,
    );
  }

  /**
   * Called to clear a specific cache fully. If no cache service is passed in then all caches are cleared.
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
    /* return cache for get or create a scores table */
    if (
      request.method === 'POST' &&
      this.#scoresWithId.test(request.urlWithParams)
    ) {
      return this.scoresCache.getCache(request);
    }
    /* return cache for get or create a sessions table */
    if (
      request.method === 'POST' &&
      this.#sessionsWithId.test(request.urlWithParams)
    ) {
      return this.sessionsCache.getCache(request);
    }
    /* return cache for get a summary table */
    if (
      request.method === 'GET' &&
      this.#summaryWithId.test(request.urlWithParams)
    ) {
      return this.summaryCache.getCache(request);
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

    /* decide action based on the request method & url */
    switch (request.method) {
      case 'GET': {
        /* set members cache */
        if (request.urlWithParams === this.#members) {
          this.membersCache.setGetAll(response);
        }
        /* set member cache */
        if (this.#memberWithId.test(request.urlWithParams)) {
          this.memberCache.setGet(request, response);
        }
        /* set summary cache */
        if (this.#summaryWithId.test(request.urlWithParams)) {
          this.summaryCache.setGet(request, response);
        }
        break;
      }

      case 'POST': {
        /* if this is an add member */
        if (request.urlWithParams === this.#member) {
          /* add a member to the members cache */
          this.membersCache.setPost(response);
        }
        /* if this is a get or create scores table */
        if (this.#scoresWithId.test(request.urlWithParams)) {
          /* add a scores table  to the scores cache */
          this.scoresCache.setGetOrPost(request, response);
        }
        /* if this is a get or create sessions table */
        if (this.#sessionsWithId.test(request.urlWithParams)) {
          /* add a sessions table  to the sessions cache */
          this.sessionsCache.setGetOrPost(request, response);
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
        /* if this is an update scores table */
        if (this.#scoresWithId.test(request.urlWithParams)) {
          /* add an updated table to the scores cache */
          this.scoresCache.setPutOne(request, response);
          /* clear the summary cache for that member */
          this.summaryCache.clearCache(request);
        }
        /* if this is an update sessions table */
        if (this.#sessionsWithId.test(request.urlWithParams)) {
          /* add an updated table to the sessions cache */
          this.sessionsCache.setPutOne(request, response);
          /* clear the summary cache for that member */
          this.summaryCache.clearCache(request);
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
          `${RequestCacheService.name}: unexpected http method => clearing all caches`,
        );
        this.clearCache();
        break;
      }
    }
  }
}
