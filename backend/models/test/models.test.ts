const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

/*
 * external dependencies
 */

/* set up mocha, sinon & chai */
import chai = require('chai');
import 'mocha';
const expect = chai.expect;

/* external dependencies */
import { Document, Model } from 'mongoose';

/*
 * internal dependencies
 */

import { runDatabaseApp } from '../../database/src/index';
import { Database } from '../src/configModels';
import { createModelTests } from '../src/tests';

/*
 * tests
 */
describe('Database models operations', () => {
  debug(`Running ${modulename} describe - Database models operation`);

  let database: Database;
  interface ITestModel {
    id: number;
    name: string;
  }
  let docContent1: ITestModel;
  let docContent2: ITestModel;
  let modelTests: Model<Document>;

  before('Create database connection & tests model', async () => {
    debug(
      `Running ${modulename} after - Create database connection & tests model`,
    );

    database = await runDatabaseApp();

    docContent1 = {
      id: 11,
      name: 'test12',
    };
    docContent2 = {
      id: 21,
      name: 'test22',
    };
  });

  after('Close database connection', async () => {
    debug(`Running ${modulename} after - Close database connection`);

    await database.closeConnection(database.dbConnection);
  });

  it('creates the tests model', async () => {
    debug(`Running ${modulename} it - creates the test model`);

    debug('create tests model');
    modelTests = createModelTests(database);
    debug('run tests');
    expect(modelTests.collection.name, 'Should return the model').to.eql(
      'tests',
    );
  });

  it('deletes docs', async () => {
    debug(`Running ${modulename} it - deletes docs`);

    debug('delete tests docs');
    await modelTests.deleteMany({
      _id: {
        $exists: true,
      },
    });
    const count = await modelTests.countDocuments();

    debug('run tests');
    expect(count, 'All docs have been deleted').to.eql(0);
  });

  it('creates and saves docs', async () => {
    debug(`Running ${modulename} it - creates and saves docs`);

    debug('create docs');
    const testDoc1 = new modelTests(docContent1);
    const returnedDoc1 = await testDoc1.save();
    const testDoc2 = new modelTests(docContent2);
    const returnedDoc2 = await testDoc2.save();

    debug('run tests');
    expect(
      returnedDoc1.get('id'),
      'returned doc to equal doc that was saved',
    ).to.eql(11);
    expect(
      returnedDoc2.get('name'),
      'returned doc to equal doc that was saved',
    ).to.eql('test22');
  });

  it('finds docs', async () => {
    debug(`Running ${modulename} it - finds docs`);

    debug('find docs');
    const foundDocs = await modelTests.find();

    debug('run tests');
    expect(foundDocs.length, 'to equal').to.eql(2);
  });

  it('finds a doc', async () => {
    debug(`Running ${modulename} it - finds a doc`);

    debug('find a doc');
    const foundDoc = await modelTests.findOne({ id: 21 });

    debug('run tests');
    foundDoc
      ? expect(foundDoc.get('name'), 'to equal').to.eql('test22')
      : expect.fail(true, false, 'Should have failed earlier');
  });

  it('updates a doc', async () => {
    debug(`Running ${modulename} it - updates a doc`);

    debug('update a doc');
    let foundDoc = await modelTests.findOne({ id: 11 });
    await modelTests.updateMany(
      {
        _id: {
          $exists: true,
        },
      },
      {
        name: 'updatedTest12',
      },
    );
    foundDoc = await modelTests.findOne({ id: 11 });

    debug('run tests');
    foundDoc
      ? expect(foundDoc.get('name'), 'to equal').to.eql('updatedTest12')
      : expect.fail(true, false, 'Should have failed earlier');
  });

  it('fails to access a database that is down', async () => {
    debug(`Running ${modulename} it - fails to access a database that is down`);

    debug('close database');
    await database.closeConnection(database.dbConnection);

    debug('run tests');
    try {
      await modelTests.find();
      expect.fail(true, false, 'Should have failed earlier');
    } catch (err) {
      expect(err, 'Should return an Error').to.be.instanceof(Error);
    }
  });
});
