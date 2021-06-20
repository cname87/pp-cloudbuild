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
export const allFields: any = {
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
  Diet = 'DIET',
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
export const questionareTable: [string, string, number][] = [
  [QuestionaireType.Sleep, allFields.sleep, 5],
  [QuestionaireType.Fatigue, allFields.fatigue, 5],
  [QuestionaireType.Muscle, allFields.muscle, 5],
  [QuestionaireType.Stress, allFields.stress, 5],
  [QuestionaireType.Motivation, allFields.motivation, 5],
  [QuestionaireType.Health, allFields.health, 5],
  [QuestionaireType.Diet, allFields.diet, 5],
  [QuestionaireType.Mood, allFields.mood, 5],
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
