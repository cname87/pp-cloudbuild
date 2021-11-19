/**
 * Sessions table types and constants.
 */

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
  /* NOTE: The date field in the input form is filled by a datepicker input which supplies a Date object.  See the note in the component for how a parser edits the datepicker local time output so it stores a date object with a UTC format of 'yyyy-mm-ddT00:00:00.000Z'. */
  /* NOTE: Dates are passed back and forth in http requests as ISO strings so conversion of the date field from and to a Date object is required on sending and receiving IScores objects. */
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

/* used in request body */
export interface IDate {
  date: Date;
}
