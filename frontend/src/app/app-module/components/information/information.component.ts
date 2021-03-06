import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NGXLogger } from 'ngx-logger';

import { AuthService } from '../../services/auth-service/auth.service';

/**
 * This component displays key error information along with advice to the user to click on a tab to restart. It is routed to by the error handler after an error is thrown.
 * The default information displayed shows 'page not found'.
 * If a mode of 'error' is passed in via a url query parameter the information shown is relevant to an unexpected error.
 */
@Component({
  selector: 'app-information',
  templateUrl: './information.component.html',
  styleUrls: ['./information.component.scss'],
})
export class InformationComponent implements OnInit {
  /* component mode determines text and prompts */
  mode = '';

  /* default information if no mode passed in, i.e. page not found */
  header = '';

  /* advice */
  hint = '';

  /* go back button */
  isGoBackVisible = false;

  /* card click action */
  clickAction = () => {
    /* initialise as empty function */
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
    private logger: NGXLogger,
  ) {
    this.logger.trace(
      `${InformationComponent.name}: Starting InformationComponent`,
    );
  }

  ngOnInit(): void {
    /* get the component mode from the query parameter */
    this.mode = this.route.snapshot.paramMap.get('mode') as string;

    /* set up error only if a mode query parameter of 'error' is passed in */
    if (this.mode === 'error') {
      this.header = 'Unexpected Error!';
      this.hint = 'Click on the back button';
      this.isGoBackVisible = true;

      /* set up log in only if a mode query parameter of 'login' is passed in */
    } else if (this.mode === 'login') {
      this.auth.isAuthenticated$.subscribe({
        next: (loggedIn) => {
          this.header = loggedIn ? 'LOG OUT' : 'LOG IN';
          this.hint = loggedIn
            ? "Click here or on the 'LOGOUT' button above to log out"
            : "Click here or on the 'LOGIN' button above to log in";
          this.isGoBackVisible = false;
          this.clickAction = loggedIn
            ? () => this.auth.logout()
            : () => this.auth.login();
        },
      });
      /* else set up the page not found */
    } else {
      this.header = 'Page Not Found';
      this.hint = '';
      this.isGoBackVisible = true;
    }
  }

  goBack(): void {
    this.router.navigate([`/`]);
  }
}
