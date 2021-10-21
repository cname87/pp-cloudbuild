import { HttpErrorResponse } from '@angular/common/http';
import { InjectionToken } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';

import { environment } from '../../environments/environment';

/* auth0 application configuration */
export const auth0Config = {
  domain: 'projectperform.eu.auth0.com',
  client_id: 'GNnNi0E0Bg5F3jAuFkDhKULWVgv3S21I',
  redirect_uri: `${window.location.origin}/callback`,
  audience: `${environment.apiUrl}`,
  /* avoids issues with browsers that block 3rd party cookies */
  useRefreshTokens: true,
  /* provides persistence across page refreshes and browser tabs */
  /**
   * * Security risk iff an attacker can achieve running JavaScript in the SPA using a cross-site scripting (XSS) attack, they can retrieve the tokens stored in local storage. Consider deleting. The user would have to click the log in button after browser refreshes. Note that e2e tests would fail.
   */
  cacheLocation: 'localstorage',
};

/* nav bar elements */
const membersList = {
  path: 'memberslist',
  displayName: 'MEMBERS',
};
const member = {
  path: 'member',
  displayName: 'MY DETAIL',
};
const scores = {
  path: 'scores',
  displayName: 'SCORES',
};
const sessions = {
  path: 'sessions',
  displayName: 'SESSIONS',
};
const summary = {
  path: 'summary',
  displayName: 'SUMMARY',
};

/* other routing elements */
const loginPage = {
  path: '/information/login',
};
const errorPage = {
  path: '/information/error',
};
const callback = {
  path: 'callback',
};
export const routes = {
  membersList,
  member,
  scores,
  sessions,
  summary,
  loginPage,
  errorPage,
  callback,
};

/* import to access variable that informs if E2e build in use */
/* NOTE: app.module provider uses value environment.e2etesting */
export const E2E_TESTING = new InjectionToken<boolean>('e2e_testing');

/* interface for bug report thrown from members.service */
export interface IErrReport {
  /* the handled error is always stored here */
  error: HttpErrorResponse;
  /* every handled error will have allocatedType set */
  allocatedType: errorTypes;
  /*  set true if user is informed etc => errorHandlerService will not send error message etc */
  isHandled?: boolean;
}

/* handled error types */
export const enum errorTypes {
  httpClientSide,
  httpServerSide,
  auth0Redirect,
  notAssigned,
}

/* test urls for E2eTestInterceptor */
export const errorTestUrls = {
  /* first test get members that match a search term */
  getAll: 'GET:api-v1/members?name=error',
  /* then go to members list page */
  /* try delete member 10 */
  delete: 'DELETE:api-v1/members/10',
  /* then try add a member */
  post: 'POST:api-v1/members',
  /* then try get the member detail page for member 10 */
  getOne: 'GET:api-v1/members/10',
  /* then go to membersList page and go to member 9 without error and try update member 9 */
  put: 'PUT:api-v1/members',
};

/* dummy member for e2e error testing */
/* used in errors.e2e-spec.ts */
export const errorMember = {
  id: 10,
  name: 'errorName',
};

/* dummy get members search term for e2e error testing */
export const errorSearchTerm = 'errorSearchTerm';

/* cache timeout in ms */
export const maxAge = 300000;

export interface IUserProfile {
  name: string;
  email: string;
}

/**
 * Configuration object for members, sessions and questionaires service.
 */

interface IConfigurationParameters {
  basePath: string;
  membersPath: string;
  sessionsPath: string;
  questionairesPath: string;
  scoresPath: string;
  sessions2Path: string;
  defaultHeaders: HttpHeaders;
  withCredentials?: boolean;
}
class Configuration {
  /* note that the same server is assumed e.g. the basePath is added to localhost:8080 or whatever the host domain that is running */
  basePath: string;
  membersPath: string;
  sessionsPath: string;
  questionairesPath: string;
  scoresPath: string;
  sessions2Path: string;
  defaultHeaders: HttpHeaders;
  /* indicates whether or not cross-site Access-Control requests should be made using credentials - defaults to false */
  withCredentials?: boolean;

  constructor(configurationParameters: IConfigurationParameters) {
    this.basePath = configurationParameters.basePath;
    this.membersPath = configurationParameters.membersPath;
    this.sessionsPath = configurationParameters.sessionsPath;
    this.questionairesPath = configurationParameters.questionairesPath;
    this.scoresPath = configurationParameters.scoresPath;
    this.sessions2Path = configurationParameters.sessions2Path;
    this.defaultHeaders = configurationParameters.defaultHeaders;
    this.withCredentials = configurationParameters.withCredentials;
  }
}

let defaultHeaders = new HttpHeaders();
/* set what content we will accept back */
defaultHeaders = defaultHeaders.set('Accept', 'application/json');
/* set what content is being sent */
defaultHeaders = defaultHeaders.set('Content-Type', 'application/json');

export const apiConfiguration = new Configuration({
  basePath: 'api-v1',
  membersPath: 'members',
  sessionsPath: 'sessions',
  questionairesPath: 'questionaires',
  scoresPath: 'scores',
  sessions2Path: 'sessions',
  defaultHeaders,
  withCredentials: false,
});

/* the namespaced names for the user claims as set in the Auth0 Actions that set each user's id and roles after user login */
export const userClaims = {
  id: 'https://project-perform.com/id',
  roles: 'https://project-perform.com/roles',
};

/* roles set on Auth0 platform */
export const roles = {
  member: 'Member',
  admin: 'Team Owner',
  test: 'Test Owner',
};
