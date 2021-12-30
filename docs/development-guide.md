# Development

Date: 30-Dec-21

## Development Environment

The development environment used was VSCode IDE running on a laptop on Ubuntu.  All required products such as gcloud, docker, kubectl, etc are installed under Ubuntu.

It is possible to develop on a laptop running Windows 10.  In this case set up a Ubuntu distribution on wsl (Windows Subsystem for Linux) and run VSCode using Remote WSL, which runs VSCode in Windows and connects to a server on the Linux file system.  Configure so the Windows PATH is not visible to the command line and install gcloud, etc on the Linux filesystem (as otherwise it runs super slow).  Install Docker Desktop for Windows but configure so it is linked to the wsl subsystem.

### Node versions

The nvm package allows you load various node versions.

- Use the LTS version during development and test.
- You can reference that version in launch.json file configurations, using 'runtimeVersion' so that version is used for VSCode debug launches.
- Reference that version in the backend Dockerfile so the built Docker image uses the same version in production.

## Installing on a local environment from GitHub

- Clone the repo from <https://github.com/cname87/pp-project-perform.git>.

  - Access GCP Cloud Storage from the browser and download the GCP Storage key.  This is stored in GCP Storage, in the 'project-perform-cb-secrets' bucket, in the file backend/../certs/gcpStorage/gcpStorageKey.json. Copy it to /certs/gcpStorage/gcpStoragekey.json' in the local project. This is needed for the application to access the Cloud Storage account:
    - Note that this file is uploaded by the backend secrets upload script - see below.
    - Note: If you ever change the service account access key then store the new key in the above locations.

- Download the application secrets files that are not stored on Github.  They are stored on GCP Cloud Storage in the'project-perform-cb-secrets' bucket. The secrets files are uploaded to this bucket every time a utility included in package.json is run in a frontend or backend build script. Download manually using gsutil.  You can also run the loadSecretsFiles scripts from both the frontend and backend package.json files - type 'npm run loadSecretsFiles' in /frontend and /backend.
  - The backend secrets files are .envDevelopment and .envProduction, and .env-staging.
  - The frontend secrets files are .env-e2e-dev, .env-e2e-production, and .env-e2e-staging.
  - The gcp key file gcpStorage.json is also uploaded by the backend script - see above.
  
Note: A dummy file '.gitkeep' is placed in all directories that contain only secrets as they would not be created in the GitHub repo otherwise.

Note: There are separate syncGCPStorageUtils.ts files in both front end and back end even though they are identical.  (TO DO: Merge them). They include the name of the GCP bucket and the path to the GCP Storage key.  The npm loadSecretFiles script calls this and it actually uploads secrets if they are in the local repo and only downloads any that are missing in the local repo.  It downloads from GCP Storage on the GCP project with ID project-perform. The GCP project must have billing enabled for this to run.

### Install dependencies if necessary

Run 'npm install' in the frontend and backend directories.

You can run 'ncu' (install npm-check-updates globally, or use npx) to check if the package.json dependencies are at their latest versions.  Only do this after you have a stable system, and be careful about updating dependencies with major version changes, i.e. be prepared to test and debug, or rollback.

You can run 'gcloud components update' to update gcloud SDK including kubectl.

## Running local builds

### Backend build

Run 'npm run build' from the backend directory.
NOTE: The backend build utility runs the loadSecretsFiles script - see the note above about this script.

### Frontend build

Run 'npm run build:dev' for development, or 'npm run build:e2e' for e2e test, or 'npm run build:prod' for production, from the frontend directory.

These runs prettier on all files, then eslint, then transpiles, builds and creates a new dist directory containing the built files.

An e2e build includes setting an environment file that allows certain error tests be carried out. A production build employs optimization techniques.

Note: The scripts serve:dev, serve:e2e, and serve:production, use the corresponding builds automatically to start a server running on <http://localhost:4200>.

## Running unit tests

Use NVM to set the version of node to use when starting npm tasks from the terminal - use the same version as is deployed in your production environment. You also need to edit the VSCode launch configuration to point at that version of node to prevent it using VSCode's node version.

### Backend tests

Run 'npm run test' from the backend directory to run the backend unit tests.

Note: If NODE_ENV is anything other than 'staging' or 'production' it will attempt to run tests on a local database.  These tests will timeout and fail if the local database is not started. To allow these run you must start the local database in advance - there is a VSCode task set up to do this.  You can check that mongo is running with "sudo systemctl status mongod".

If debug is required, the run the local tests from VSCode launch configurations - see the mocha launch configuration in .vscode/launch.json.

Note: The backend contains two utility scripts which should be tested: 'isServerUp', which checks if the server is up, and 'checkServer', which checks if the server is up and starts it if it isn't.

### Frontend tests

Run 'npm run test:dev' from the frontend directory to run frontend unit tests.
Run 'npm run test:staging' from the frontend directory to run frontend unit tests using a Chrome headless browser - this is used in CI/CD during staging.

If debug is required, the run the local tests from VSCode launch configurations - see the mocha launch configuration in .vscode/launch.json.

There is also a VSCode launch configuration that launches mocha with code coverage logging. Run this to see the unit test code coverage.

## Running e2e tests

First, start the backend server to provide a target for backend api calls, by running 'npm run startBackend' from frontend/. Then run 'npm run e2e:dev' from frontend/.

There is a VSCode launch configuration that can be used to run e2e tests and debug the jasmine spec files. See detail in the VScode launch configuration file. Note that you can also start the frontend in debug mode and debug the frontend using Chrome DevTools.

The script e2e:staging runs e2e test using headless Chrome.  It runs on a server using the staging build and running on <http://backend:8080>.  The staging script sets up this server.
The script e2e:production runs e2e tests on a production build, i.e. error testing is disabled.  It runs on the production server which must be running.

Note: A VSCode task 'Taskkill' kills all node processes and can be used to kill all running servers.

## Version control

Maintain local git master and working branches using VSCode. When a branch is complete, then merge the branch to master, test, and push to the remote origin.

## Deploying to production

Refer to the script runbuild.sh in the project root directory.  This builds, pushes docker images to the GCP Registry and deploys to GCP Cloud Run.

### Storing production files

- The production images are stored in gcr.io/project-perform/pp-backend/production and gcr.io/project-perform/pp-backend/production as per the runbuild.sh script.
- When releasing a long-lived production version then copy the secrets to the Cloud Storage bucket by manually editing the target directory in the syncGCPStorage.ts scripts, adding 'yyyymmdd-' in front of 'backend' or 'frontend'.  Thus you have a copy of the secrets associated with releases.  If you make an significant change to the secrets files then also do this.
