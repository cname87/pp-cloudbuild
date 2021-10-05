/**
 * Scores table information.
 */

import { Observable } from 'rxjs';
import { IMember } from '../../common/models/member';

type TScore = 0 | 1 | 2 | 3 | 4 | 5;

export interface IScores {
  id: number;
  memberId: number;
  /* NOTE: The date field is filled by a datepicker input which supplies a Date object.  A parser edits the datepicker output so it supplies a date with a UTC time of 'yyyy-mm-ddT00:00:00.000Z'. The date field should only ever have such a date format so only one database record is created per day. */
  /* NOTE: Dates are passed back and forth in http requests as ISO strings so conversion from and to an IScores object is required on sending and receiving IScores objects */
  date: Date;
  scores: [
    {
      item: ScoreType.Sleep;
      monday: TScore;
      tuesday: TScore;
      wednesday: TScore;
      thursday: TScore;
      friday: TScore;
      saturday: TScore;
      sunday: TScore;
    },
    {
      item: ScoreType.Fatigue;
      monday: TScore;
      tuesday: TScore;
      wednesday: TScore;
      thursday: TScore;
      friday: TScore;
      saturday: TScore;
      sunday: TScore;
    },
    {
      item: ScoreType.Soreness;
      monday: TScore;
      tuesday: TScore;
      wednesday: TScore;
      thursday: TScore;
      friday: TScore;
      saturday: TScore;
      sunday: TScore;
    },
    {
      item: ScoreType.Stress;
      monday: TScore;
      tuesday: TScore;
      wednesday: TScore;
      thursday: TScore;
      friday: TScore;
      saturday: TScore;
      sunday: TScore;
    },
    {
      item: ScoreType.Motivation;
      monday: TScore;
      tuesday: TScore;
      wednesday: TScore;
      thursday: TScore;
      friday: TScore;
      saturday: TScore;
      sunday: TScore;
    },
    {
      item: ScoreType.Health;
      monday: TScore;
      tuesday: TScore;
      wednesday: TScore;
      thursday: TScore;
      friday: TScore;
      saturday: TScore;
      sunday: TScore;
    },
    {
      item: ScoreType.Nutrition;
      monday: TScore;
      tuesday: TScore;
      wednesday: TScore;
      thursday: TScore;
      friday: TScore;
      saturday: TScore;
      sunday: TScore;
    },
    {
      item: ScoreType.Mood;
      monday: TScore;
      tuesday: TScore;
      wednesday: TScore;
      thursday: TScore;
      friday: TScore;
      saturday: TScore;
      sunday: TScore;
    },
  ];
}

export interface IScoresAndMember {
  member$: Observable<IMember>;
  scores$: Observable<IScores>;
}
/* list all questionaire query items here first */
export enum ScoreType {
  Sleep = 'SLEEP',
  Fatigue = 'FATIGUE',
  Soreness = 'SORENESS',
  Stress = 'STRESS',
  Motivation = 'MOTIVATION',
  Health = 'HEALTH',
  Nutrition = 'NUTRITION',
  Mood = 'MOOD',
}

export const ScoreTypeNames: ScoreType[] = Object.keys(ScoreType)
  .map((key) => {
    if (new RegExp(/[a-z]/g).test(key)) {
      return ScoreType[key];
    }
  })
  .filter((key) => key !== undefined);
export interface IScoresChange {
  member$: Observable<IMember>;
  scores$: Observable<IScores>;
}

/* Cannot enter dates early than this */
export const earliestDate = new Date('June 27, 2021');

export const dummyScores: IScores = {
  id: 0,
  memberId: 0,
  date: earliestDate,
  scores: [
    {
      item: ScoreType.Sleep,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    },
    {
      item: ScoreType.Fatigue,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    },
    {
      item: ScoreType.Soreness,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    },
    {
      item: ScoreType.Stress,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    },
    {
      item: ScoreType.Motivation,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    },
    {
      item: ScoreType.Health,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    },
    {
      item: ScoreType.Nutrition,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    },
    {
      item: ScoreType.Mood,
      monday: 0,
      tuesday: 0,
      wednesday: 0,
      thursday: 0,
      friday: 0,
      saturday: 0,
      sunday: 0,
    },
  ],
};
