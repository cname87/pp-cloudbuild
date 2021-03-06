/**
 * This module supplies handler functions used across different
 * controllers.
 */

import { Request, Response, NextFunction } from 'express';
import util from 'util';
import { Context, ValidationResult } from 'openapi-backend';
import { setupDebug } from '../utils/src/debugOutput';

const { modulename, debug } = setupDebug(__filename);

/**
 * This handler emits an event.
 * The event emitter is req.app.appLocals.event.
 * The event emitted is 'handlersRaiseEvent'.
 * The argument passed is a object with 2 properties:
 * number and message.  The values are read from the
 * request body, i.e. sent in via a POST.
 * A response is sent with a status of 200.
 * Note: There is no checking of the request body data.
 */
function raiseEvent(req: Request, res: Response, _next: NextFunction): void {
  debug(`${modulename}: handler raiseEvent was called`);

  /* retrieve data sent via POST */
  /* default to 0 and '' */
  let message = '';
  if (req.body.message) {
    message = req.body.message;
  }
  let numberToSend = '';
  if (req.body.number) {
    numberToSend = req.body.number;
  }
  const arg = {
    message,
    number: numberToSend,
  };

  /* raise an event */
  const { event } = req.app.appLocals;
  event.emit('handlersRaiseEvent', arg);

  res.status(200);
  res.end();
}

/**
 * This function examines a supplied payload and result code against a supplied openapi-backend context object and returns an openapi-backend ValidationResult.
 */
const isResponseValid = (
  context: Context | undefined,
  payload: any,
  statusCode: number,
): ValidationResult => {
  debug(`${modulename}: running isResponseValid`);

  /* check responses object exists */
  if (!context?.operation?.responses) {
    return {
      valid: false,
      errors: [
        {
          keyword: 'Unexpected',
          instancePath: '',
          schemaPath: '',
          params: [],
          message: 'responses missing in response validation call',
        },
      ],
    };
  }

  /* manual validation required if body is empty */
  if (!payload) {
    debug(`${modulename}: empty body reported`);

    /* match content for status code and return valid if no content -  otherwise proceed */
    const responseObject: any = context.operation.responses[statusCode];
    if (!responseObject.content) {
      return {
        valid: true,
        errors: null,
      };
    }
  }

  return context.api.validateResponse(payload, context.operation, statusCode);
};

/**
 * This handler sends a JSON payload in a response.
 */
const writeJson = (
  context: Context | undefined,
  req: Request,
  res: Response,
  next: NextFunction,
  code: number,
  payload?:
    | Perform.IMember
    | Perform.IMember[]
    | { count: number }
    | Perform.IActivity
    | Perform.IActivity[]
    | Perform.IScores
    | Perform.ISessions
    | Summary.TSummary
    | { isTestDatabase: boolean },
): void => {
  debug(`${modulename}: running writeJson`);

  /* validate the pre-serialized payload */
  const validationResult = isResponseValid(context, payload, code);

  if (!validationResult.valid) {
    // response validation failed
    const err: Perform.IErr = {
      name: 'RESPONSE_VALIDATION_FAIL',
      message: `Response validation fail error:\n${util.inspect(
        validationResult.errors,
      )}\nResponse payload:\n${util.inspect(payload)}`,
      statusCode: 502,
      dumped: false,
    };
    req.app.appLocals.dumpError(err);
    err.message = 'Response validation fail';

    return next(err);
  } else {
    debug(`${modulename}: sending response`);
    res.status(code).json(payload);
  }
};

export const miscHandlers = {
  raiseEvent,
  writeJson,
};
