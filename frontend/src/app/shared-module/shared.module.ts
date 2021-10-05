import { NgModule, ErrorHandler } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';

import { MaterialModule } from './material-module/material.module';

import { MemberBannerComponent } from './member-banner/member-banner.component';

import {
  ErrorHandlerService,
  RollbarService,
  rollbarFactory,
} from './error-handler-service/error-handler.service';
import { httpInterceptorProviders } from './http-interceptors';

@NgModule({
  declarations: [MemberBannerComponent],
  imports: [CommonModule, FlexLayoutModule, MaterialModule],
  exports: [
    CommonModule,
    FlexLayoutModule,
    MaterialModule,
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
