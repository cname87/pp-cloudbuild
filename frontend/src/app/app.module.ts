/* angular */
import { NgModule, ErrorHandler, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MAT_DATE_LOCALE } from '@angular/material/core';
import { MatMomentDateModule } from '@angular/material-moment-adapter';
import {
  MatFormFieldDefaultOptions,
  MAT_FORM_FIELD_DEFAULT_OPTIONS,
} from '@angular/material/form-field';
import { FlexLayoutModule } from '@angular/flex-layout';

/* 3rd party */
import { LoggerModule } from 'ngx-logger';
import { ToastrModule } from 'ngx-toastr';
import { FormlyModule } from '@ngx-formly/core';
import { FormlyMaterialModule } from '@ngx-formly/material';
import { FormlyMatDatepickerModule } from '@ngx-formly/material/datepicker';
import { FormlyMatToggleModule } from '@ngx-formly/material/toggle';
import { NgxChartsModule } from '@swimlane/ngx-charts';

/* local */
import { environment } from '../environments/environment';
import { AppComponent } from './components/app/app.component';
import { MembersListComponent } from './components/members-list/members-list.component';
import { MemberSearchComponent } from './components/member-search/member-search.component';
import { MemberDetailComponent } from './components/member-detail/member-detail.component';
import { MemberSessionComponent } from './components/member-session/member-session.component';
import { MemberQuestionaireComponent } from './components/member-questionaire/member-questionaire.component';
import { MemberSessionsComponent } from './components/member-sessions/member-sessions.component';
import { MemberQuestionairesComponent } from './components/member-questionaires/member-questionaires.component';
import { MessagesComponent } from './components/messages/messages.component';
import { MemberCardComponent } from './components/member-card/member-card.component';
import { MaterialModule } from './modules/material/material.module';
import { MemberInputComponent } from './components/member-input/member-input.component';
import { InformationComponent } from './components/information/information.component';
import {
  ErrorHandlerService,
  RollbarService,
  rollbarFactory,
} from './shared/error-handler-service/error-handler.service';
import { RequestCacheService } from './shared/caching-service/request-cache.service';
import { httpInterceptorProviders } from './shared/http-interceptors';
import { E2E_TESTING } from './config';
import { CallbackComponent } from './components/callback/callback.component';
import { ProfileComponent } from './components/user-profile/user-profile.component';
import { LoginComponent } from './components/login/login.component';
import { NavComponent } from './components/nav/nav.component';
import { AuthService } from './shared/auth-service/auth.service';
import { AppLoadService } from './shared/app-load.service/app-load.service';
import { MemberDetailResolverService } from './shared/resolvers/member-detail-resolver.service';
import { MembersListResolverService } from './shared/resolvers/members-list-resolver.service';
import { AppRoutingModule } from './router/app.routing.module';
import { SessionsChartComponent } from './components/sessions-chart/sessions-chart.component';
import { MemberBannerComponent } from './components/member-banner/member-banner.component';

export function initApp(appLoadService: AppLoadService) {
  return () => appLoadService.initApp();
}

const appearance: MatFormFieldDefaultOptions = {
  appearance: 'outline',
};

@NgModule({
  imports: [
    /* angular modules */
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    HttpClientModule,
    BrowserAnimationsModule,
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
    /* local modules */
    MaterialModule,
    ReactiveFormsModule,
    FormlyModule.forRoot({
      extras: { lazyRender: true },
      validationMessages: [
        { name: 'required', message: 'This field is required' },
      ],
    }),
    FormlyMaterialModule,
    FormlyMatDatepickerModule,
    FormlyMatToggleModule,
    MatMomentDateModule,
    NgxChartsModule,
  ],
  declarations: [
    AppComponent,
    MembersListComponent,
    MemberSearchComponent,
    MemberDetailComponent,
    MemberSessionComponent,
    MemberQuestionaireComponent,
    MemberSessionsComponent,
    MemberQuestionairesComponent,
    MessagesComponent,
    MemberCardComponent,
    MemberInputComponent,
    InformationComponent,
    CallbackComponent,
    ProfileComponent,
    LoginComponent,
    NavComponent,
    SessionsChartComponent,
    MemberBannerComponent,
  ],
  bootstrap: [AppComponent],
  providers: [
    AuthService,
    {
      provide: ErrorHandler,
      useClass: ErrorHandlerService,
    },
    { provide: RollbarService, useFactory: rollbarFactory },
    RequestCacheService,
    httpInterceptorProviders,
    { provide: E2E_TESTING, useValue: environment.e2eTesting },
    {
      provide: APP_INITIALIZER,
      useFactory: initApp,
      deps: [AppLoadService],
      multi: true,
    },
    MemberDetailResolverService,
    MembersListResolverService,
    { provide: MAT_DATE_LOCALE, useValue: 'en-GB' },
    {
      provide: MAT_FORM_FIELD_DEFAULT_OPTIONS,
      useValue: appearance,
    },
  ],
})
export class AppModule {}
