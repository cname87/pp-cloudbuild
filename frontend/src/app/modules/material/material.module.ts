import { NgModule } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatNativeDateModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatRadioModule } from '@angular/material/radio';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatPaginatorModule } from '@angular/material/paginator';

const material = [
  MatToolbarModule,
  MatButtonModule,
  MatTabsModule,
  MatInputModule,
  MatIconModule,
  MatDividerModule,
  MatSelectModule,
  MatListModule,
  MatCardModule,
  MatProgressBarModule,
  MatCheckboxModule,
  MatNativeDateModule,
  MatDatepickerModule,
  MatDialogModule,
  MatFormFieldModule,
  MatRadioModule,
  MatTableModule,
  MatPaginatorModule,
  MatSortModule,
];

@NgModule({
  imports: [material],
  exports: [material],
})
export class MaterialModule {}
