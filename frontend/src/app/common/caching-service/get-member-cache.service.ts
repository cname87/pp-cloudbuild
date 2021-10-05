import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { NGXLogger } from 'ngx-logger';
import { IMember } from '../../data-providers/models/models';

/**
 * This service provides a cache holding the response to a get one member request that matches the content of the server.  The stored response is cleared if ever a member request other than a GET request is sent.  This cache is triggered by a http interceptor so get all get member requests are served out of cache, if there is a hot, rather than incurring a server request.
 */

@Injectable({ providedIn: 'root' })
export class GetMemberCache {
  /* holds the cached response - starts undefined */
  private _response: HttpResponse<IMember> | undefined = undefined;

  constructor(private logger: NGXLogger) {
    this.logger.trace(`${GetMemberCache.name}: Starting GetMemberCache`);
  }

  /**
   * Gets the cached response.
   */
  get response(): HttpResponse<IMember> | undefined {
    return this._response;
  }

  /**
   * Clears the cache by setting the cached response to undefined.
   */
  clearCache(): void {
    this.logger.trace(`${GetMemberCache.name}: running clearCache`);
    this._response = undefined;
  }

  /**
   * Sets the cached response from a get member response.
   * It copies the response to the cache.
   * @param getMemberResponse
   * - The response from an earlier get member request.
   */
  setGetAll(getMemberResponse: HttpResponse<IMember>) {
    this.logger.trace(
      `${GetMemberCache.name}: putting ${JSON.stringify(
        getMemberResponse.body,
      )} into the cache`,
    );
    this._response = getMemberResponse;
  }
}
