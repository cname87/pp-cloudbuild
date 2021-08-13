#!/usr/bin/env bash

# This sets up all variables needed in the all scripts.

PROJECT=$(gcloud config get-value project)
export PROJECT
ZONE=$(gcloud config get-value compute/zone)
export ZONE
REGION=$(gcloud config get-value compute/region)
export REGION

export BACKEND_DIRECTORY=pp-backend-cb
export FRONTEND_DIRECTORY=pp-frontend-cb
export DEVELOPMENT=development
export PRODUCTION=production
