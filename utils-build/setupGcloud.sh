#!/usr/bin/env bash

# The GCP project where you will run this application
PROJECT="project-perform"
REGION="europe-west2"
ZONE="europe-west2-c"

gcloud config set project ${PROJECT}
export PROJECT
gcloud config set compute/region ${REGION}
export REGION
gcloud config set compute/zone $ZONE

# Set the gcloud run region
export CLOUD_RUN_REGION="europe-west1"

echo -e "PROJECT is $(gcloud config get-value project)"
echo -e "REGION is $(gcloud config get-value compute/region)"
echo -e "ZONE is $(gcloud config get-value compute/zone)"
echo -e "CLOUD_RUN_REGION is europe-west1"
