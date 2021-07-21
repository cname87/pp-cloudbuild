/**
 * Health questionaire information.
 */

import { Observable } from 'rxjs';
import { IMember } from './member';

export interface IQuestionaireWithoutId {
  date: string;
  sleep: number | '';
  fatigue: number | '';
  muscle: number | '';
  stress: number | '';
  motivation: number | '';
  health: number | '';
  diet: number | '';
  mood: number | '';
  comment: string;
  memberId: number;
}
export interface IQuestionaire extends IQuestionaireWithoutId {
  id: number;
}

export const enum QUESTIONAIRE_MODE {
  'ADD',
  'EDIT',
}
export interface IQuestionairesTable {
  member: Observable<IMember>;
  questionaires: Observable<IQuestionaire[]>;
}

export interface IQuestionaireChange {
  mode: QUESTIONAIRE_MODE;
  member$: Observable<IMember>;
  questionaire$: Observable<IQuestionaire> | Observable<IQuestionaireWithoutId>;
}

/* list all questionaire fields here and then add to other variables below */
/* NOTE: You must ensure the backend data model matches this */

interface IAllFields {
  readonly [index: string]: string;
}

export const allFields: IAllFields = {
  date: 'date',
  sleep: 'sleep',
  fatigue: 'fatigue',
  muscle: 'muscle',
  stress: 'stress',
  motivation: 'motivation',
  health: 'health',
  diet: 'diet',
  mood: 'mood',
  comment: 'comment',
  edit: 'edit',
  id: 'id',
  memberId: 'memberId',
};

/* list all questionaire query items here first */
export enum QuestionaireType {
  Sleep = 'QUALITY OF SLEEP',
  Fatigue = 'FATIGUE',
  Muscle = 'MUSCLE SORENESS',
  Stress = 'STRESS',
  Motivation = 'MOTIVATION',
  Health = 'HEALTH',
  Diet = 'NUTRITION',
  Mood = 'MOOD',
}

export const QuestionaireTypeNames: QuestionaireType[] = Object.keys(
  QuestionaireType,
)
  .map((key) => {
    if (new RegExp(/[a-z]/g).test(key)) {
      return QuestionaireType[key];
    }
  })
  .filter((key) => key !== undefined);

/* used to display questionaire and questionaaires table queries */
export const questionareTable: [string, string, string, number][] = [
  [QuestionaireType.Sleep, allFields.sleep, 'excellent sleep', 5],
  [QuestionaireType.Fatigue, allFields.fatigue, 'no fatigue', 5],
  [QuestionaireType.Muscle, allFields.muscle, 'no soreness', 5],
  [QuestionaireType.Stress, allFields.stress, 'no stress', 5],
  [QuestionaireType.Motivation, allFields.motivation, 'great motivation', 5],
  [QuestionaireType.Health, allFields.health, 'great health', 5],
  [QuestionaireType.Diet, allFields.diet, 'great nutrition', 5],
  [QuestionaireType.Mood, allFields.mood, 'great mood', 5],
];

/* used by the questionaires table header and footer rows */
export const displayColumns = [
  allFields.date,
  allFields.sleep,
  allFields.fatigue,
  allFields.muscle,
  allFields.stress,
  allFields.motivation,
  allFields.health,
  allFields.diet,
  allFields.mood,
  allFields.comment,
  allFields.edit,
];
