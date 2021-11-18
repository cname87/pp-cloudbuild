import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';
import { IMember } from '../../models/models';

/**
 * This service provides a cache holding the response to a get all members request that matches the content of the server.  The stored response is updated as responses to any requests that change the it's state are received.  This cache is triggered by a http interceptor so get all members requests are always served out of cache rather than incurring a server request.
 */

@Injectable({ providedIn: 'root' })
export class GetMembersCache {
  /* holds the cached response - starts undefined */
  #response: HttpResponse<IMember[]> | undefined = undefined;

  constructor(private logger: NGXLogger) {
    this.logger.trace(`${GetMembersCache.name}: Starting GetMembersCache`);
  }

  /**
   * Gets the cached response.
   */
  get response(): HttpResponse<IMember[]> | undefined {
    return this.#response;
  }

  /**
   * Clears the cache by setting the cached response to undefined.
   */
  clearCache(): void {
    this.logger.trace(`${GetMembersCache.name}: running clearCache`);
    this.#response = undefined;
  }

  /**
   * Sets the cached response from a get /members response.
   * It copies the response to the cache.
   * @param getAllResponse
   * - The response from an earlier get /members request.
   */
  setGetAll(getAllResponse: HttpResponse<[IMember]>) {
    this.#response = getAllResponse;
  }

  /**
   * Sets the cached response from a post (add) /members request.
   * It gets the added member from the provided response and adds to the cached response.
   * @param postOneResponse
   * - The uncached response from an earlier post /members request.
   */
  setPostOne(postOneResponse: HttpResponse<IMember>) {
    if (this.#response?.body && postOneResponse?.body) {
      /* get the member to add from the request body */
      const addedMember: IMember = postOneResponse.body;
      /* get the current members array from the cached get /members response body */
      const cachedBody: IMember[] = this.#response.body;
      /* create the new cached body by adding the member */
      cachedBody.push(addedMember);
      /* clone the cached response replacing the body */
      const newCachedResponse = this.#response.clone({
        body: cachedBody,
      });
      /* set the cached response */
      this.#response = newCachedResponse;
    } else {
      /* set to undefined if cached body or supplied response body not present */
      this.clearCache();
    }
  }

  /**
   * Sets the cached response from a put (update) /members request.
   * It gets the updated member from the provided response and updates to the cached response.
   * @param putOneResponse
   * - The uncached response from an earlier put /members request.
   */
  setPutOne(putOneResponse: HttpResponse<IMember>) {
    if (this.#response?.body && putOneResponse?.body) {
      /* get the member to update from the request body */
      const updatedMember: IMember = putOneResponse.body;
      /* get the current members array from the cached getMembers response body */
      const cachedBody: IMember[] = this.#response.body;
      /* get the index of the member to update */
      const index = cachedBody.findIndex((m) => m.id === updatedMember.id);
      /* exit if updated member if not found */
      const notFound = -1;
      if (index === notFound) {
        this.clearCache();
        return;
      }
      /* update the member (without changing its position) */
      cachedBody[index] = updatedMember;
      /* clone the cached response replacing the body */
      const newCachedResponse = this.#response.clone({
        body: cachedBody,
      });
      /* set the cached response */
      this.#response = newCachedResponse;
    } else {
      /* set to undefined if cached response or body not present */
      this.clearCache();
    }
  }

  /**
   * Sets the cached response from a delete members/id request.
   * It gets the deleted member index from the provided response url and deletes that member in the cached response.
   * @param deleteRequest
   * - The uncached response from an earlier delete members/id request.
   */
  setDeleteOne(deletedMemberId: number) {
    if (this.#response?.body) {
      /* get the current members array from the cached getMembers response */
      let cachedBody: IMember[] = this.#response.body;
      /* test that the member to delete exists */
      const index = cachedBody.findIndex((m) => m.id === deletedMemberId);
      /* set cache to undefined if deleted member is not found */
      const notFound = -1;
      if (index === notFound) {
        this.clearCache();
        return;
      }
      /* create the new cached body by deleting the member */
      cachedBody = cachedBody.filter((m) => m.id !== deletedMemberId);
      /* clone the cached response replacing the body */
      const newCachedResponse = this.#response.clone({
        body: cachedBody,
      });
      /* set the cached response */
      this.#response = newCachedResponse;
    } else {
      /* set to undefined if cached response or body not present */
      this.clearCache();
    }
  }
}
