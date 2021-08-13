#!/usr/bin/env bash

# Runs a cloud build - see echoed detail below

# Read in variables
# Get the directory containing this script and then source the set-variables script - ensure the set-variables script is in the configured path
echo -e "\nReading in variables..."
SCRIPT_DIR="${0%/*}"
# shellcheck source=/dev/null
source "${SCRIPT_DIR}"/utils-build/set-variables.sh

# The default cloubdbuild.yaml file path
CLOUDBUILD_PATH=${SCRIPT_DIR}"/cloudbuild.yaml"

# Default is to run a build on the local system
COMMAND="cloud-build-local --dryrun=false";
SUFFIX="cli-local"

# Defaults
BACKEND_APPLICATION="${BACKEND_DIRECTORY}/${DEVELOPMENT}"
FRONTEND_APPLICATION="${FRONTEND_DIRECTORY}/${DEVELOPMENT}"
BACKEND_IMAGE="gcr.io/${PROJECT}/${BACKEND_APPLICATION}"
FRONTEND_IMAGE="gcr.io/${PROJECT}/${FRONTEND_APPLICATION}"
BACKEND_VERSION="latest"
FRONTEND_VERSION="latest"

# A GCP Storage bucket with this tag is created to store secrets
# For a production build this will be a Github branch version tag
TEST_COMMIT_SHA='temp'

while getopts ":rpld" option; do
  case "${option}" in
    # If there is a '-r' option option then run the build on GCP
    r)
      # Build using GCP cloud build environment
      COMMAND="gcloud builds submit --config cloudbuild.yaml"
      # Signal that GCP cloud build was used
      SUFFIX="cli-cloud"
      ;;
    # If there is a '-p' option in the command line then set the production options
    p)
      BACKEND_APPLICATION="${BACKEND_DIRECTORY}/${PRODUCTION}"
      FRONTEND_APPLICATION="${FRONTEND_DIRECTORY}/${PRODUCTION}"
      BACKEND_IMAGE="gcr.io/${PROJECT}/${BACKEND_APPLICATION}"
      FRONTEND_IMAGE="gcr.io/${PROJECT}/${FRONTEND_APPLICATION}"
      BACKEND_VERSION="latest"
      FRONTEND_VERSION="latest"
      # Build using GCP cloud build environment
      COMMAND="gcloud builds submit --config cloudbuild.yaml"
      # Signal that GCP cloud build was used
      SUFFIX="cli-cloud"
      ;;
    # If there is a '-l' option option then run the build on the local PC
    l)
      COMMAND="cloud-build-local --dryrun=false";
      SUFFIX="cli-local"
      ;;
    # If there is a '-d' option then set to run a dry run to test the cloudbuild.yaml file for errors
    d) COMMAND="cloud-build-local --dryrun=true"; SUFFIX="cli-dryrun";;
    # If there an invalid option then go with above defaults
    *) ;;
  esac
done

# Utility confirm function
function confirm(){
  echo -e "\nBy default, the application is pushed to the development registry using a local cloud."
  echo -e "Run with -r, to run a GCP cloud build but with the other default options."
  echo -e "\nRun with -p to push to the production registry directory using the GCP cloud build environment."
  echo -e "Run with -l after -p, to run a local cloud build but with the other production options.\n"
  echo -e "Run with -d to run a lint of the cloudbuild.yaml file.\n"
  read -r -s -n 1 -p "Press any key to confirm or CTRL-C to cancel..."
  echo ""
}

echo -e "\nThe current working directory is ${PWD} - this MUST be the project root"
echo -e "\nThe cloudbuild path will be: ${CLOUDBUILD_PATH}"
echo -e "The build command will be: $COMMAND"
echo -e "The build will be executed using the $SUFFIX environment"
echo -e "The backend application will be pushed to: ${BACKEND_APPLICATION}"
echo -e "The frontend application will be pushed to: ${FRONTEND_APPLICATION}"
echo -e "The backend image will be tagged: ${BACKEND_VERSION}"
echo -e "The frontend image will be tagged: ${FRONTEND_VERSION}\n"
confirm

# Runs the build and overwrites default values in cloudbuild.yaml for certain variables
COMMAND="${COMMAND} \
--config=${CLOUDBUILD_PATH} \
--substitutions=\
_BACKEND_IMAGE=${BACKEND_IMAGE},\
_FRONTEND_IMAGE=${FRONTEND_IMAGE},\
_BACKEND_VERSION=${BACKEND_VERSION},\
_FRONTEND_VERSION=${FRONTEND_VERSION},\
_SHORT_SHA=${TEST_COMMIT_SHA},\
_BUILD_TAG=${APPLICATION}_${SUFFIX} \
."
${COMMAND}
