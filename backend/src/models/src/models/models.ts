/**
 * All database models are defined here.
 *
 * NOTE:  These must match the frontend models.
 */

export const memberModel = {
  id: { type: Number, unique: true, index: true },
  name: String,
};

export const questionaireModel = {
  id: { type: Number, unique: true, index: true },
  memberId: Number,
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

export const scoresModel = {
  id: { type: Number, unique: true, index: true },
  /* I tried creating a compond index using Mongoose but failed so create a compound index manually in mongosh with the command 'test> db.getCollection('darren.young22@outlook.com_scores').createIndex({memberId: 1, date: 1}, {unique: true})' */
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
