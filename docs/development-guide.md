# Development

## Development Environment

The development environment used was VSCode IDE running on a laptop on Ubuntu.  All required products such as gcloud, docker, kubectl, etc are installed under Ubuntu.

It is possible to develop on a laptop running Windows 10.  In this case set up a Ubuntu distribution on wsl (Windows Subsystem for Linux) and run VSCode using Remote WSL, which runs VSCode in Windows and connects to a server on the Linux file system.  Configure so the Windows PATH is not visible to the command line and install gcloud, etc on the Linux filesystem (as otherwise it runs super slow).  Install Docker Desktop for Windows but configure so it is linked to the wsl subsystem.

### Node versions

The nvm package allows you load various node versions.

- Use the LTS version during development and test.
- Reference that version in the launch.json file so that version is used for VSCode debug launches.
- Reference that version in the backend Dockerfile so the built Docker image uses the same version in production.
- Reference that version in the nodeWithPuppeteer Dockerfile, which image is used during cloud builds so that the cloud build tests use the same version.  

## Installing on a local environment from GitHub

Once you've cloned the repo you need to download the secrets files that are not stored on Github.

First you need to manually download the GCP Storage key, from './certs/gcpStorage/'Copy of gcpStorageKey.json' on GCP Storage to ./certs/gcpStorage/gcpStoragekey.json' in the local project.  This is needed for the application to access the Cloud Storage account:

- Access GCP Cloud Storage from the browser and manually download 'Copy of gcpStorageKey.json' from the certs/gcpStorage directory on GCP Storage to the local 'certs/gcpStorage' directory.

Second, download the secrets files from GCP Cloud Storage:

- Run the loadSecretsFiles scripts from both the frontend and backend package.json files - type 'npm run loadSecretsFiles' in /frontend and /backend.

Note: The backend utility downloads the secrets in the project root and these are stored in the backend directory on GCP Storage in '../'.  The gcpStorageKey.json file is also stored in ./certs/gcpStorage/'Copy of gcpStorageKey.json'. If you ever change the service account access key then you just store the new key in this location as well as in the project ./certs/gcpStorage directory.

Note: A dummy file '.gitkeep' is placed in all directories that contain only secrets as they would not be created in the GitHub repo otherwise.

NOTE: The loadSecretFiles actually uploads secrets if they are in the local repo and only downloads any that are missing from GCP Storage on the GCP project with ID project-perform. The GCP project must have billing enabled for this to run.

### Install dependencies if necessary

Run 'npm install' in the frontend and backend directories.

You can run 'ncu' (install npm-check-updates globally or use npx) to check if the package.json dependencies are at their latest versions.  Only do this on a stable system, and be careful about updating dependencies with major version changes, i.e. be prepared to test and debug, or rollback.

You can run 'depcheck' (install depcheck globally or use npx) to check for any unused dependencies.  Again only do this on a stable system.

You can also:

- Run 'gcloud components update' to update gcloud SDK including kubectl.
- Upgrade Skaffold and Helm - see their installation instructions.

## Running local build

### Backend build

Run 'npm run build' from the backend directory.
NOTE: The backend build utility runs the loadSecretsFiles script - see the note above about this script.

### Frontend build

Run 'npm run build:dev' for development, or 'npm run build:e2e' for e2e test, or 'npm run build:prod' for production, from the frontend directory.
These runs prettier on all files, then eslint, then transpiles, builds and creates a new dist directory containing the built files.

An e2e build includes setting an environment file that allows certain error tests be carried out. A production build employs optimization techniques.

Note: The scripts serve:dev, serve:e2e, and serve:production use the corresponding builds automatically to start a server running on <http://localhost:4200>.

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

## Creation of a cluster

- Change to the /utils-build directory.
- Run 'gcloud config list to check the gcloud configuration.
- If necessary, run '**./setupGcloud**.sh' to set the gcloud project, zone and region parameters.
- The clusters that are created using the following utility are named in the utility '**set-variables**.sh.
- Run the cluster creation utility '**./setup-gke-cluster**.sh' with the parameter -t. to create a test GKE cluster, e.g. named 'ppk8es-cluster-test', on GCP.
- Run the cluster creation utility '**./setup-gke-cluster**.sh' with the parameter -p. to create a production GKE cluster, e.g. named 'ppk8es-cluster-prod', on GCP.
- A kubectl context will be created in the kubectl kubeconfig file (at $HOME/.kube/config)

Note that a static ip address is reserved, (unless those lines are commented out).  This is referenced in the Ingress Controller. The static ip address incurs a charge => delete when not in use.

See the note [here](###static-ip-address) about static-ip address considerations when both a test and a production cluster are provisoned at the same time.

## Deletion of a cluster

- Change to the /utils-build directory.
- The clusters that are deleted using the following utility are named in the utility '**set-variables**.sh.
- Run the cluster deletion utility '**./teardown-gke-cluster**.sh' with the parameter -t. to delete the test GKE cluster, e.g. named 'ppk8es-cluster-test', on GCP.
- Run the cluster creation utility '**./setup-gke-cluster**.sh' with the parameter -p. to delete the production GKE cluster, e.g. named 'ppk8es-cluster-prod', on GCP.
- The script presents links to allow you check that the external loadbalancer and ssl certificate are deleted.
- The associated kubeconfig context is automatically deleted.

Note: The lines deleting the static ip address may be commented out to preserve the static ip address.

Note: You can manually check if the static ip address is deleted by checking [this link.](https://console.cloud.google.com/networking/addresses/list?folder=&organizationId=&project=project-perform)

## Deployment to the GKE cluster for local development using Cloudbuild

You can deploy to the GKE cluster and use port forwarding to access the application.  This allows you test the application locally without worrying about a static ip address for the frontend load balancer or the ssl certificate to provide https access. (The Helm install will still attempt to provision an SSL certificate).

- Change directory to the project root - this is required before running the cloudbuild.
- Run the development cloudbuild via '**./runbuild**.sh'.  This performs a cloudbuild using './cloudbuild.yaml'. It copies the project files, installs the frontend and backend node_modules folders, builds the frontend and backend dist folders, runs frontend and backend units tests, (using Chrome Headless), builds the frontend and backend Docker images and uploads then to the GCP container registry.
- When a cloudbuild is run from runbuild.sh, the images are tagged with the version 'latest' and this must match the version set in the pp-chart values.yaml file so the images are found during deployment.
- You can comment out any steps in the devCloudbuild.yaml file to skip unnecessary steps, e.g. if you wish to skip unit tests.
- 'cloudbuild.yaml' includes the steps for Helm to install the images on to the cluster.  If you comment out these lines you can run '**./utils-build/helm-install**.sh' which upgrades or installs the Docker build images onto the GKE cluster.  (Do not add any parameter so the images are installed on the test cluster named pp-cluster-test).
- Both the runBuild.sh and the helm-install.sh utilities also forwards the local port 8080 to the frontend service.  This allows the application to be accessed on 'localhost:8080'.  To stop the port forwarding, run 'pgrep -f '[p]ort-forward' | xargs kill'.

Note: To confirm that the latest versions of node and nginx are being used in the Docker build images:

- Check the backend Dockerfile files to see that the version of node used matches that used in VSCode development and test.
- Check that the frontend DockerFile is using the latest stable version of nginx.

### Deployment debug

- Run 'kubectl get all' or the GCP dashboard to inspect the cluster deployment.
- Run 'kubectl describe pod-id' to see the manifest and events of a given pod.
- Run 'kubectl logs pod-id' to see the internal logs of a given pod.
- To delete all resources from a cluster run 'kubectl delete all --all'.

## Deployment to the GKE Cluster for local development using Skaffold

The project includes a skaffold.yaml and associated VSCode launch configurations.  Skaffold builds the Docker images and deploys them to a Kubectl context defined in skaffold.yaml. It is debuggable if run by mouse or f5 from the launch configuration (and not debuggable if run by Ctrl+f5) and rebuilds on change if run from the script. It also streams the cluster logs to the terminal. The frontend is port mapped to localhost:8080 so you can develop the microservices without worrying about external ingress i.e. the static ip address or ssl certificate.

To run Skaffold run the 'Run Skaffold On Kubernetes' launch configuration as detailed in .vscode/launch.json, or run '**./utils-build/skaffold-run**.sh'.   The cluster defined in skaffold.yaml is the test cluster named 'pp-cluster-test', i.e. the GKE test cluster must be running.

This builds the frontend Dockerfile and uploads the Docker image to gcr.io/project-perform/pp-frontend/development. Note that the Dockerfile just copies the dist directory to an NGINX server, i.e. it does not build the frontend. Therefore build the frontend using 'nom run build:prod' first.
It then builds the backend Dockerfile and uploads the Docker image to gcr.io/project-perform/pp-backend/development.

Note: Skaffold is fragile so not recommended unless debugging or restart on change is needed. Run the launch configuration in non-debuggable mode, via Ctrl-f5, for best reliability - see note below on debugging. It is best to set it to clean up after itself unless you are debugging a run failure. If it has not cleaned up, then it may be necessary to delete all cluster resources using 'kubectl delete all --all' as sometimes it waits forever for service termination.

Note: You can attach a debugger to the backend service using the 'Debug Backend on Kubernetes' launch configuration. See instructions in the launch.json file.

Note: The frontend service is a simple nginx server so debug is not useful => debug frontend issues locally during development. You could run a frontend development build, deploy via Skaffold and then use Chrome Dev Tools if necessary.

## External acesss to the GKE cluster

You can develop without access from an external ip address using kubectl port mapping.  However, external access is needed in production.

NOTE: Do not commit ANY changes to the Ingress or ManagedCertificate resource yaml files without careful testing first.  This will involve applying a static ip address to the test cluster - see note below.

Refer to the GCP [page](https://cloud.google.com/kubernetes-engine/docs/concepts/ingress#default_backend) for information on GKE Ingress.

"In GKE, an Ingress object defines rules for routing HTTP(S) traffic to applications running in a cluster. An Ingress object is associated with one or more Service objects, each of which is associated with a set of Pods. When you create an Ingress object, the GKE Ingress controller creates a Google Cloud HTTP(S) Load Balancer and configures it according to the information in the Ingress and its associated Services."

The Ingress object includes reference to a static ip address and a ManagedCertificate resource which sets up a Google-managed SSL certificate.  These are necessary to allow external address from an internet domain such as project.perform.

### Static IP address

The GKE Ingress Controller is configured via the app-ingress.yaml file.  The Ingress resource yaml file includes an annotation that refers to a named static ip address.  The same static-ip address must also be referenced in the reserved domain name project-perform.com so that the domain name routes to the ingress.

So set up a static ip address of the same name (pp-ip) as that referenced in the Ingress resource. The command to do this is included in the cluster creation utility.  You can check reserved ip addresses [here.](https://console.cloud.google.com/networking/addresses/list?project=project-perform),

Note: GCP Premium Network Tier is required to bind an Ingress to an external static IP address.

Note: A static ip address can only apply to one cluster. Ensure any test cluster is deleted before creating the production cluster so the production cluster has an use of the static ip address. If the production cluster is running then the test cluster will not have external access but that is ok as you can use port-mapping to access the front end (or backend) services. If you need to test external access on the test cluster whilst a production cluster is up then create a second static ip address using a different name resource (e.g. pp-ip2') and edit the Ingress annotation to refer to this name.

### Reserved domain name

An Internet domain name in referenced in the Ingress resource - 'project-perform'.  So procure the project.perform domain and have it managed by Cloud DNS, (if not already done).  Configure the DNS records for the project-perform domain to point to the static IP address. Refer to the [Managing Records[(<https://cloud.google.com/dns/records>)] guide for details.

### Provisioning HTTPS

Google Managed Certificate is used to provide tsl access via a certificate referenced in a ManagedCertificate resource yaml file that is referenced in the Ingress resource yaml file.

When you install the Helm chart on to the GKE cluster the ssl cert is created automatically.

Note that it can take up to 30 minutes for the ssl certificate to be provisioned i.e. before project-perform.com becomes operational.  To check if it's operational go to the GCP home project -> Network Services -> Load balancing -> advanced -> certificates page i.e. [click here](https://console.cloud.google.com/net-services/loadbalancing/advanced/sslCertificates/list?project=project-perform&sslCertificateTablesize=50) and click on the certificate, and check its 'Status'.

### Costs

- The forwarding rule in the Load Balancer is expensive, i.e. ~ 20 euro a month.
- The static ip address is not expensive unless unassigned, so cancel it if you tear the cluster down long-term. The command to delete the static ip address is included in the cluster tear-down utility (but is commented out as you should only delete the static ip address if tearing down the cluster long term.
- The ssl certificate appears to be free.

## Notes on CI / CD

## Development lifecycle

The full lifecycle of an application development is:

- The production cluster is up and running on GKE with the previously deployed version.
- Develop the application locally:  
  - Debug the microservices using local builds and servers.
  - Use cloudbuild.yaml, with steps commented out as appropriate, (and/or Skaffold, and/or manual builds and tests) to locally build and push images to the GCP Container Registry.
  - Create a test GKE cluster and deploy the application to the test cluster using devCloudbuild.yaml, helm-install.sh, or manually. (Create the test cluster after the production cluster so it does not tie up the ssl certificate. The test cluster will not have external access but will use local port forwarding).  
  - Complete a clean cloudbuild.yaml run on the test GKE cluster.
  - Commit to the master branch on a local repo when development is complete.
- Push the local git master to the remote origin.
  - This triggers a cloudbuild automatically if GCP is so configured.  If not, trigger a cloudbuild via a manual GCP trigger.
  - This runs the cloudbuild.yaml file, using production variables, and commits the Helm charts to the git repo.
  - It deploys to the production GKE cluster which must be running.

### The git repo

The git repo has three branches:

- The master branch contains the application code excluding any secrets. (As noted above use a utility to download secrets to a local clone).  The master repo is used to build the images that are pushed to the GCP Container Registry and are deployed to the GKE cluster via a Helm chart.
- The 'candidate' branch contains Helm charts that are committed by a cloudbuild yaml file. They are charts that have passed required tests and are suitable for installing on the production cluster. If they are commented 'Development build commit' then that chart commit was a result of a test run.
- The 'production' branch which contains Helm charts that are committed by a cloudbuild.yaml file.  They are charts that have been installed on the production cluster by a cloudbuild yaml file, unless they are commented 'Development build commit' which means that chart commit was a result of a test run.

### Cloudbuild yaml files

A cloudbuild yaml file allows a cloud build to be run to build, test and deploy the application.

### Images required as they are used in the cloudbuild yaml files

Cloudbuild requires the following images to exist in the GCP Container Registry:

- 'gcr.io/project-perform/node-with-puppeteer'.  See 'backend/utils-build/buildNodeWithPuppeteer/README.md' for how to create this.
- 'gcr.io/project-perform/helm'.  See '/utils-build/build-helm-cloudbuilder.sh'.
- 'gcr.io/project-perform/yq'.  See '/utils-build/build-yq-cloudbuilder.sh'.

You need to build these using the utilities in ./utils-build.  After a successful Cloud Build production run (from Git) you must tag the version used in a release manually with the SHORT_SHA tag so the exact build used in a release can be identified.

Note: You may need to recreate an image if you get an 'unknown blob' error.

### Triggers and build locations for a cloud build

A cloud build can be triggered locally or from a GCP cloud trigger..

- A build triggered locally can be run in two ways:
  - Build and run locally and use the local files by running 'cli-build-local'.
  - Build and run on the GCP cloud and use the local files by running 'gcloud builds submit'.
- The utility '**./utils-build/runbuild**.sh' is used for the above.

- A build triggered on GCP can be run in two ways
  - Triggered via a manual trigger on GCP Cloudbuild and build on the cloud using the Github repository files - see [here.](https://console.cloud.google.com/cloud-build/triggers?project=project-perform)
- Triggered automatically following a Github check-in (if automatic triggers is configured on Cloudbuild) and using the Github repository files.
  
To save on potential fees use local builds except for testing and running production builds. The local build is also faster. However, the local environment can run out of disk space and then run very slow. In particular, the git steps use a lot of root disk space. Therefore it may be necessary to clear the local environment disk space - see the utility '**./utils-build/clear-disspace**.sh'.
h
NOTE: The local build option does not run under Windows and does not appear to run on WSL (Windows Subsystem for Linux).

NOTE: Variables referenced in cloudbuild.yaml are set in 3 places:

- Defaults are set in the cloudbuild.file. These are targeted at build run from GCP cloud using the Github files, i.e. a production build.
- For a local build the utility ./runbuild.sh passes in variables to the cloudbuild yaml file which overrides the defaults set in that file, i.e. a test build.
- A build triggered from GCP can override variables, for example, a BUILD_TAG variable is set, but the cloudbuild.yaml file defaults are configured to match a production build, so few variables are overwritten.

### Running a cloudbuild

The utility ./utils-build/runbuild.sh is used to locally manually trigger builds. See the detail in that file.

The steps in the cloudbuild.yaml file:

- Downloads secrets that are not stored on the git repo.
- Installs and builds the frontend and backend applications, units tests them, and then builds the frontend and backend images and pushes them to the cloud registry.
- E2e tests the built images.
- Edits the Helm Chart to point to the new images.
- Clones the repo, copies the Helm chart to be deployed to the 'candidate' branch on the cloned repo, commits and then pushes back to the 'candidate' branch of the remote repo.
- Deploys the Helm chart to the configured Kubernetes cluster and runs an e2e test on the configured cluster.
- Copies the updated Helm chart to the 'production' branch of the cloned repo and pushes to the 'production branch' of the remote repo.
- If the cluster in use is the production cluster then it runs an e2e test on the production cluster.

Note: To update your local repo 'candidate' and 'production' branches to match the changes in the remote repo checkout the 'production' branch and type 'git pull origin' and do the same with the 'candidate' branch.

Note: To push to the remote Git repo you need to set up a secret key on GCP secrets and load the same as a deploy key on the Git repo - see [here.](https://cloud.google.com/cloud-build/docs/access-private-github-repos)

Note: Update a log Git tag 'v1x.y.z' and push to the remote after a successful Cloud Build production build (via Git).

### Storing production files

- The production images are stored in gcr.io/project-perform/pp-backend/production as per the cloudbuild production settings.
- Manually copy the secrets from the Cloud Storage buckets to another storage bucket named 'project-perform-release-COMMIT-SHA' where COMMIT-SHA is taken from the git commit.
