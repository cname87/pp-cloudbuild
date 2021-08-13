# Build a Docker image containing Node and Puppeteer to be used for unit and e2e tests during a cloud build

This is required to provide a Docker image containing Node & Puppeteer that can be used as the basis of the application used during a Cloudbuild for unit and e2e testing.  Puppeteer is required for tests which use Chrome headless and it requires specific libraries that are not in the standard Node images.

## Instructions

### Summary

You run a gcloud build command which runs a local cloudbuild.yaml file, which in turn calls Docker to build using a local Dockerfile.  The resulting image is pushed to the project GCP Registry.

1. Change to this directory (which hosts the required cloudbuild.yaml and Dockerfile files).
2. Type: gcloud builds submit --config=cloudbuild.yaml .

This should push a Docker image to the GCP project 'project-perform' Container Registry named 'gcr.io/project-perform/node-with-puppeteer' and add the tags ':latest, and also a tag containing the node version used.  

This image is now available to be used in a Dockerfile build step.

Note:
You set the Node version by editing both Dockerfile and the associated tag in cloudbuild.yaml.
The Node version used should correspond to the Node version used in the backend Dockerfile so the testing closely matches the production environment.

You only need to rebuild this image if the version of Node has to to be changed (because the production environment has moved to a new version). In that case you will need to edit the local Dockerfile to pull the right base node image.  You also need to update the local cloudbuild.yaml file to change the version tag to denote the new node version.  The Dockerfile that actually uses the built image uses the 'latest' tag and therefore does not need to be edited.
