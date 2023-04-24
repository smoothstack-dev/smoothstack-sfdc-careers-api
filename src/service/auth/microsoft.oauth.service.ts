import * as msal from '@azure/msal-node';
import { getMSSecrets } from '../secrets.service';
import { MSAuthData } from '../../model/Auth';

export const getMSAuthData = async (): Promise<MSAuthData> => {
  const { CLIENT_ID, CLIENT_SECRET, AUTHORITY, CALLBACK_URL } = await getMSSecrets();
  const msalConfig = {
    auth: {
      clientId: CLIENT_ID,
      authority: AUTHORITY,
      clientSecret: CLIENT_SECRET,
    },
  };
  const cca = new msal.ConfidentialClientApplication(msalConfig);
  const result = await cca.acquireTokenByClientCredential({ scopes: ['https://graph.microsoft.com/' + '.default'] });
  return {
    token: result.accessToken,
    callBackUrl: CALLBACK_URL,
  };
};
