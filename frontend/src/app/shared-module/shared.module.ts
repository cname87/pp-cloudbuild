import { NgModule, ErrorHandler } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';

import { MaterialModule } from './material-module/material.module';

import { ActionButtonComponent } from './components/action-button/action-button.component';
import { TextInfoComponent } from './components/text-info/text-info.component';
import {
  ErrorHandlerService,
  RollbarService,
  rollbarFactory,
} from './services/error-handler-service/error-handler.service';
import { httpInterceptorProviders } from './http-interceptors';
import { FormlyBaseModule } from './formly-base-module/formly-base.module';

@NgModule({
  declarations: [ActionButtonComponent, TextInfoComponent],
  imports: [CommonModule, FlexLayoutModule, MaterialModule],
  exports: [
    CommonModule,
    FlexLayoutModule,
    FormlyBaseModule,
    MaterialModule,
    ActionButtonComponent,
    TextInfoComponent,
  ],
  providers: [
    {
      provide: ErrorHandler,
      useClass: ErrorHandlerService,
    },
    { provide: RollbarService, useFactory: rollbarFactory },
    httpInterceptorProviders,
  ],
})
export class SharedModule {}
