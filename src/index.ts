import fs from 'fs';
import csv from 'csv-parser';
import { DATA_FILE_PATH } from './config/config';

import { getCSRFToken, getFormattedHeaders, loginResult } from './utils/auth';

import { getRoles } from './utils/role';

import { CSVUser } from './utils/user';

import { bulkUserUploadUg } from './bulk-user-upload';

const readAndParse = async (fileName: string) => {
  const tokens = await loginResult();

  const csrfToken = await getCSRFToken(tokens.bearerToken);

  const headers = getFormattedHeaders(
    tokens.bearerToken,
    csrfToken,
    tokens.cookie,
  );

  const rolesAvailableOnSuperset = await getRoles(headers);
  console.log(rolesAvailableOnSuperset);

  const nameAndIdArray = rolesAvailableOnSuperset.map((role) => {
    return {
      id: role.id,
      name: role.name,
    };
  });

  // console.log(nameAndIdArray);

  const users: CSVUser[] = [];
  // console.log('Processing...');

  fs.createReadStream(fileName, 'utf-8')
    .on('error', () => {
      // handle error
      console.log(`An error occured on ${fileName}`);
    })
    .pipe(csv())
    .on('data', (data) => users.push(data))

    .on('end', async () => {
      console.log(users);
      console.log(`Processed ${users.length} successfully`);
      await bulkUserUploadUg(users, rolesAvailableOnSuperset, headers);
    });
};

readAndParse(DATA_FILE_PATH);
