# Application Configuration

## Backend microservice configuration

The backend microservice application is configured by means of process.env environment global variables that are loaded via either .env files or a configmap and secret yaml files in the Helm chart.  The .env files are loaded via backend/src/utils/src/loadEnvFile.ts.

There are three different environments to consider:

1. Development  
The development environment is used for development and test.  It is set if process.env.NODE_ENV is not set to either 'staging' or 'production' when app.ts is called, i.e. it is the default configuration.  The development environment is configured via the .envDevelopment file.

2. Staging  
The staging environment is used during cloud build for unit test.  It is set if process.env.NODE_ENV is set to 'staging' when app.ts is called.  The staging environment is configured via the .envStaging file.

3. Production  
The production environment is used when running from the production cluster.  It is set if process.env.NODE_ENV is set to 'production' when app.ts is called.  The production environment is configured via configmap and secret yaml files in the Helm chart stored in the pp-chart directory.  The secret yaml file is base64 encoded and is not tracked by git.

## Frontend microservice configuration

During build of the dist front end directory a specific environment.ts file is loaded depending on the build command:

- 'ng build' (default):  
Loads environment.ts - corresponds to the development environment.  
Note: Enables tracing but disables e2e test parameters.

- 'ng build -prod' (production):  
Loads environment.prod.ts - corresponds to the production environment.  
Note: Tracing and e2e test parameters disabled.

- 'ng build -e2e' (e2e):  
Loads environment.e2e.ts - corresponds to thr e2e test environment.  
Note: Tracing disabled but e2e test parameters enabled.
