/* import configuration parameters into process.env first */
import '../utils/src/loadEnvFile';

import { setupDebug } from '../utils/src/debugOutput';

/* set up mocha, sinon & chai */
import chai from 'chai';
import 'mocha';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import path from 'path';
import winston from 'winston';
import proxyquire from 'proxyquire';
import util from 'util';
import httpRequest from 'request-promise-native';
import { DumpError } from '../utils/src/dumpError';
import { Logger } from '../utils/src/logger';

const { modulename, debug } = setupDebug(__filename);
chai.use(sinonChai);
const { expect } = chai;
sinon.assert.expose(chai.assert, {
  prefix: '',
});
const sleep = util.promisify(setTimeout);

describe('the application', () => {
  debug(`Running ${modulename} describe - the application`);

  const appPath = '../app';

  /* internal dumpError and logger utilities */
  const logger = new Logger() as winston.Logger;
  const dumpError = new DumpError(logger) as Perform.DumpErrorFunction;

  let app: any = {};
  let runIndex: (extraOptions?: Record<string, unknown>) => void;
  let spyDebug: any;
  let spyLoggerError: any;
  let spyLoggerInfo: any;
  let spyConsoleError: any;
  let spyDumpError: any;

  const options = {
    url: `${process.env.HOST}:${process.env.PORT}`,
  };

  const serverUpMessage = `${path.sep}app.js: server up and running`;

  const serverIsUp = () => {
    let response;
    return new Promise(async (resolve) => {
      for (let tryConnectCount = 1; tryConnectCount <= 10; tryConnectCount++) {
        try {
          debug(
            `${modulename}: connect to local host` +
              ` - attempt ${tryConnectCount}`,
          );
          response = await httpRequest(options);
          resolve(response);
          break; // loop will continue even though promise resolved
        } catch (err) {
          debug(
            `${modulename}: failed to connect to local host` +
              ` - attempt ${tryConnectCount}`,
          );
          await sleep(500);
          continue;
        }
      }

      /* if loop ends without earlier resolve() */
      resolve(new Error('Connection failed'));
    });
  };

  const appIsExited = (spy: any, spyString: any) => {
    return new Promise(async (resolve) => {
      for (let checkDebugCount = 1; checkDebugCount <= 10; checkDebugCount++) {
        debug(
          `${modulename}: app still running` + ` - attempt ${checkDebugCount}`,
        );
        if (spy.calledWith(spyString) === true) {
          debug(
            `${modulename}: Index exited` + ` - attempt ${checkDebugCount}`,
          );
          resolve('Index has exited');
          break;
        }
        await sleep(500);
      }

      /* if loop ends without an earlier resolve() */
      resolve(new Error('Connection failed'));
    });
  };

  before('set up server and spies', async () => {
    debug(`Running ${modulename} before - set up server and spies`);

    spyDebug = sinon.spy();
    spyLoggerInfo = sinon.spy();
    spyLoggerError = sinon.spy();
    spyDumpError = sinon.spy();

    /* spy on console.error (as node may send warnings there) */
    spyConsoleError = sinon.spy(console, 'error');

    runIndex = (extraOptions = {}) => {
      const proxyOptionsDefault = {
        './utils/src/debugOutput': {
          setupDebug: (prefix: string) => {
            const { debug } = setupDebug(prefix);
            return {
              debug: (message: any) => {
                debug(message);
                spyDebug(message);
              },
              modulename: setupDebug(prefix).modulename,
            };
          },
        },
        './utils/src/dumpError': {
          DumpError: class DumpErrorStub {
            constructor() {
              return (err: any) => {
                dumpError(err);
                spyDumpError(err);
              };
            }
          },
        },
        './utils/src/logger': {
          Logger: class LoggerStub {
            constructor() {
              return {
                info: (message: any) => {
                  logger.info(message);
                  spyLoggerInfo(message);
                },
                error: (message: any) => {
                  logger.error(message);
                  spyLoggerError(message);
                },
              };
            }
          },
        },
      };
      const proxyOptions = { ...proxyOptionsDefault, ...extraOptions };
      /* app.js is loaded & run here and only here */
      const { appVars: appLocal } = proxyquire(appPath, proxyOptions);
      /* assign destructured app to module variable */
      app = appLocal;
    };
  });

  beforeEach('reset spies', () => {
    debug(`Running ${modulename} beforeEach - reset spies`);
    sinon.resetHistory();
  });

  afterEach('reset spies', () => {
    debug(`Running ${modulename} afterEach - reset spies`);
    sinon.resetHistory();
  });

  after('reset stubs and spies', () => {
    debug(`Running ${modulename} after - reset stubs and spies`);
    sinon.resetHistory();
    sinon.restore();
  });

  it('runs a server', async () => {
    debug(`Running ${modulename} it - runs a server`);

    /* call app.js which runs the application */
    runIndex();
    let response = await serverIsUp();
    expect(response).not.to.be.instanceof(Error);
    expect(spyDebug).to.have.been.calledWith(serverUpMessage);

    /* shut her down */
    await app.sigint();
    response = await appIsExited(
      spyDebug,
      `${path.sep}app.js: Internal Shutdown signal - will exit normally with code 0`,
    );
    expect(response).not.to.be.instanceof(Error);

    expect(spyConsoleError).to.have.not.been.called;

    expect(spyLoggerError).to.have.not.been.called;

    expect(spyDumpError).to.have.not.been.called;

    expect(spyLoggerInfo).to.have.been.calledWith(
      sinon.match('CLOSING THE SERVER ON REQUEST'),
    );
  });

  it('handles a server error', async () => {
    debug(`Running ${modulename} it - handles a server error`);

    /* call app.js which runs the application */
    runIndex();
    let response = await serverIsUp();
    expect(response).not.to.be.instanceof(Error);
    expect(spyDebug).to.have.been.calledWith(serverUpMessage);

    /* trigger the server error event */
    app.appLocals.servers[0].expressServer.emit(
      'error',
      new Error('Test Error'),
    );

    response = await appIsExited(
      spyDebug,
      `${path.sep}app.js: will exit with code -3`,
    );
    expect(response).not.to.be.instanceof(Error);

    expect(spyConsoleError).to.have.not.been.called;

    expect(spyLoggerError.lastCall.lastArg).to.eql(
      `${path.sep}app.js: Unexpected server error - exiting`,
    );

    expect(spyDumpError).to.have.been.called;
  });

  it('handles a closeAll error', async () => {
    debug(`Running ${modulename} it - handles a closeAll error`);

    /* call app.js which runs the application */
    runIndex();
    let response = await serverIsUp();
    expect(response).not.to.be.instanceof(Error);
    expect(spyDebug).to.have.been.calledWith(serverUpMessage);

    /* stub process to create an error during closeAll */
    const processStub = sinon.stub(process, 'removeListener');
    processStub.throws(new Error('Test error'));

    /* trigger the server error event */
    app.appLocals.servers[0].expressServer.emit(
      'error',
      new Error('Test Error'),
    );

    response = await appIsExited(
      spyDebug,
      `${path.sep}app.js: will exit with code -4`,
    );
    expect(response).not.to.be.instanceof(Error);

    processStub.restore();

    expect(spyConsoleError).to.have.not.been.called;

    expect(spyLoggerError.lastCall.lastArg).to.eql(
      `${path.sep}app.js: closeAll error - exiting`,
    );

    expect(spyDumpError).to.have.been.called;
  });

  it('handles a start with a database fail', async () => {
    debug(`Running ${modulename} it - handles a start with a database fail`);

    /* stub so connectDB throws an error but also reports a connected database so the database connection loop will exit */
    const startDatabaseStub = {
      './database/src/startDatabase': {
        startDatabase: async () => {
          const startDb = () => {
            throw new Error('Test error');
          };
          startDb.readyState = 1;
          return {
            dbConnection: startDb,
          };
        },
      },
    };

    /* note that server will start after error is thrown */
    runIndex(startDatabaseStub);
    /* In the main app.ts there is a sleep after a database fail.  This will cause a delay in the mocha test. If the sleep is >~ 5s then the serverIsUp may time out before the server is up.  The server will eventually start and will be left up and mocha will not exit => add a sleep here equal to the sleep in app.ts */
    await sleep(+process.env.DATABASE_ERROR_DELAY!);
    await serverIsUp();

    /* shut her down */
    await app.sigint();

    /* will exit normally */
    const response = await appIsExited(
      spyDebug,
      `${path.sep}app.js: Internal Shutdown signal - will exit normally with code 0`,
    );
    expect(response).not.to.be.instanceof(Error);

    expect(spyConsoleError).to.have.not.been.called;

    expect(spyDumpError).to.have.been.called;

    /* confirm that the start database routine did exit abnormally */
    expect(spyLoggerError.lastCall.lastArg).to.eql(
      `${path.sep}app.js: database startup error - continuing`,
    );
  });

  it('handles a server startup fail', async () => {
    debug(`Running ${modulename} it - handles a server startup fail`);

    /* stub so connectDB throws an error but also reports a connected database so the database connection loop will exit */
    const startServerStub = {
      './server/startserver': {
        startServer: () => {
          throw new Error('Test error');
        },
      },
    };

    /* require app.js */
    runIndex(startServerStub);

    const response = await appIsExited(
      spyDebug,
      `${path.sep}app.js: will exit with code -1`,
    );
    expect(response).not.to.be.instanceof(Error);

    expect(spyConsoleError).to.have.not.been.called;

    expect(spyDumpError).to.have.been.called;

    /* confirm that the start database routine did exit abnormally */
    expect(spyLoggerError.lastCall.lastArg).to.eql(
      `${path.sep}app.js: server startup error - exiting`,
    );
  });

  it('tests uncaught exceptions', async () => {
    debug(`Running ${modulename} it - handles uncaught exceptions`);

    /* set up so process.exit stubbed */
    const stubProcess = sinon.stub(process, 'exit');

    /* require app.js */
    runIndex();
    let response = await serverIsUp();
    expect(response).not.to.be.instanceof(Error);

    await app.uncaughtException(new Error('Test Error'));

    response = await appIsExited(
      spyDebug,
      `${path.sep}app.js: all connections & listeners closed`,
    );
    expect(response).not.to.be.instanceof(Error);

    /* process.exit(-11) */
    expect(stubProcess).to.have.been.calledWith(-11);
    stubProcess.restore();

    expect(spyLoggerError.lastCall).to.have.been.calledWith(
      sinon.match('uncaught exception'),
    );

    expect(spyConsoleError).to.have.not.been.called;

    expect(spyDumpError).to.have.been.called;
  });

  it('handles uncaught rejections', async () => {
    debug(`Running ${modulename} it - handles uncaught rejections`);

    /* set up so process.exit stubbed */
    const stubProcess = sinon.stub(process, 'exit');

    /* require app.js */
    runIndex();
    let response = await serverIsUp();
    expect(response).not.to.be.instanceof(Error);

    await app.unhandledRejection('Test Rejection', 'promise rejected');

    response = await appIsExited(
      spyDebug,
      `${path.sep}app.js: all connections & listeners closed`,
    );
    expect(response).not.to.be.instanceof(Error);

    /* process.exit(-12) */
    expect(stubProcess).to.have.been.calledWith(-12);
    stubProcess.restore();

    expect(spyLoggerError.lastCall).to.have.been.calledWith(
      sinon.match('unhandled promise rejection'),
    );

    expect(spyConsoleError).to.have.not.been.called;

    expect(spyDumpError).to.have.been.called;
  });
});
