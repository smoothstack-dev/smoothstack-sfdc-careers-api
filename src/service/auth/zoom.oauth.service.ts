import { getZoomSecrets } from '../secrets.service';
import axios from 'axios';

const ZOOM_OAUTH_ENDPOINT = 'https://zoom.us/oauth/token';

export const generateZoomToken = async () => {
  const { ACCOUNT_ID, CLIENT_ID, CLIENT_SECRET } = await getZoomSecrets();
  const params = new URLSearchParams();
  params.append('grant_type', 'account_credentials');
  params.append('account_id', ACCOUNT_ID);
  const { data } = await axios.post(ZOOM_OAUTH_ENDPOINT, params, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`,
    },
  });

  return data.access_token;
};
