/**
 * All database models are defined here.
 *
 * NOTE:  These must match the frontend models.
 */

export const memberModel = {
  id: { type: Number, unique: true, index: true, min: 0 },
  name: { type: String },
};

export const questionaireModel = {
  id: { type: Number, unique: true, index: true, min: 0 },
  memberId: { type: Number, index: true },
  date: String,
  sleep: Number,
  fatigue: Number,
  muscle: Number,
  stress: Number,
  motivation: Number,
  health: Number,
  mood: Number,
  diet: Number,
  comment: String,
};

export const sessionModel = {
  id: { type: Number, unique: true, index: true },
  memberId: { type: Number, index: true },
  date: String,
  type: String,
  score: Number,
  duration: Number,
  metric: Number,
  comment: String,
};

const dateIsSunday = (value: number): boolean => {
  const enum DayOfTheWeek {
    'Sunday' = 0,
  }
  return new Date(value).getDay() === DayOfTheWeek.Sunday;
};

export const scoresModel = {
  id: { type: Number, unique: true, index: true, min: 0 },
  /* I tried creating a compond index using Mongoose but failed so create a compound index manually in mongosh with the command 'test> db.getCollection('darren.young22@outlook.com_scores').createIndex({memberId: 1, date: 1}, {unique: true})' */
  memberId: { type: Number, min: 1 },
  date: {
    type: String,
    required: true,
    validator: dateIsSunday,
  },
  scores: [
    {
      item: {
        type: String,
        enum: [
          'SLEEP',
          'FATIGUE',
          'SORENESS',
          'STRESS',
          'MOTIVATION',
          'HEALTH',
          'NUTRITION',
          'MOOD',
        ],
      },
      monday: { type: Number, enum: [0, 1, 2, 3, 4, 5] },
      tuesday: { type: Number, enum: [0, 1, 2, 3, 4, 5] },
      wednesday: { type: Number, enum: [0, 1, 2, 3, 4, 5] },
      thursday: { type: Number, enum: [0, 1, 2, 3, 4, 5] },
      friday: { type: Number, enum: [0, 1, 2, 3, 4, 5] },
      saturday: { type: Number, enum: [0, 1, 2, 3, 4, 5] },
      sunday: { type: Number, enum: [0, 1, 2, 3, 4, 5] },
    },
  ],
};

export const sessions2Model = {
  id: { type: Number, unique: true, index: true, min: 0 },
  memberId: { type: Number, min: 1 },
  date: {
    type: String,
    required: true,
    validator: dateIsSunday,
  },
  sessions: [
    {
      type: { type: String, enum: ['', 'STRENGTH', 'CONDITIONING'] },
      rpe: { type: Number, enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
      duration: { type: Number, min: 0 },
    },
  ],
};
