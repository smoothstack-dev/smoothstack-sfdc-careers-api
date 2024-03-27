import { createConfiguration } from 'pandadoc-node-client';
import { getPandaDocSecrets } from '../secrets.service';

export const getPandaDocConfig = async (apiKeyName: 'API_KEY' | 'SA_API_KEY' = 'API_KEY') => {
  const secrets = await getPandaDocSecrets();
  return createConfiguration({ authMethods: { apiKey: `API-Key ${secrets[apiKeyName]}` } });
};
