import { setupDebug } from '../src/debugOutput';

/* set up mocha, sinon & chai */
import chai from 'chai';
import 'mocha';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';

/* external dependencies */
import proxyquire from 'proxyquire';
import intercept from 'intercept-stdout';

const { modulename, debug } = setupDebug(__filename);
chai.use(sinonChai);
const { expect } = chai;
sinon.assert.expose(chai.assert, {
  prefix: '',
});

/* paths for proxyquire */
const dumpErrorPath = '../src/dumpError';

describe('dumpError tests', () => {
  debug(`Running ${modulename}: describe dumpError`);

  it('should log to console.error but not console.log', async function runTest() {
    debug(
      `Running ${modulename}: it - should log to console.error but not console.log`,
    );

    /* use proxyquire to reload DumpError */
    const { DumpError } = proxyquire(dumpErrorPath, {});
    const dumpError = new DumpError() as Perform.TDumpErrorFunction;

    /* start intercepting stdout and stderr */
    let capturedConsoleLog = '';
    let capturedConsoleError = '';
    const unhookIntercept = intercept(
      (txt: string) => {
        capturedConsoleLog += txt;
      },
      (txt: string) => {
        capturedConsoleError += txt;
      },
    );
    /* dump an error */
    const err: Perform.IErr = new Error('Test error');
    err.statusCode = 100;
    err.dumped = false;
    dumpError(err);

    /* stop intercepting console.log */
    unhookIntercept();

    /* test that error message logged to console.error */
    expect(capturedConsoleError.includes(err.message), 'error message logged')
      .to.be.true;

    /* test that nothing logged to console.out */
    expect(capturedConsoleLog).to.eql('', 'stdlog will be empty');
  });
});
