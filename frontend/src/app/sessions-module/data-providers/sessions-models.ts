/**
 * Sessions table information.
 */

import { Observable } from 'rxjs';
import { IMember } from '../../common/models/member';

import { earliestDate } from '../../scores-module/data-providers/scores-models';

export enum SessionType {
  Conditioning = 'CONDITIONING',
  Strength = 'STRENGTH',
  Sport = 'Sport',
}

enum Days {
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday',
  Sunday = 'Sunday',
}
enum AMPM {
  AM = 'AM',
  PM = 'PM',
}

enum rpeScore {
  zero = 0,
  one = 1,
  two = 2,
  three = 3,
  four = 4,
  five = 5,
  six = 6,
  seven = 7,
  eight = 8,
  nine = 9,
  ten = 10,
}

export interface ISessionsStripped {
  id: number;
  memberId: number;
  /* NOTE: The date field is filled by a datepicker input which supplies a Date object.  A parser edits the datepicker output so it supplies a date with a UTC time of 'yyyy-mm-ddT00:00:00.000Z'. The date field should only ever have such a date format so only one database record is created per day. */
  /* NOTE: Dates are passed back and forth in http requests as ISO strings so conversion from and to an ISessions object is required on sending and receiving ISessions objects */
  date: Date;
  sessions: [
    {
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
  ];
}

export interface ISessions extends ISessionsStripped {
  sessions: [
    {
      day: Days.Monday;
      ampm: AMPM.AM;
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      day: Days.Monday;
      ampm: AMPM.PM;
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      day: Days.Tuesday;
      ampm: AMPM.AM;
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      day: Days.Tuesday;
      ampm: AMPM.PM;
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      day: Days.Wednesday;
      ampm: AMPM.AM;
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      day: Days.Wednesday;
      ampm: AMPM.PM;
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      day: Days.Thursday;
      ampm: AMPM.AM;
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      day: Days.Thursday;
      ampm: AMPM.PM;
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      day: Days.Friday;
      ampm: AMPM.AM;
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      day: Days.Friday;
      ampm: AMPM.PM;
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      day: Days.Saturday;
      ampm: AMPM.AM;
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      day: Days.Saturday;
      ampm: AMPM.PM;
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      day: Days.Sunday;
      ampm: AMPM.AM;
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
    {
      day: Days.Sunday;
      ampm: AMPM.PM;
      type: '' | SessionType;
      rpe: rpeScore;
      duration: number;
    },
  ];
}

export interface ISessionsAndMember {
  member$: Observable<IMember>;
  sessions$: Observable<ISessions>;
}

export const dummySessions: ISessions = {
  id: 0,
  memberId: 0,
  date: earliestDate,
  sessions: [
    {
      day: Days.Monday,
      ampm: AMPM.AM,
      type: '',
      rpe: rpeScore.zero,
      duration: 0,
    },
    {
      day: Days.Monday,
      ampm: AMPM.PM,
      type: '',
      rpe: rpeScore.zero,
      duration: 0,
    },
    {
      day: Days.Tuesday,
      ampm: AMPM.AM,
      type: '',
      rpe: rpeScore.zero,
      duration: 0,
    },
    {
      day: Days.Tuesday,
      ampm: AMPM.PM,
      type: '',
      rpe: rpeScore.zero,
      duration: 0,
    },
    {
      day: Days.Wednesday,
      ampm: AMPM.AM,
      type: '',
      rpe: rpeScore.zero,
      duration: 0,
    },
    {
      day: Days.Wednesday,
      ampm: AMPM.PM,
      type: '',
      rpe: rpeScore.zero,
      duration: 0,
    },
    {
      day: Days.Thursday,
      ampm: AMPM.AM,
      type: '',
      rpe: rpeScore.zero,
      duration: 0,
    },
    {
      day: Days.Thursday,
      ampm: AMPM.PM,
      type: '',
      rpe: rpeScore.zero,
      duration: 0,
    },
    {
      day: Days.Friday,
      ampm: AMPM.AM,
      type: '',
      rpe: rpeScore.zero,
      duration: 0,
    },
    {
      day: Days.Friday,
      ampm: AMPM.PM,
      type: '',
      rpe: rpeScore.zero,
      duration: 0,
    },
    {
      day: Days.Saturday,
      ampm: AMPM.AM,
      type: '',
      rpe: rpeScore.zero,
      duration: 0,
    },
    {
      day: Days.Saturday,
      ampm: AMPM.PM,
      type: '',
      rpe: rpeScore.zero,
      duration: 0,
    },
    {
      day: Days.Sunday,
      ampm: AMPM.AM,
      type: '',
      rpe: rpeScore.zero,
      duration: 0,
    },
    {
      day: Days.Sunday,
      ampm: AMPM.PM,
      type: '',
      rpe: rpeScore.zero,
      duration: 0,
    },
  ],
};
