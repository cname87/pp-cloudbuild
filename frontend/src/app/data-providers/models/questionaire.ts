/**
 * Health questionaire information.
 */

import { Observable } from 'rxjs';
import { IMember } from './member';

export enum QuestionaireType {
  Sleep = 'QUALITY OF SLEEP',
  Fatigue = 'FATIGUE',
  Muscle = 'MUSCLE SORENESS',
  Stress = 'STRESS',
  Motivation = 'MOTIVATION',
  Health = 'HEALTH',
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

export interface IQuestionaireWithoutId {
  date: string;
  sleep: number | '';
  fatigue: number | '';
  muscle: number | '';
  stress: number | '';
  motivation: number | '';
  health: number | '';
  mood: number | '';
  memberId: number;
  comment: string;
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
