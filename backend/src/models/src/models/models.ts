/**
 * All database models are defined here.
 *
 * NOTE:  These must match the frontend models.
 */

export const memberModel = {
  id: { type: Number, unique: true, index: true, min: 0 },
  name: { type: String },
};

const dateIsSunday = (value: number): boolean => {
  const enum DayOfTheWeek {
    'Sunday' = 0,
  }
  return new Date(value).getDay() === DayOfTheWeek.Sunday;
};

export const scoresModel = {
  id: { type: Number, unique: true, min: 0 },
  memberId: { type: Number, index: true, min: 1 },
  date: {
    type: Date,
    index: true,
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
        required: true,
      },
      monday: { type: Number, enum: [0, 1, 2, 3, 4, 5], default: 0 },
      tuesday: { type: Number, enum: [0, 1, 2, 3, 4, 5], default: 0 },
      wednesday: { type: Number, enum: [0, 1, 2, 3, 4, 5], default: 0 },
      thursday: { type: Number, enum: [0, 1, 2, 3, 4, 5], default: 0 },
      friday: { type: Number, enum: [0, 1, 2, 3, 4, 5], default: 0 },
      saturday: { type: Number, enum: [0, 1, 2, 3, 4, 5], default: 0 },
      sunday: { type: Number, enum: [0, 1, 2, 3, 4, 5], default: 0 },
    },
  ],
};

export const sessionsModel = {
  id: { type: Number, unique: true, min: 0 },
  memberId: { type: Number, min: 1 },
  date: {
    type: Date,
    index: true,
    required: true,
    validator: dateIsSunday,
  },
  sessions: [
    {
      type: {
        type: String,
        enum: ['', 'STRENGTH', 'CONDITIONING', 'SPORT'],
      },
      rpe: {
        type: Number,
        enum: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      },
      duration: { type: Number, min: 0 },
    },
  ],
};
