/**
 * All database models are defined here.
 *
 * NOTE:  These must match the frontend models.
 */

export const memberModel = {
  id: { type: Number, unique: true },
  name: String,
};

export const questionaireModel = {
  id: { type: Number, unique: true },
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
  memberId: Number,
};

export const sessionModel = {
  id: { type: Number, unique: true },
  date: String,
  type: String,
  score: Number,
  duration: Number,
  metric: Number,
  comment: String,
  memberId: Number,
};

export const scoresModel = {
  id: { type: Number, unique: true },
  memberId: Number,
  date: String,
  scores: [
    {
      item: String,
      monday: Number,
      tuesday: Number,
      wednesday: Number,
      thursday: Number,
      friday: Number,
      saturday: Number,
      sunday: Number,
    },
  ],
};
