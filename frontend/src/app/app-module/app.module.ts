/* angular */
import { NgModule, APP_INITIALIZER } from '@angular/core';
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
import { E2E_TESTING } from '../common/configuration';
import { AppLoadService } from '../common/services/app-load.service/app-load.service';
import { AppComponent } from './components/app/app.component';
import { MembersListComponent } from './components/members-list/members-list.component';
import { MemberDetailComponent } from './components/member-detail/member-detail.component';
import { MemberInputComponent } from './components/member-input/member-input.component';
import { InformationComponent } from './components/information/information.component';
import { CallbackComponent } from './components/callback/callback.component';
import { LoginComponent } from './components/login/login.component';
import { NavComponent } from './components/nav/nav.component';

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
      timeOut: 5000,
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
    { provide: E2E_TESTING, useValue: environment.e2eTesting },
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      deps: [AppLoadService],
      multi: true,
    },
  ],
})
export class AppModule {}
