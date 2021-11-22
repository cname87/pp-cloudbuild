import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
  name: 'setField',
  pure: true,
})
export class SetFieldPipe implements PipeTransform {
  transform(name: string, rowIndex: number): boolean {
    console.log(`Column.name: ${name}`);
    console.log(`RowIndex: ${rowIndex}`);
    return name === this.showObject.name && rowIndex === this.showObject.row;
  }
}
