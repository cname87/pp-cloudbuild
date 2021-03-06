import { Injectable, InjectionToken, Inject } from '@angular/core';
import originalCreateAuth0Client, {
  User,
  GetUserOptions,
  GetTokenSilentlyVerboseResponse,
} from '@auth0/auth0-spa-js';
import Auth0Client from '@auth0/auth0-spa-js/dist/typings/Auth0Client';
import {
  from,
  Observable,
  BehaviorSubject,
  throwError,
  combineLatest,
  of,
} from 'rxjs';
import { tap, catchError, concatMap, shareReplay, map } from 'rxjs/operators';
import { Router } from '@angular/router';
import { NGXLogger } from 'ngx-logger';

import {
  auth0Config,
  errorTypes,
  IErrReport,
  routes,
  userClaims,
} from '../../../configuration/configuration';

/**
 * Auth0 Operation:
 * ---------------
 * 1. An AuthService instance is created which creates...
 * - A public observable to obtain the user authentication status from the authentication utility.  Note: The authentication logged-in status has a timer that will time out as per configured OAuth0 server settings.
 * - A public variable to share the current user authentication status - does not time out by itself.
 * - Public methods to get the user profile, to login, to handle the login call back, & to logout.
 * 2. The app.component ngOnInit calls authService.localAuthSetup().
 * - This results in a call to getAuth0Client() creating a singleton Auth0Client instance, and checks with the server if the user is authenticated and sets the public variable, isLogged, to either false or to the logged-in user profile.
 * 3. If the login prompt is clicked then the Auth0 client instance loginWithRedirect() function is called with a component to call back (CallbackComponent) and a target url parameter that is later passed to the called back component.  The loginWithRedirect function calls the Auth0 server which, on first call, presents a login page to the user, and following receipt of valid credentials, redirects to the CallbackComponent.
 * The CallbackComponent calls a redirect function below which reads the object returned from the Auth0 client. This contains the target url passed to the loginWithRedirect function above then navigates to a route configured in the router for that url.
 * - The Auth0 server response includes a cookie to the client which stores encrypted information allowing silent authentication - the client can determine that the user is logged in without requiring user input. Thus, if a browser is closed and reopened, or if a page is reloaded, a login page does not have to be presented to the user.  An authentication client timer will eventually timeout following which the login page will again be presented to the user.
 * - I confirmed the Roating Token Refresh setting on the oauth0 server which means that the token can be refreshed silently.
 * - The Auth0 server also sends a token which is passed by the client to the backend server to get authorized access the backend API.
 * - The backend server confirms the token with the Auth0 server which sends back the relevant user information, including the configured scopes, to the server. (The token is unique to each user).
 * - See https://auth0.com/docs/flows/authorization-code-flow-with-proof-key-for-code-exchange-pkce for the authorization flow.
 * 4. The isLogged status sets the views E.g. the logout button shows when isLogged is true.
 * 5. Sensitive pages are guarded with a call to the authentication observable - see 1. above.
 * 6. On clicking logout the authentication service is informed and the application is reloaded.
 */

/* inject auth0-spa-js create auth0 client instance function via DI for ease of testing */
type TCreateAuth0Client = (options: any) => Promise<Auth0Client>;
export const CREATE_AUTH0_CLIENT = new InjectionToken<TCreateAuth0Client>(
  'createAuth0Client',
  {
    providedIn: 'root',
    factory: () => originalCreateAuth0Client,
  },
);

interface TUser {
  email: string;
  name: string;
  id: number;
  roles: Array<string>;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  //
  /**
   * Holds the user authentication status:
   * - true if the user has logged in
   * - false if the user is not logged in (or the login has expired)
   */
  public isLoggedIn = false;

  constructor(
    private router: Router,
    private logger: NGXLogger,
    @Inject(CREATE_AUTH0_CLIENT) private createAuth0Client: TCreateAuth0Client,
  ) {
    this.logger.trace(`${AuthService.name}: Starting ${AuthService.name}`);
  }

  /**
   * Creates a singleton observable of the Auth0 client instance.
   * The Auth0 client instance has utility functions (login, logout, etc) and stores the authenticated status in local storage with a setTimeout that expires as set by the Auth0 server settings.
   */
  private auth0Client$ = from(this.createAuth0Client(auth0Config)).pipe(
    shareReplay(1),
    catchError((err: IErrReport) => {
      this.logger.trace(`${AuthService.name}: auth0Client$ catchError called`);
      /* fail with warning */
      err.isHandled = false;
      return throwError(() => err);
    }),
  );

  /**
   * Calls the Auth0 client instance to check whether the user has logged in and been authenticated.  Emits true if authenticated and false if not and sets isLoggedIn to the result.
   * Note: Called initially by the app component and then called by AuthGuard before routing to any sensitive pages, i.e. when the login expires AuthGuard will direct to the login page instead of to the sensitive page.
   */
  public isAuthenticated$ = this.auth0Client$.pipe(
    concatMap((client: Auth0Client) => from(client.isAuthenticated())),
    tap((res) => (this.isLoggedIn = res)),
    catchError((err: IErrReport) => {
      this.logger.trace(
        `${AuthService.name}: isAuthenticated$ catchError called`,
      );
      /* fail with warning */
      err.isHandled = false;
      return throwError(() => err);
    }),
  );

  /**
   * Calls the auth0 client instance handleRedirectCallback function.
   * The client handleRedirectCallback function returns an object with a property called appState, which is the state passed in when the redirect request was made.  This is set in the loginWithRedirect function to contain a property called 'target' holding the target route.
   * Note: Called by the callback component via handleAuthCallback below.
   */
  private handleRedirectCallback$ = this.auth0Client$.pipe(
    /* the client.handleRedirectCallback function queries the url state parameter and will return an invalid state error if it not correct - this can be triggered by the browser back button => just present the login page on error */
    concatMap((client: Auth0Client) => from(client.handleRedirectCallback())),
    catchError((err: IErrReport) => {
      this.logger.trace(
        `${AuthService.name}: handleRedirectCallback$ catchError called`,
      );
      /* fail silently */
      err.isHandled = true;
      /*  error handler will logout (which presents the login page again) */
      err.allocatedType = errorTypes.auth0Redirect;
      return throwError(() => err);
    }),
  );

  /**
   * Broadcasts the user profile to all subscribers.
   * Note: getUser$ must be called during set up to make the user profile is available in userProfileSubject$.
   */
  /* a behaviour subject sends last emitted value to new subscribers and also sends new emitted values to all subscribers */
  private userProfileSubject$ = new BehaviorSubject<User | undefined>(
    undefined,
  );

  public userProfile$ = this.userProfileSubject$.asObservable();

  /**
   * Causes the client instance getUser function to be called returning an observable emitting the user profile.
   */
  private getUser$ = (options?: GetUserOptions): Observable<User> =>
    this.auth0Client$.pipe(
      concatMap((client: Auth0Client) => from(client.getUser(options))),
      /* replace the namespaced properties with simpler names */
      map((user) => {
        if (!user) {
          return throwError(() => new Error('No user returned by Auth0'));
        } else {
          user.id = user[userClaims.id];
          user.roles = user[userClaims.roles];
          return user as TUser;
        }
      }),
      tap((user) => this.userProfileSubject$.next(user)),
      catchError((err: IErrReport) => {
        this.logger.trace(`${AuthService.name}: getUser$ catchError called`);
        /* fail with warning */
        err.isHandled = false;
        return throwError(() => err);
      }),
    );

  /**
   * Sets isLoggedIn to true if the user is authenticated, otherwise it sets isLoggedIn to false.
   * Sets userProfile$ to the user profile if user is authenticated, otherwise it does not modify userProfile$.
   * Note: Called by the app component on app initialization only.
   */
  public localAuthSetup = () => {
    const checkAuth$ = this.isAuthenticated$.pipe(
      concatMap((loggedIn: boolean) => {
        if (loggedIn) {
          return this.getUser$();
        }
        return of(false);
      }),
      catchError((err: IErrReport) => {
        this.logger.trace(`${AuthService.name}: checkAuth$ catchError called`);
        /* fail with warning */
        err.isHandled = false;
        return throwError(() => err);
      }),
    );
    checkAuth$.subscribe((response: User | boolean | undefined) => {
      this.isLoggedIn = !!response;
    });
  };

  /**
   * This is called when when the app reloads after the Auth0 server redirects once the user is authenticated.
   * It subscribes to the piped handleRedirectCallback$ observable, which returns an object containing an appState object, (passed in by loginWithRedirect), which contains the target route property. If this is not found the target route defaults to '/'.
   * userProfile$ and isAuthenticated$ are piped in but not used.
   * Note that '/' is redirected by a guard to a different route depending on whether the user is a manager or a member.
   */
  public handleAuthCallback = () => {
    let appStateTarget = '/';
    const authComplete$ = this.handleRedirectCallback$.pipe(
      tap((cbRes) => {
        appStateTarget = cbRes.appState.target ? cbRes.appState.target : '/';
      }),
      concatMap(() => combineLatest([this.getUser$(), this.isAuthenticated$])),
      catchError((err: IErrReport) => {
        this.logger.trace(
          `${AuthService.name}: handleAuthCallback catchError called`,
        );
        /* fail with warning */
        err.isHandled = false;
        return throwError(() => err);
      }),
    );
    authComplete$.subscribe(([_user, _loggedIn]) => {
      this.router.navigate([appStateTarget]);
    });
  };

  /**
   * Calls the Auth0 client instance loginWithDirect function.  The function is called with an object with a parameter that sets the redirect uri to the callback component.  It also passes an appState property to the callback component, which can be used to set the target route to which the app is ultimately sent.  Here we pass '/' but this is overwritten in the handleAuthCallback function.
   * The client loginWithDirect function presents a login page to the user and redirects the client browser to the redirect uri, (which is the callback component which in turn calls handleAuthCallback.
   * @param redirect_uri: The uri to which auth0 redirects after authentication.
   */
  public login = (
    redirect_uri = `${window.location.origin}/${routes.callback.path}`,
  ) => {
    this.auth0Client$.subscribe(
      (client: Auth0Client) => {
        client.loginWithRedirect({
          redirect_uri,
          appState: { target: '/' },
        });
      },
      (err: IErrReport) => {
        this.logger.trace(`${AuthService.name}: login error called`);
        /* fail with warning */
        err.isHandled = false;
      },
    );
  };

  /**
   * Calls the Auth0 client instance logout function which logs the user out and redirects to the root app page.
   * The logout function is called with an object containing the configured Auth0 application client ID and a returnTo property set to the app uri origin.
   */

  public logout = () => {
    this.auth0Client$.subscribe(
      (client: Auth0Client) => {
        client.logout({
          client_id: auth0Config.client_id,
          returnTo: `${window.location.origin}`,
        });
      },
      (err: IErrReport) => {
        this.logger.trace(`${AuthService.name}: logout error called`);
        /* fail with warning */
        err.isHandled = false;
        throw err;
      },
    );
  };

  /**
   * Calls the Auth0 client instance getTokenSilently function with a supplied options parameter and returns the received token as an observable.
   * @param options: Optional parameter to be supplied to the Auth0 function - see documentation.
   * Note: Called by auth.interceptor to add a token to the request.
   */
  public getTokenSilently$ = (
    options?: any,
  ): Observable<GetTokenSilentlyVerboseResponse> =>
    this.auth0Client$.pipe(
      concatMap((client: Auth0Client) =>
        from(client.getTokenSilently(options)),
      ),
      catchError((err: IErrReport) => {
        this.logger.trace(
          `${AuthService.name}: getTokenSilently$ catchError called`,
        );
        /* fail with warning */
        err.isHandled = false;
        return throwError(() => err);
      }),
    );
}
