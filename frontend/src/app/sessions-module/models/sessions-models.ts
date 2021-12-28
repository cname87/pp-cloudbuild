export enum ESessionType {
  Blank = '-',
  Conditioning = 'CONDITIONING',
  Strength = 'STRENGTH',
  Sport = 'SPORT',
}
export const sessionTypeNames: ESessionType[] = Object.keys(ESessionType)
  .map((key) => {
    if (new RegExp(/[a-z]/g).test(key)) {
      return ESessionType[key];
    }
  })
  .filter((key) => !!key); // no blank

export enum EDays {
  Monday = 'Monday',
  Tuesday = 'Tuesday',
  Wednesday = 'Wednesday',
  Thursday = 'Thursday',
  Friday = 'Friday',
  Saturday = 'Saturday',
  Sunday = 'Sunday',
}

export enum EAmPm {
  AM = 'AM',
  PM = 'PM',
}

export enum ERpeScore {
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

export const rpeNames: ERpeScore[] = Object.keys(ERpeScore)
  .map((key) => {
    if (new RegExp(/[a-z]/g).test(key)) {
      return ERpeScore[key];
    }
  })
  .filter((key) => !!key); // no blank

/* defines the updateable data for one training session */
export interface ISession {
  type: ESessionType;
  rpe: ERpeScore;
  duration: number;
  comment: string;
}

/* an empty session */
export const blankSession = {
  type: ESessionType.Blank,
  rpe: ERpeScore.zero,
  duration: 0,
  comment: '',
};

/* the mutable data associated with a session */
export interface ISessionsStripped {
  id: number;
  memberId: number;
  /* NOTE: The date field in the input form is filled by a datepicker input which supplies a Date object.  See the note in the component for how a parser edits the datepicker local time output so it stores a date object with a UTC format of 'yyyy-mm-ddT00:00:00.000Z'. */
  /* NOTE: Dates are passed back and forth in http requests as ISO strings so conversion of the date field from and to a Date object is required on sending and receiving IScores objects. */
  date: Date;
  sessions: [
    {
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
  ];
}

export interface ISessions extends ISessionsStripped {
  sessions: [
    {
      day: EDays.Monday;
      ampm: EAmPm.AM;
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      day: EDays.Monday;
      ampm: EAmPm.PM;
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      day: EDays.Tuesday;
      ampm: EAmPm.AM;
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      day: EDays.Tuesday;
      ampm: EAmPm.PM;
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      day: EDays.Wednesday;
      ampm: EAmPm.AM;
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      day: EDays.Wednesday;
      ampm: EAmPm.PM;
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      day: EDays.Thursday;
      ampm: EAmPm.AM;
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      day: EDays.Thursday;
      ampm: EAmPm.PM;
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      day: EDays.Friday;
      ampm: EAmPm.AM;
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      day: EDays.Friday;
      ampm: EAmPm.PM;
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      day: EDays.Saturday;
      ampm: EAmPm.AM;
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      day: EDays.Saturday;
      ampm: EAmPm.PM;
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      day: EDays.Sunday;
      ampm: EAmPm.AM;
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
    {
      day: EDays.Sunday;
      ampm: EAmPm.PM;
      type: ESessionType;
      rpe: ERpeScore;
      duration: number;
      comment: string;
    },
  ];
}

/* used to pass required data back to sessions parent */
export interface ISessionsData {
  sessions: ISessions;
  session: ISession;
  rowIndex: number;
}

/* used in request body */
export interface IDate {
  date: Date;
}
