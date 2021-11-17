import { setupDebug } from '../../utils/src/debugOutput';

import { configDatabase } from '../configDatabase';
import { Database } from '../src/database';

/* set up mocha, sinon & chai */
import chai from 'chai';
import 'mocha';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

/* other external dependencies */
import { SchemaDefinition } from 'mongoose';
import proxyquire from 'proxyquire';

const { modulename, debug } = setupDebug(__filename);
chai.use(sinonChai);
const { expect } = chai;
sinon.assert.expose(chai.assert, {
  prefix: '',
});

const { getConnectionOptions, getMongoUri, startDatabasePath } = configDatabase;

describe('Database connection', () => {
  debug(`Running ${modulename} describe - Database.connection`);

  /* set up module  variables */
  let database: Perform.TDatabase;
  const spyDebug = sinon.spy();

  /* derive db name from the connection uri */
  const uri = getMongoUri(
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
  const charStart = uri.indexOf('://');
  const char1 = uri.indexOf('/', charStart + 3); // skip initial :// in uri
  const char2 = uri.indexOf('?ssl=');
  const dbName = uri.substring(char1 + 1, char2);

  /* set up a database schema, collection, and model name */
  const testSchema: SchemaDefinition = {
    username: String,
    email: String,
  };
  const testCollection = 'mochaTest';
  const testModel = 'mochaTestModel';

  afterEach('close database connection', async () => {
    debug(`Running ${modulename} afterEach - close database connection`);

    debug('close dbConnection if open');
    if (
      database &&
      database.dbConnection &&
      database.dbConnection.readyState === Perform.EDbReadyState.Connected
    ) {
      await database.closeConnection(database.dbConnection);
    }
  });

  it('tests spyDebug', async () => {
    debug(`Running ${modulename} it - tests spyDebug`);

    debug('connect to database');
    const getDatabase = proxyquire(startDatabasePath, {
      '../../utils/src/debugOutput': {
        setupDebug: () => {
          return {
            debug: (message: string) => spyDebug(message),
          };
        },
      },
    });
    database = await getDatabase.startDatabase(
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

    debug('run tests');
    /* slice off modulename as it might be .ts or .js */
    expect(spyDebug.lastCall.lastArg.slice(-21)).to.eql(
      'running startDatabase',
    );
  });

  it('makes a connection to a database', async () => {
    debug(`Running ${modulename} it - makes a connection to a database`);

    debug('connect to database');
    const getDatabase = proxyquire(startDatabasePath, {});
    database = await getDatabase.startDatabase(
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

    debug('run tests');
    if (database && database.dbConnection && database.dbConnection.db) {
      expect(
        database.dbConnection.db.databaseName,
        'Should return a database connection named <dbName>',
      ).to.equal(dbName);
      expect(
        database.dbConnection.readyState,
        'Connection should be open',
      ).to.equal(Perform.EDbReadyState.Connected);
    } else {
      expect.fail('database or dbConnection or db is falsy');
    }
  });

  it('makes a 2nd connection to a database', async () => {
    debug(`Running ${modulename} it - makes a 2nd connection to a database`);

    debug('connect to database');
    const getDatabase = proxyquire(startDatabasePath, {});
    database = await getDatabase.startDatabase(
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

    debug('run tests');
    if (database && database.dbConnection && database.dbConnection.db) {
      expect(
        database.dbConnection.db.databaseName,
        'Should return a database connection named <dbName>',
      ).to.equal(dbName);
      expect(
        database.dbConnection.readyState,
        'Connection should be open',
      ).to.equal(Perform.EDbReadyState.Connected);
    } else {
      expect.fail('database or dbConnection or db is falsy');
    }

    debug('make a 2nd connection to the database');
    const database2 = await getDatabase.startDatabase(
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

    debug('run tests');
    if (database2 && database2.dbConnection && database2.dbConnection.db) {
      expect(
        database2.dbConnection.db.databaseName,
        'Should return a database connection named <dbName>',
      ).to.equal(dbName);
      expect(
        database2.dbConnection.readyState,
        'Connection should be open',
      ).to.equal(Perform.EDbReadyState.Connected);

      debug('close the 2nd dbConnection');
      await database2.closeConnection(database2.dbConnection);

      debug('run tests');
      expect(
        database2.dbConnection.readyState,
        'Connection should be closed',
      ).to.equal(0);
    } else {
      expect.fail('database or dbConnection or db is falsy');
    }

    /* close 2nd connection as not closed in afterEach */
    await database2.closeConnection(database2.dbConnection);
  });

  it('fails to connect to a database', async () => {
    debug(`Running ${modulename} it - fails to connect to a database`);

    debug('start a failed connection to database');
    try {
      const connectionUrl = 'dummyUrl';
      const connectOptions = getConnectionOptions();
      database = new Database(connectionUrl, connectOptions);
      database.dbConnection = await database.dbConnectionPromise;
      /* will throw an error */
      expect.fail('Should not have reached this point');
    } catch (err: any) {
      expect(err.name, 'Should be a MongoParseError').to.eql('MongoParseError');
    }
  });

  it('closes an open database connection', async () => {
    debug(`Running ${modulename} it - closes an open database connection`);

    debug('connect to database');
    const getDatabase = proxyquire(startDatabasePath, {});
    database = await getDatabase.startDatabase(
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

    if (database && database.dbConnection && database.dbConnection.db) {
      debug('run tests');
      expect(
        database.dbConnection.readyState,
        'Connection should be open',
      ).to.eql(Perform.EDbReadyState.Connected);

      debug('close the database');
      await database.closeConnection(database.dbConnection);

      debug('run tests');
      expect(
        database.dbConnection.readyState,
        'Connection should be closed',
      ).to.equal(0);
    } else {
      expect.fail('database or dbConnection or db is falsy');
    }
  });

  it('closes a closed database connection', async () => {
    debug(`Running ${modulename} it - closes a closed database connection`);

    if (database && database.dbConnection && database.dbConnection.db) {
      debug('close the database');
      await database.closeConnection(database.dbConnection);
      expect(
        database.dbConnection.readyState,
        'Connection should be closed',
      ).to.equal(0);

      debug('close the database again');
      await database.closeConnection(database.dbConnection);

      debug('run tests');
      expect(
        database.dbConnection.readyState,
        'Connection should still be closed',
      ).to.equal(0);
    } else {
      expect.fail('database or dbConnection or db is falsy');
    }
  });

  it('closes an invalid database connection', async () => {
    debug(`Running ${modulename} it - closes an invalid database connection`);

    debug('try close an invalid database');
    const dummyConnection: any = {};
    try {
      await database.closeConnection(dummyConnection);
      expect.fail('Should not reach this point');
    } catch (err) {
      debug('run tests');
      expect(err, 'Throws an error').to.be.instanceOf(TypeError);
    }
  });

  it('Creates a mongoose model', async () => {
    debug(`Running ${modulename} it creates a mongoose model`);

    debug('connect to database');
    const getDatabase = proxyquire(startDatabasePath, {});
    database = await getDatabase.startDatabase(
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

    debug('create mongoose model');
    const model = database.createModel(testModel, testSchema, testCollection);

    debug('run tests');
    expect(model.collection.name, 'Should return a mongoose model').to.eql(
      testCollection,
    );
  });

  it('Fails to create a mongoose model', async () => {
    debug(`Running ${modulename} it - fails to create a mongoose model`);

    debug('connect to database');
    const getDatabase = proxyquire(startDatabasePath, {});
    database = await getDatabase.startDatabase(
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

    const dummyCollection: any = {};

    try {
      debug('fail to create a Mongoose model');
      database.createModel(testModel, testSchema, dummyCollection);
      expect.fail('Should not have reached this point');
    } catch (err: any) {
      debug('run tests');
      expect(err.message, 'Should be a connection error').to.eql(
        'collection name must be a String',
      );
    }
  });

  it('tests sending no dumpError', async () => {
    debug(`Running ${modulename} it - tests sending no dumpError`);

    debug('connect to database without configuring dumpError');
    const connectionUrl = getMongoUri(
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
    const connectOptions = getConnectionOptions();
    database = new Database(connectionUrl, connectOptions);
    database.dbConnection = await database.dbConnectionPromise;

    debug('run tests');
    if (database && database.dbConnection && database.dbConnection.db) {
      expect(
        database.dbConnection.db.databaseName,
        'Should return a database connection named <dbName>',
      ).to.equal(dbName);
      expect(
        database.dbConnection.readyState,
        'Connection should be open',
      ).to.equal(Perform.EDbReadyState.Connected);
    } else {
      expect.fail('database or dbConnection or db is falsy');
    }
  });
});
