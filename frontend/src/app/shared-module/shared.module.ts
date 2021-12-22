import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';

import { FormlyBaseModule } from './formly-base-module/formly-base.module';
import { BaseModule } from './base-module/base.module';

@NgModule({
  declarations: [],
  imports: [CommonModule, FlexLayoutModule, BaseModule],
  exports: [CommonModule, FlexLayoutModule, FormlyBaseModule, BaseModule],
  providers: [],
})
export class SharedModule {}
