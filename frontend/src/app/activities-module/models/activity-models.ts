export enum EActivityType {
  Blank = '',
  Boxing = 'BOXING',
  Floor = 'FLOOR',
  Run = 'RUN',
  Walk = 'WALK',
}

export interface IActivityWithoutId {
  memberId: number;
  date: string;
  type: EActivityType;
  duration: number | '';
  comment: string;
}

export interface IActivity extends IActivityWithoutId {
  id: number;
}

export const displayedColumns: string[] = [
  'date',
  'type',
  'duration',
  'comment',
  'edit',
];
export const activityTypeNames: EActivityType[] = Object.keys(EActivityType)
  .map((key) => {
    if (new RegExp(/[a-z]/g).test(key)) {
      return EActivityType[key];
    }
  })
  .filter((key) => !!key); // no blank

export const enum EMode {
  'ADD',
  'EDIT',
  'DELETE',
}

export interface ICount {
  count: number;
}

/* cannot enter dates early than this */
export const EARLIEST_DATE = new Date('June 27, 2021');
