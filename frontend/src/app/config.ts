import { HttpErrorResponse } from '@angular/common/http';
import { InjectionToken } from '@angular/core';

import { environment } from '../environments/environment';

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
   * * Security risk - consider deleting. The user would have to click the log in button after browser refreshes.  Note that e2e tests would fail.
   */
  cacheLocation: 'localstorage',
};

/* nav bar elements */
const membersList = {
  path: 'memberslist',
  displayName: 'MEMBERS',
};
const detail = {
  path: 'detail',
  displayName: 'MEMBER DETAIL',
};
const session = {
  path1: 'member',
  path2: 'session',
  displayName: 'SESSION ENTRY',
};
const sessions = {
  path: 'sessions',
  displayName: 'SESSIONS',
};
const charts = {
  path: 'charts',
  displayName: 'CHARTS',
};

/* other routing elements */
const profile = {
  path: 'profile',
};
const loginPage = {
  path: '/information/login',
};
const errorPage = {
  path: '/information/error',
};
const loginTarget = {
  path: '/memberslist',
};
const callback = {
  path: '/callback',
};
export const routes = {
  membersList,
  detail,
  session,
  sessions,
  charts,
  profile,
  loginPage,
  errorPage,
  loginTarget,
  callback,
};

/* import to access variable that informs if E2e build in use */
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
