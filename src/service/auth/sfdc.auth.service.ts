import { Connection } from 'jsforce';
import { getToken } from 'sf-jwt-token';
import { SmoothstackSchema } from '../../model/smoothstack.schema';
import { getSFDCSecrets } from '../secrets.service';

const INSTANCE_URL = 'https://smoothstack.my.salesforce.com';

export const getSFDCConnection = async (version?: string) => {
  const { CONSUMER_KEY, USER_NAME, PRIVATE_KEY } = await getSFDCSecrets();
  const options = {
    iss: CONSUMER_KEY,
    privateKey: Buffer.from(PRIVATE_KEY, 'base64').toString('utf8'),
    sub: USER_NAME,
    aud: 'https://login.salesforce.com',
  };
  const { access_token } = await getToken(options);

  return new Connection<SmoothstackSchema>({
    instanceUrl: INSTANCE_URL,
    accessToken: access_token,
    version,
  });
};
