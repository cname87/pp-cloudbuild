/**
 * Scores table types and constants.
 */

type TScore = 0 | 1 | 2 | 3 | 4 | 5;

/* list all questionaire query items */
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

export interface IScores {
  id: number;
  memberId: number;
  /* NOTE: The date field in the input form is filled by a datepicker input which supplies a Date object.  See the note in the component for how a parser edits the datepicker local time output so it stores a date object with a UTC format of 'yyyy-mm-ddT00:00:00.000Z'. */
  /* NOTE: Dates are passed back and forth in http requests as ISO strings so conversion of the date field from and to a Date object is required on sending and receiving IScores objects. */
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

/* cannot enter dates early than this */
export const EARLIEST_DATE = new Date('June 27, 2021');
