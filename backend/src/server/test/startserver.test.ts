import chai from 'chai';
import express from 'express';
import 'mocha';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

import { DumpError } from '../../utils/src/dumpError';
import { startServer } from '../startserver';
import { setupDebug } from '../../utils/src/debugOutput';
setupDebug(__filename);

chai.use(sinonChai);
const { expect } = chai;
sinon.assert.expose(chai.assert, {
  prefix: '',
});

describe('Start server tests', () => {
  /* internal dumpError utility */
  const dumpError = new DumpError();

  let app: any;
  let objects: any = {};
  // let startServer: TStartServer;

  before('Set up objects', () => {
    // startServer = require('../startserver').startServer;
    /* set up the objects object */
    app = express();
    objects = app.locals = {
      servers: [], // holds created http servers
      dumpError,
    };
  });

  afterEach('Stop servers', async () => {
    /* shutdown the servers after */
    for (const svr of objects.servers) {
      await svr.stopServer();
      svr.expressServer.removeAllListeners();
    }

    objects.servers = [];
  });

  it('Start http server only', async () => {
    try {
      await startServer(app, objects.servers, objects.dumpError);
    } catch (err: any) {
      expect.fail('Should not throw an error');
    }

    expect(
      objects.servers[0].expressServer.listening,
      'Should return ' + 'a listening server object',
    ).to.eql(true);

    expect(objects.servers[1], 'Should be undefined').to.eql(undefined);
  });

  it('Throws an error on failed listening request', async () => {
    try {
      /* start server twice and second listen attempt will fail */
      await startServer(app, objects.servers, objects.dumpError);
      await startServer(app, objects.servers, objects.dumpError);
      expect.fail('Should not have reached here');
    } catch (err: any) {
      expect(err.code, 'Should throw a port busy error').to.eql('EADDRINUSE');
    }
  });
});
