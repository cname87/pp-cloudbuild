/**
 * Sport session information.
 */

import { Observable } from 'rxjs';
import { IMember } from './member';

export enum SessionType {
  Conditioning = 'CONDITIONING',
  Strength = 'STRENGTH',
}

export interface ISessionWithoutId {
  date: string;
  type: SessionType | '';
  score: number | '';
  duration: number | '';
  metric: number;
  memberId: number;
  comment: string;
}

export interface ISession extends ISessionWithoutId {
  id: number;
}

export const SessionTypeNames: SessionType[] = Object.keys(SessionType)
  .map((key) => {
    if (new RegExp(/[a-z]/g).test(key)) {
      return SessionType[key];
    }
  })
  .filter((key) => key !== undefined);

export const enum MODE {
  'ADD',
  'EDIT',
}

export interface ISessionsTable {
  member: Observable<IMember>;
  sessions: Observable<ISession[]>;
}

export interface ISessionChange {
  mode: MODE;
  member$: Observable<IMember>;
  session$: Observable<ISession> | Observable<ISessionWithoutId>;
}
