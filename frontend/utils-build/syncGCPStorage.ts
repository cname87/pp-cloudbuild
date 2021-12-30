/**
 * Utility that creates an object holding paths to secrets and other files that either need to be downloaded from GCP Storage (as they are not stored in GitHub) when setting up from a clone of the GitHub repo, or else uploaded to GCP Storage to ensure that GCP Storage has the latest versions.
 *
 * This utility is imported by the utility that does the actual uploading and downloading - see syncGCPStorageUtil.ts.
 */

/* Define a set of upload jobs */

const envFrontendE2e = {
  filesToLoad: ['.env-e2e-dev', '.env-e2e-production', '.env-e2e-staging'],
  /* Path relative to rootpath - directory containing package.json */
  deltaPath: 'e2e/',
};

export const loadJobs = [envFrontendE2e];

/* NOTE: To store a long-lived version so it can be retrieved if cloning the repo in the future then manually append the date, e.g '20211230-' below */

/* The root directory to store the files on the gsutil bucket */
export const rootDir = 'frontend/';
