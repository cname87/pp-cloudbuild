/**
 * Utility that creates an object holding paths to secrets and other files that either need to be downloaded from GCP Storage (as they are not stored in GitHub) when setting up from a clone of the GitHub repo, or else uploaded to GCP Storage to ensure that GCP Storage has the latest versions.
 *
 * This utility is imported by the utility that does the actual uploading and downloading - see syncGCPStorageUtil.ts.
 */

/* Define a set of upload jobs */

const envBackend = {
  filesToLoad: ['.envDevelopment', '.envStaging', '.envProduction'],
  /* Path relative to directory containing package.json */
  deltaPath: '',
};

const databaseCertsPath = 'certs/database/';
const dbCerts = {
  filesToLoad: ['mongoKeyAndCert.pem', 'rootCA.crt'],
  /* Path relative to directory containing package.json */
  deltaPath: databaseCertsPath,
};

const gcpKeyPath = '../certs/gcpStorage/';
const gcpStorageKey = {
  filesToLoad: ['gcpStorageKey.json'],
  /* Path relative to directory containing package.json */
  deltaPath: gcpKeyPath,
};

export const loadJobs = [envBackend, dbCerts, gcpStorageKey];

/* The root directory to store the files on the gsutil bucket */
export const rootDir = 'backend/';
