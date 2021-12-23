/**
 * Exports all type extensions and custom types.
 * General custom interfaces and types are exported in a namespace 'Perform'.
 * Custom interfaces and types related to the Summary data array and exported in a namespace 'Summary'.
 */

declare module 'intercept-stdout';
declare module 'http-shutdown';

/* extension of Express Request to support appLocals, uuid and the Auth0 auth parameter returned by express-jwt */
declare namespace Express {
  export interface Application {
    appLocals: Perform.IAppLocals;
  }
  export interface Request {
    id?: string;
    auth?: {
      sub: string;
      permissions: string[];
    };
    user?: Perform.TUser;
  }
}

declare namespace Perform {
  /* the Server class is the type for instances if the Server class */
  export type TServer = import('../server/server').Server;
  /* the Database class is the type for instances of the Database class */
  export type TDatabase = import('../database/src/database').Database;
  /* passed into startDatabase */
  export type TDatabaseConstructor =
    typeof import('../database/src/database').Database;
  /* type for database.readystate property */
  export const enum EDbReadyState {
    Disconnected = 0,
    Connected = 1,
    Connecting = 2,
    Disconnecting = 3,
  }
  /* the user object */
  export type TUser = import('../users/user').User;
  /* mongoose model */
  export type TModel = import('mongoose').Model<any>;

  /* extend Model to include autoinc resetCounter() */
  export interface IModelExtended extends TModel {
    resetCount: () => void;
    nextCount: () => number;
  }
  /* used in dumpError utility */
  export type TDumpErrorFunction = (
    message?: any,
    ...optionalParams: any[]
  ) => void;
  /* controllers interface */
  export interface IControllers {
    [key: string]: import('express').Router;
  }
  /* models interface */
  interface IModels {
    members: TModel;
    activity: TModel;
    scores: TModel;
    sessions: TModel;
  }
  /* misc functions */
  export type TSigint = (signal?: string) => Promise<void>;
  export type TUncaught = (err: any) => Promise<void>;
  /* create type for the app.ts export (for mocha) */
  export interface IServerIndex {
    debug?: any; // see notes
    appLocals: IAppLocals;
    sigint: TSigint;
    uncaughtException: TUncaught;
    unhandledRejection: NodeJS.UnhandledRejectionListener;
  }
  /* handlers object */
  export interface IHandlers {
    membersHandlers: typeof import('../handlers/members-handlers').membersHandlers;
    activityHandlers: typeof import('../handlers/activity-handlers').activityHandlers;
    scoresHandlers: typeof import('../handlers/scores-handlers').scoresHandlers;
    sessionsHandlers: typeof import('../handlers/sessions-handlers').sessionsHandlers;
    summaryHandlers: typeof import('../handlers/summary-handlers').summaryHandlers;
    miscHandlers: typeof import('../handlers/misc-handlers').miscHandlers;
    errorHandlers: typeof import('../handlers/error-handlers').errorHandlers;
    authenticateHandler: typeof import('../handlers/authenticate-handlers').authenticateHandler;
    dbAuthorizeHandler: typeof import('../handlers/authorize-handlers').dbAuthorizeHandler;
    managerAuthorizeHandler: typeof import('../handlers/authorize-handlers').managerAuthorizeHandler;
    memberAuthorizeHandler: typeof import('../handlers/authorize-handlers').memberAuthorizeHandler;
    membersApi: typeof import('../api/members-api').membersApi;
    activityApi: typeof import('../api/activity-api').activityApi;
    scoresApi: typeof import('../api/scores-api').scoresApi;
    sessionsApi: typeof import('../api/sessions-api').sessionsApi;
    summaryApi: typeof import('../api/summary-api').summaryApi;
  }

  /* applocals object */
  export interface IAppLocals {
    /* created http(s) servers */
    servers: TServer[];
    controllers: IControllers;
    membersApi: typeof import('../api/members-api').membersApi;
    handlers: IHandlers;
    models: IModels;
    createModelMembers: typeof import('../models/src/members-model').createModelMembers;
    createModelActivities: typeof import('../models/src/activity-model').createModelActivities;
    createModelScores: typeof import('../models/src/scores-model').createModelScores;
    createModelSessions: typeof import('../models/src/sessions-model').createModelSessions;
    /* database instance */
    database: Perform.TDatabase;
    /* database connection */
    dbConnection: import('mongoose').Connection;
    /* error dump utility */
    dumpError: TDumpErrorFunction;
    /* event emitter used for test */
    event: import('events').EventEmitter;
  }

  /* extra fields for created errors */
  /* Error: 'name' is mandatory, 'message' is optional */
  export interface IErr extends Error {
    /* set true to show that the error has been dumped already */
    dumped?: boolean;
    /* add a http status code on creation, which is later written into the http response */
    statusCode?: number;
  }

  /** Team member types */

  export interface IMemberNoId {
    name: string;
  }
  export interface IMember extends IMemberNoId {
    id: number;
  }

  type TActivityType = '' | 'BOXING' | 'FLOOR' | 'RUN' | 'WALK';

  export interface IActivityNoId {
    memberId: number;
    date: Date | string; // using string to send to frontend
    type: TActivityType;
    duration: number;
    comment: string;
  }

  export interface IActivity extends IActivityNoId {
    id: number;
  }

  type TScore = 0 | 1 | 2 | 3 | 4 | 5;
  type TRpe = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

  interface IScoresColumn {
    item: EScoreType;
    monday: TScore;
    tuesday: TScore;
    wednesday: TScore;
    thursday: TScore;
    friday: TScore;
    saturday: TScore;
    sunday: TScore;
  }

  export interface IScoresWithoutId {
    memberId: number;
    date: Date | string; // using string to send to frontend
    scores: IColumn[];
  }

  export interface IScores extends IScoresWithoutId {
    id: number;
  }
  interface ISessionsColumn {
    type: '' | ESessionType;
    rpe: TRpe;
    duration: number;
  }

  export interface ISessionsWithoutId {
    memberId: number;
    date: Date | string; // using string to send to frontend
    sessions: ISessionsColumn[];
  }

  export interface ISessions extends ISessionsWithoutId {
    id: number;
  }
}

declare namespace Summary {
  /** Summary types */

  interface ISummaryItem {
    date: Date | string;
  }
  export interface IScoresSummaryItem extends ISummaryItem {
    scoresTotal: number;
  }

  export interface ISessionsSummaryItem extends ISummaryItem {
    sessionsTotal: number;
    count: number;
    average: number;
    stdDev: number;
  }

  export type TScoresSummaryItems = Array<IScoresSummaryItem>;
  export type TSessionsSummaryItems = Array<ISessionsSummaryItem>;

  export type TDateData = string[];
  export type TValueData = [string, ...number[]];
  export type TSummary = [
    TDateData,
    TValueData,
    TValueData,
    TValueData,
    TValueData,
    TValueData,
    TValueData,
    TValueData,
    TValueData,
  ];
}
