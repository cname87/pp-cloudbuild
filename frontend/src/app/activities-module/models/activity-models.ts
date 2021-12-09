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

export const blankActivityWithoutId: IActivityWithoutId = {
  memberId: 0, // must be set
  date: new Date().toISOString(),
  type: EActivityType.Blank,
  duration: '',
  comment: '',
};

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
  .filter((key) => key !== undefined);
export const enum EMode {
  'ADD',
  'EDIT',
  'DELETE',
}

export interface ICount {
  count: number;
}
