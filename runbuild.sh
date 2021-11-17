#!/usr/bin/env bash

# Runs a cloud build - see echoed detail below

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

echo -e "\nBuilds the backend and frontend Docker images and pushes them to the GCR registry."
echo -e "------------------------------------------------------------------"
echo -e "The current working directory is ${PWD} - this MUST be the project root."
echo -e "The backend application will be pushed to: ${BACKEND_IMAGE}"
echo -e "The frontend application will be pushed to: ${FRONTEND_IMAGE}\n"
echo -e "The cloud run region is: ${CLOUD_RUN_REGION}\n"
echo -e "Note: Confirm the node version in backend Dockerfile"
confirm

# Build and push images
cd ./backend || exit
npm run build
docker build --no-cache --tag="${BACKEND_IMAGE}" .
docker push "${BACKEND_IMAGE}"
cd ..

cd ./frontend || exit
npm run build:prod
docker build --no-cache --tag="${FRONTEND_IMAGE}" ./Dockerfile
docker push "${FRONTEND_IMAGE}"
cd ..

gcloud run services update pp-backend --image="${BACKEND_IMAGE}":latest \
--region="${CLOUD_RUN_REGION}" --quiet

gcloud run services update pp-frontend --image="${FRONTEND_IMAGE}":latest \
--region="${CLOUD_RUN_REGION}" --quiet
