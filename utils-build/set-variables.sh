#!/usr/bin/env bash

# This sets up all variables needed in the all scripts.

PROJECT=$(gcloud config get-value project)
export PROJECT
ZONE=$(gcloud config get-value compute/zone)
export ZONE
REGION=$(gcloud config get-value compute/region)
export REGION

export BACKEND_DIRECTORY="pp-backend-cb"
export FRONTEND_DIRECTORY="pp-frontend-cb"
export DEVELOPMENT="development"
export PRODUCTION="production"

# Note that we're pushing to the production directory
export BACKEND_IMAGE="gcr.io/${PROJECT}/${BACKEND_DIRECTORY}/${PRODUCTION}"
export FRONTEND_IMAGE="gcr.io/${PROJECT}/${FRONTEND_DIRECTORY}/${PRODUCTION}"

# Set the gcloud run region
export CLOUD_RUN_REGION="europe-west1"
