import { NgModule, ErrorHandler } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';

import { MaterialModule } from './material-module/material.module';

import { ActionButtonComponent } from './components/action-button/action-button.component';
import { MemberBannerComponent } from './components/member-banner/member-banner.component';

import {
  ErrorHandlerService,
  RollbarService,
  rollbarFactory,
} from './services/error-handler-service/error-handler.service';
import { httpInterceptorProviders } from './http-interceptors';
import { FormlyBaseModule } from './formly-base-module/formly-base.module';

@NgModule({
  declarations: [ActionButtonComponent, MemberBannerComponent],
  imports: [CommonModule, FlexLayoutModule, MaterialModule],
  exports: [
    CommonModule,
    FlexLayoutModule,
    FormlyBaseModule,
    MaterialModule,
    ActionButtonComponent,
    MemberBannerComponent,
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
