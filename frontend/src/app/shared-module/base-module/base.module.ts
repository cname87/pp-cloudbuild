import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MaterialModule } from '../material-module/material.module';
import { ActionButtonComponent } from './components/action-button/action-button.component';
import { TextInfoComponent } from './components/text-info/text-info.component';

@NgModule({
  declarations: [ActionButtonComponent, TextInfoComponent],
  imports: [CommonModule, MaterialModule],
  exports: [
    CommonModule,
    MaterialModule,
    ActionButtonComponent,
    TextInfoComponent,
  ],
  providers: [],
})
export class BaseModule {}
