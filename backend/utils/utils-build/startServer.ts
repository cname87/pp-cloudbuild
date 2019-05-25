/**
 * This module provides a utility executable to allow a launch configuration to test is the server running and if not then start it and wait until it is running before proceeding.
 *
 * See pingServer for the implementation.
 *
 * * Usage:
 * Set up a vscode task that runs this file as the argument to node.exe.
 * Set the task as a preLaunchTask in a launch configuration.
 *
 */

const modulename = __filename.slice(__filename.lastIndexOf('\\'));
import debugFunction from 'debug';
const debug = debugFunction('PP_' + modulename);
debug(`Starting ${modulename}`);

import { pingServer } from './pingServer';

/* try connect to server until it's up and then return and exit */
async function test() {
  try {
    await pingServer(1);
    console.log('Connected to previously-running server');
    return;
  } catch (err) {
    console.log('Trying to start server');
    /* start the server */
    import('../../index');
  }
  try {
    console.log('starting ping');
    await pingServer();
    console.log('Connected to newly-started server');
    return;
  } catch (err) {
    console.log('Failed to start server');
    return;
  }
}

test();