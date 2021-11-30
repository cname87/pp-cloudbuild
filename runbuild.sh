#!/usr/bin/env bash

# Runs a cloud build - see echoed detail below


# Exit when any command fails
set -e
# Keep track of the last executed command
declare last_command
declare current_command
trap 'last_command=$current_command; current_command=$BASH_COMMAND' DEBUG
# Echo a message before exiting - any code other than 0 is an error
trap 'echo "\"${last_command}\" command filed with exit code $?."' EXIT

# Read in variables
# Get the directory containing this script and then source the set-variables script - ensure the set-variables script is in the configured path
SCRIPT_DIR="${0%/*}"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}"/utils-build/set-variables.sh

# Utility confirm function
function confirm(){
  read -r -s -n 1 -p "Press any key to confirm or CTRL-C to cancel..."
  echo ""
}

echo -e "\nThis builds the backend and frontend Docker images and pushes them to the GCR registry.  It then deploys the images to the production Cloud Run environment. You must test the deployment manually by checking the website as no unit or e2e tests are run."
echo -e "------------------------------------------------------------------"
echo -e "- The current working directory is ${PWD} - make sure that this is the project root directory"
echo -e "- Confirm that the node version in the backend Dockerfile matches the version used during development (using 'nvm list')"
echo -e "- The backend application will be pushed to: ${BACKEND_IMAGE}"
echo -e "- The frontend application will be pushed to: ${FRONTEND_IMAGE}"
echo -e "- The cloud run region is: ${CLOUD_RUN_REGION}\n"

confirm

# # Builds and pushes the backend image
# cd ./backend || exit
# # Builds on the local environment creating a dist directory */
# npm run build
# # Runs the Dockerfile which copies package.json, installs dependencies, copies local directories including the dist directory, and sets the start command to dist/app.js
# docker build --no-cache --tag="${BACKEND_IMAGE}":latest .
# # Pushes the image to the container registry
# docker push "${BACKEND_IMAGE}":latest
# cd ..

# Builds and pushes the frontend image
cd ./frontend || exit
# Builds on the local environment creating a dist directory */
# npm run build:prod
# Runs the Dockerfile which installs nginx and copies the local dist directory, and sets the start command to run nginx
docker build --no-cache --tag="${FRONTEND_IMAGE}":latest .
docker push "${FRONTEND_IMAGE}":latest
cd ..

# gcloud run services update pp-backend --image="${BACKEND_IMAGE}":latest \
# --region="${CLOUD_RUN_REGION}" --quiet

gcloud run services update pp-frontend --image="${FRONTEND_IMAGE}":latest \
--region="${CLOUD_RUN_REGION}" --quiet

# Test the production deployment by browsing to project-perform.com
# You can deploy the backend with environment variable DEBUG = PP* and DB_LOGS = log to see logs from the production server.
# To get frontend logs, uou must build the frontend locally with npm run:dev, which produces an image with logs enabled, and then deploy this.
