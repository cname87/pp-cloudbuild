import { HttpHeaders } from '@angular/common/http';

/**
 * Configuration object for membersService and sessionsService.
 */

interface IConfigurationParameters {
  basePath: string;
  membersPath: string;
  sessionsPath: string;
  defaultHeaders: HttpHeaders;
  withCredentials?: boolean;
}
class Configuration {
  /* note that the same server is assumed e.g. the basePath is added to localhost:8080 or whatever the host domain that is running */
  basePath: string;
  membersPath: string;
  sessionsPath: string;
  defaultHeaders: HttpHeaders;
  /* indicates whether or not cross-site Access-Control requests should be made using credentials - defaults to false */
  withCredentials?: boolean;

  constructor(configurationParameters: IConfigurationParameters) {
    this.basePath = configurationParameters.basePath;
    this.membersPath = configurationParameters.membersPath;
    this.sessionsPath = configurationParameters.sessionsPath;
    this.defaultHeaders = configurationParameters.defaultHeaders;
    this.withCredentials = configurationParameters.withCredentials;
  }
}

export const apiConfiguration = new Configuration({
  basePath: 'api-v1',
  membersPath: 'members',
  sessionsPath: 'sessions',
  defaultHeaders: new HttpHeaders(),
  withCredentials: false,
});
