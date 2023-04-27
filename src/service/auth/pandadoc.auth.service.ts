import { createConfiguration } from 'pandadoc-node-client';
import { getPandaDocSecrets } from '../secrets.service';

export const getPandaDocConfig = async () => {
  const { API_KEY } = await getPandaDocSecrets();
  return createConfiguration({ authMethods: { apiKey: `API-Key ${API_KEY}` } });
};
