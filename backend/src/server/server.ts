/**
 * This module holds the http(s) server operations.
 * It provides the following functions:
 * setupServer:
 * Creates a http/https server with supplied options.
 * listenServer:
 * Sets the supplied server listening on a supplied port.
 * stopServer:
 * Stops the supplied server.
 */

import http from 'http';
import shutdownHelper from 'http-shutdown';
import { setupDebug } from '../utils/src/debugOutput';

const { modulename, debug } = setupDebug(__filename);

/**
 * @description
 * Sets up a configured http(s) server.
 * @param serverType
 * http or https object.
 * @param serverOptions
 * An object holding server configuration options.
 * @param app
 * Express app object.
 * @returns
 * It returns a http(s) server object.
 * The server object has the following added keys:
 * - name: the supplied name is stored here.
 * - listenErrors: holder for the listen errors allowed.
 */

function setupServer(
  this: any,
  serverType: typeof http,
  serverOptions: http.ServerOptions,
  app: http.RequestListener,
) {
  debug(`${modulename}: running setupServer`);

  /* start and return the http(s) server & load express as listener */
  this.expressServer = serverType.createServer(serverOptions, app);

  /* wrap extra shutdown functionality into server to avoid shutdown issues when debug inspector listening */
  this.expressServer = shutdownHelper(this.expressServer);

  /* store a count of the number server listen errors allowed */
  this.listenErrors = 0;

  debug(`${modulename}: server.expressServer ${this.name} created`);
  return this.expressServer;
}

/**
 * Starts the server listening on the supplied port.
 * Will prompt a supplied number of times (default 3)
 * at a supplied interval (default 5s) if the supplied
 * port is occupied.
 * @param serverPort
 * The port that the server will listen on.
 * @param listenTries 3
 * The total number of listen tries made.
 * Retries are only made if the port is occupied.
 * @param listenTimeout 5
 * The time in seconds allowed between each retry.
 * @returns
 * Returns a promise.
 * Resolves to a listening server object if successful.
 * The supplied server object is changed into a listening
 * server object.
 * Returns void if the listen request fails.
 * @throws
 * Throws an error if the listen request fails.
 * (Note: If supplied with a listening server, it will stop
 * the server, but start and return a listening server with
 * no error).
 */
async function listenServer(
  this: any,
  serverPort: number,
  listenTries = 3,
  listenTimeout = 5,
) {
  debug(`${modulename}: running listenServer`);

  async function listenCallback(
    this: any,
    resolve: (x: any) => void,
    reject: (x: Perform.IErr) => void,
  ) {
    debug(`${modulename}: running listenCallback`);

    function listenHandler(this: any) {
      /* remove the unused error handle */
      // eslint-disable-next-line @typescript-eslint/no-use-before-define
      this.expressServer.removeListener('error', errorHandler);
      const host = this.expressServer.address().address;
      const { port } = this.expressServer.address();
      debug(`${modulename}: ${this.name} server listening on ${host}:${port}`);
      resolve(this.expressServer);
    }

    async function errorHandler(this: any, err: any) {
      /* if an occupied port is reported then allow time for port to be freed then try again */
      if (err.code === 'EADDRINUSE') {
        /* remove the unused listening handle */
        this.expressServer.removeListener('listening', listenHandler);
        this.listenErrors++;
        if (this.listenErrors < listenTries) {
          console.error(
            `${modulename}: Port ` +
              `${serverPort} is in use following attempt ` +
              `${this.listenErrors} of ` +
              `${listenTries} - retrying in ${listenTimeout}s`,
          );
          setTimeout(
            listenCallback.bind(this),
            listenTimeout * 1000,
            resolve,
            reject,
          );
        } else {
          /* we have retried the configured number of times */
          console.error(
            `${modulename}: Port ` +
              `${serverPort} is still in use following ` +
              `${listenTries} attempts` +
              ' - reporting error and shutting down',
          );
          reject(err);
        }
      } else {
        /* all other reported errors are immediately fatal */
        console.error(
          `${modulename}: Server listen error other than EADDRINUSE`,
        );
        reject(err);
      }
    }

    /* if listen request successful then handled here */
    this.expressServer.once('listening', listenHandler.bind(this));

    /* if listen error reported then handled here */
    this.expressServer.once('error', errorHandler.bind(this));

    /* ask the server to listen and trigger event */
    this.expressServer.listen({
      port: serverPort,
    });
  }

  try {
    /* only ask to listen if the server is not already listening */
    if (!this.expressServer.listening) {
      return await new Promise(listenCallback.bind(this));
    }
    return;
  } catch (err) {
    console.error(`${modulename}: Unrecoverable server listen error`);
    this.dumpError(err);
    throw err;
  }
}

/**
 * Stops a http(s) server.
 * @returns
 * Returns a resolved promise:
 * Resolves to undefined if successful.
 * Resolves to an error if the server passed in
 * was not open, or if another shutdown error occurred.
 * (Note: The error is returned and not thrown).
 */
async function stopServer(this: any) {
  debug(`${modulename}: running stopServer`);

  function shutServer(
    this: any,
    resolve: (x: any) => void,
    reject: (x: Perform.IErr) => void,
  ) {
    this.expressServer.shutdown((err: any) => {
      if (err) {
        debug(`${modulename}: server \'${this.name}\' shut down error`);
        reject(err);
      }

      debug(`${modulename}: server connection ` + `\'${this.name}\' closed`);
      resolve(err);
    });
  }

  try {
    debug(`${modulename}: stopping server ${this.name}`);
    return await new Promise(shutServer.bind(this));
  } catch (err) {
    const message = ': error running stopServer';
    console.error(modulename + message);
    this.dumpError(err);
    return err;
  }
}

/**
 * Called to pass in configuration data.
 * Also optionally passes in an error logging function.
 * @param name
 * can be used to identify the server, e.g. 'http' or 'https'
 * @param dumpError
 * A utility that takes an Error object as argument and logs it.
 * Defaults to console.error.
 */
function configureServer(this: any, name = '', dumpError = console.error) {
  this.name = name;
  this.dumpError = dumpError;
}

/**
 * The exported server class.
 */
export class Server {
  public name: string;

  public dumpError: Perform.TDumpErrorFunction;

  public listenErrors: number;

  public expressServer: http.Server;

  public setupServer: (...params: any) => any;

  public listenServer: (...params: any) => any;

  public stopServer: (...params: any) => any;

  public configureServer: (...params: any) => any;

  constructor() {
    /* properties */
    this.name = 'not_named';
    this.dumpError = console.error;
    /* a count of the number server listen errors allowed */
    this.listenErrors = 3;
    /* the server object returned by express createServer */
    this.expressServer = {} as any as http.Server;

    /* operations methods */
    this.setupServer = setupServer;
    this.listenServer = listenServer;
    this.stopServer = stopServer;
    this.configureServer = configureServer;
  }
}
