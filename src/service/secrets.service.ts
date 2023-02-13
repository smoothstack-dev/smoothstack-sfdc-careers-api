import { SecretsManager } from 'aws-sdk';
import { SalesforceCredentials } from '../model/Credentials';

export const getSFDCSecrets = async (): Promise<SalesforceCredentials> => {
    const secretPath = 'smoothstack/salesforce-credentials';
    const client = new SecretsManager({
      region: 'us-east-1',
    });
  
    const res = await client.getSecretValue({ SecretId: secretPath }).promise();
    return JSON.parse(res.SecretString);
  };