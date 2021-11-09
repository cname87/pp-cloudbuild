/**
 * Exports all type extensions and custom types.
 * Custom interfaces and types are exported in a namespace 'Perform'.
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
    user?: Perform.User;
  }
}

declare namespace Perform {
  /* the Server class is the type for instances if the Server class */
  export type Server = import('../server/server').Server;
  /* the Database class is the type for instances of the Database class */
  export type Database = import('../database/src/database').Database;
  /* passed into startDatabase */
  export type DatabaseConstructor =
    typeof import('../database/src/database').Database;
  /* type for database.readystate property */
  export const enum DbReadyState {
    Disconnected = 0,
    Connected = 1,
    Connecting = 2,
    Disconnecting = 3,
  }
  /* the user object */
  export type User = import('../users/user').User;
  /* mongoose model */
  export type TModel = import('mongoose').Model<
    import('mongoose').Document,
    Record<string, unknown>
  >;
  /* used in dumpError utility */
  export type DumpErrorFunction = (
    message?: any,
    ...optionalParams: any[]
  ) => void;

  /* controllers type */
  export interface IControllers {
    [key: string]: import('express').Router;
  }
  /* extend Model to include autoinc resetCounter() */
  export interface IModelExtended extends TModel {
    resetCount: () => void;
    nextCount: () => number;
  }
  interface IModels {
    members: IModelExtended;
    sessions: IModelExtended;
    scores: IModelExtended;
    sessions: IModelExtended;
  }
  /* defines a team member */
  export interface IMember {
    name: string;
    id: number;
  }

  export interface IMemberNoId {
    name: string;
  }

  /* defines a session for a team member */
  export interface ISessionNoId {
    date: string;
    score: number;
    duration: number;
    metric: number;
    memberId: number;
  }
  export interface ISession extends ISessionNoId {
    id: number;
  }

  export enum ScoreType {
    Sleep = 'SLEEP',
    Fatigue = 'FATIGUE',
    Soreness = 'SORENESS',
    Stress = 'STRESS',
    Motivation = 'MOTIVATION',
    Health = 'HEALTH',
    Nutrition = 'NUTRITION',
    Mood = 'MOOD',
  }

  export enum SessionType {
    Strength = 'Strength',
    Conditioning = 'Conditioning',
  }

  type TScore = 0 | 1 | 2 | 3 | 4 | 5;
  type TRpe = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

  interface IScoresColumn {
    item: ScoreType;
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
    type: '' | SessionType;
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

  interface ISummaryItem {
    date: string;
    total: number;
  }

  export type TSummary = Array<ISummaryItem>;

  /* extra fields for created errors */
  /* Error: 'name' is mandatory, 'message' is optional */
  export interface IErr extends Error {
    /* set true to show that the error has been dumped already */
    dumped?: boolean;
    /* add a http status code on creation, which is later written into the http response */
    statusCode?: number;
  }

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
    scoresApi: typeof import('../api/scores-api').scoresApi;
    sessionsApi: typeof import('../api/sessions-api').sessionsApi;
    summaryApi: typeof import('../api/summary-api').summaryApi;
  }

  export interface IAppLocals {
    /* created http(s) servers */
    servers: Server[];
    controllers: IControllers;
    membersApi: typeof import('../api/members-api').membersApi;
    handlers: IHandlers;
    models: IModels;
    createModelMembers: typeof import('../models/src/members-model').createModelMembers;
    createModelScores: typeof import('../models/src/scores-model').createModelScores;
    createModelSessions: typeof import('../models/src/sessions-model').createModelSessions;
    /* database instance */
    database: Perform.Database;
    /* database connection */
    dbConnection: import('mongoose').Connection;
    /* error dump utility */
    dumpError: DumpErrorFunction;
    /* event emitter used for test */
    event: import('events').EventEmitter;
  }
}
