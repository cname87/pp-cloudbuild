/**
 * NOTE: Relies on the backend database server being up and running.
 */

import { setupDebug } from '../../utils/src/debugOutput';

import { configDatabase } from '../configDatabase';

/* Set up mocha, sinon & chai */
import chai from 'chai';
import 'mocha';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

/* Use proxyquire for startDatabase.js module loading */
import proxyquire from 'proxyquire';

/* Output header and set up debug function */
const { modulename, debug } = setupDebug(__filename);

chai.use(sinonChai);
const { expect } = chai;
sinon.assert.expose(chai.assert, {
  prefix: '',
});

const { startDatabasePath } = configDatabase;

/* tests */
describe('startDatabase', () => {
  debug(`Running ${modulename} describe - startDatabase`);

  let originalDbSetting: string | undefined;
  before('save database setting', () => {
    originalDbSetting = process.env.DB_IS_LOCAL;
  });

  after('reset database setting', () => {
    process.env.DB_IS_LOCAL = originalDbSetting;
  });

  const tests =
    process.env.TEST_DB_LOCAL === 'true'
      ? [{ dbIsLocal: 'false' }, { dbIsLocal: 'true' }]
      : [{ dbIsLocal: 'false' }];

  tests.forEach((test) => {
    it('connects to a database', async () => {
      debug(`Running ${modulename} it - connects to a database`);

      /* configure for a remote and then local database */
      process.env.DB_IS_LOCAL = test.dbIsLocal;

      const message =
        process.env.DB_IS_LOCAL === 'true'
          ? '*** The local database server MUST be started ***'
          : '*** The remote database server MUST be reachable ***';

      console.warn(message);

      debug('running startDatabase.js');
      const app = proxyquire(startDatabasePath, {});

      let database;
      try {
        debug('creating database connection');
        database = await app.startDatabase(
          process.env.DB_IS_LOCAL,
          process.env.DB_LOCAL_USER,
          process.env.DB_USER,
          process.env.DB_LOCAL_PASSWORD,
          process.env.DB_PASSWORD,
          process.env.DB_LOCAL_HOST,
          process.env.DB_HOST,
          process.env.NODE_ENV,
          process.env.DB_MODE,
          process.env.DB_DATABASE,
          process.env.DB_DATABASE_TEST,
        );
      } catch (err) {
        debug('error thrown - database server may not be reachable?');
        expect.fail(
          'Error throw - did you forget to start the database server?',
        );
      }

      debug('test for an open database connection');
      database.dbConnection
        ? expect(database.dbConnection.readyState).to.eql(
            Perform.EDbReadyState.Connected,
          )
        : expect.fail('no dbConnection object returned');

      debug('close database connection');
      await database.closeConnection(database.dbConnection);
    });

    it('fails to connect to a database', async () => {
      debug(`Running ${modulename} it - fails to connect to a database`);

      debug('running startDatabase.js with stub');
      const app = proxyquire(startDatabasePath, {});

      let errorThrown = false;
      try {
        debug('starting database but error expected');
        await app.startDatabase({ dummy: 'dummy' });
      } catch (err) {
        errorThrown = true;
        expect(err instanceof Error).to.be.true;
      } finally {
        expect(errorThrown).to.eql(true);
      }
    });
  });
});
