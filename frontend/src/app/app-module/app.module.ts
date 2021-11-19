/* angular */
import { NgModule, ErrorHandler, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FlexLayoutModule } from '@angular/flex-layout';

/* 3rd party */
import { LoggerModule } from 'ngx-logger';
import { ToastrModule } from 'ngx-toastr';

/* local */
import { SharedModule } from '../shared-module/shared.module';
import { AppRoutingModule } from '../router-module/app.routing.module';
import { environment } from '../../environments/environment';
import { E2E_TESTING } from '../configuration/configuration';
import { AppLoadService } from './services/app-load.service/app-load.service';
import { AppComponent } from './components/app/app.component';
import { MembersListComponent } from './components/members-list/members-list.component';
import { MemberDetailComponent } from './components/member-detail/member-detail.component';
import { MemberInputComponent } from './components/member-input/member-input.component';
import { InformationComponent } from './components/information/information.component';
import { CallbackComponent } from './components/callback/callback.component';
import { LoginComponent } from './components/login/login.component';
import { NavComponent } from './components/nav/nav.component';
import {
  ErrorHandlerService,
  RollbarService,
  rollbarFactory,
} from './services/error-handler-service/error-handler.service';
import { httpInterceptorProviders } from './http-interceptors';

export function initApp(appLoadService: AppLoadService) {
  return () => appLoadService.initApp();
}

@NgModule({
  imports: [
    /* local modules */
    SharedModule,
    AppRoutingModule,
    /* angular modules */
    BrowserAnimationsModule,
    BrowserModule,
    FormsModule,
    HttpClientModule,
    /* 3rd party modules */
    FlexLayoutModule,
    LoggerModule.forRoot({
      level: environment.logLevel,
      disableConsoleLogging: false,
    }),
    ToastrModule.forRoot({
      timeOut: 3000,
      /* if toastr issued in different modules all have the message 'ERROR!' then only the first will be shown */
      preventDuplicates: true,
    }),
  ],
  declarations: [
    AppComponent,
    MembersListComponent,
    MemberDetailComponent,
    MemberInputComponent,
    InformationComponent,
    CallbackComponent,
    LoginComponent,
    NavComponent,
  ],
  bootstrap: [AppComponent],
  providers: [
    {
      provide: ErrorHandler,
      useClass: ErrorHandlerService,
    },
    { provide: RollbarService, useFactory: rollbarFactory },
    { provide: E2E_TESTING, useValue: environment.e2eTesting },
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      deps: [AppLoadService],
      multi: true,
    },
    httpInterceptorProviders,
  ],
})
export class AppModule {}
