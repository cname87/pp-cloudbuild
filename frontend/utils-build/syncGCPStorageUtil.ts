/**
 * Utility to sync secret files in the local repo with GCP Cloud Storage in the project-perform project by uploading all secrets files to GCP Cloud Storage, unless a file is absent, in which case the file is downloaded from GCP Local Storage.
 *
 * The GitHub repo does not store secrets files - these are stored in Cloud Storage.
 *
 * Therefor, when you clone from the Git repo you need to create some directories and download these files.  When GCP triggers a build from Github it copies in the GitHub repo but also needs to copy the secrets files from Cloud Storage.  Therefore the files on the GCP Local Storage environment must be kept up to date.
 *
 * When the files are downloaded they are saved in a directory matching the Cloud Storage file path.  To make this give the expected result a directory on the Cloud Storage bucket is created that matches the name of the rootpath (i.e. the directory containing package.json) and a deltaPath is configured to each file from the root path and the local and Cloud Storage filepaths are constructed from that delta path.
 *
 * Usage:
 *
 * The utility is run from an npm script: 'npm run loadSecretsFiles'
 *
 * The utility imports a module that passes in an object that contains paths to the secrets files.
 *
 * The utility requires that the project-perform GCP project have billing enabled.
 *
 * The utility uploads all secrets files.  If it cannot find a file to upload it will download that file from GCP.
 *
 */

import path from 'path';
import fs from 'fs';
import findup from 'find-up';
import { Storage } from '@google-cloud/storage';
import { loadJobs } from './syncGCPStorage';
import { rootDir } from './syncGCPStorage';

console.log('Loading secrets files with GCP Cloud Storage');
const storage = new Storage();

/* Find directory (upwards) containing package.json */
export const rootPath = path.dirname(
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  findup.sync('package.json', { cwd: __dirname })!,
);

/* Set the path to the GCP Storage credentials here (as well as in the .env files) as this may be called when no .env file is loaded */
/* Note: This is the key associated with the storage-access@project-perform.iam.gserviceaccount.com service account */
process.env.GOOGLE_APPLICATION_CREDENTIALS = path.resolve(
  rootPath,
  '..',
  'certs',
  'gcpStorage',
  'gcpStorageKey.json',
);

/* Name of the bucket on GCP Storage */
const bucketName = 'project-perform-gcp-environment-files';

/* Upload a file to GCP Storage*/
const uploadFile = async (srcFilename: string, destFilename: string) => {
  const options = {
    destination: destFilename,
  };
  try {
    console.log(`Uploading ${srcFilename} to ${destFilename}.`);
    await storage.bucket(bucketName).upload(srcFilename, options);
  } catch (err) {
    console.error(
      `Error uploading ${srcFilename} to gs://${bucketName}/${destFilename}.`,
    );
    throw err;
  }
};

/* Download a file from GCP Storage */
const downloadFile = async (srcFilename: string, destFilename: string) => {
  const options = {
    destination: destFilename,
  };
  try {
    console.log(`Downloading ${srcFilename} to ${destFilename}.`);
    await storage.bucket(bucketName).file(srcFilename).download(options);
  } catch (err) {
    /* If a file was created then delete it */
    try {
      fs.unlinkSync(destFilename);
    } catch (err) {
      /* No file was created => ignore this error */
    }
    console.error(
      `Error downloading ${srcFilename} from gs://${bucketName}/${destFilename}.`,
    );
    throw err;
  }
};

enum FirstRead {
  TRUE = 1,
  FALSE,
}
/* Get metadata on a file from the Cloud Storage */
const getUploadedTime = async (
  bucket = bucketName,
  filename: string,
  firstRead: FirstRead,
) => {
  try {
    const [metadata] = await storage
      .bucket(bucket)
      .file(filename)
      .getMetadata();
    /* return # of ms */
    return Date.parse(metadata.updated);
  } catch (err) {
    if (firstRead === FirstRead.TRUE) {
      /* If the file is not there before you upload the file then return an uploaded time of 0ms */
      return 0;
    }
    /* If an error is thrown on the attempt to get the upload metadata after you have uploaded the file then throw an error */
    console.error(
      `Error getting metadata on ${filename} from gs://${bucketName}.`,
    );
    throw err;
  }
};

/* Set up exact GCP and local filepaths and call the upload function for each file if it exists, or call the download function if it doesn't exist.*/
export const setFilePathsAndCallUpload = async (
  filesToLoad: string[],
  deltaPath: string,
): Promise<void> => {
  for (const file of filesToLoad) {
    /* Construct the storage path from the deltaPath */
    const gsFilePath = rootDir + deltaPath + file;
    /* Construct the local path from the deltaPath */
    const localFilePath = path.resolve(rootPath, deltaPath, file);
    if (fs.existsSync(localFilePath)) {
      const before = await getUploadedTime(
        bucketName,
        gsFilePath,
        FirstRead.TRUE,
      );
      await uploadFile(localFilePath, gsFilePath);
      const after = await getUploadedTime(
        bucketName,
        gsFilePath,
        FirstRead.FALSE,
      );
      /* Test uploaded time before Vs after */
      if (before - after < 0) {
        console.log('Upload test passed');
      } else {
        console.error('Unknown error uploading to GCP Storage');
        throw new Error('Unknown error uploading to GCP Storage');
      }
    } else {
      console.warn('No local file exists => downloading from GCP Storage');
      await downloadFile(gsFilePath, localFilePath);
      /* Test that the file was downloaded */
      if (!fs.existsSync(localFilePath)) {
        console.error(
          'Error downloading from GCP Storage - downloaded file not found',
        );
        throw new Error('Error downloading from GCP Storage');
      }
    }
  }
};

export const runUploads = async (jobs: any): Promise<void> => {
  /* run the set of uploads */
  for (const job of jobs) {
    await setFilePathsAndCallUpload(job.filesToLoad, job.deltaPath);
  }
};

runUploads(loadJobs);
