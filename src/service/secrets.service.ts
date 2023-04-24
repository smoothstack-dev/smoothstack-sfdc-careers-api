import { SecretsManager } from 'aws-sdk';
import {
  HackerRankCredentials,
  MicrosoftCredentials,
  SalesforceCredentials,
  SquareSpaceCredentials,
  ZoomCredentials,
} from '../model/Credentials';

export const getSFDCSecrets = async (): Promise<SalesforceCredentials> => {
  const secretPath = 'smoothstack/salesforce-credentials';
  const client = new SecretsManager({
    region: 'us-east-1',
  });

  const res = await client.getSecretValue({ SecretId: secretPath }).promise();
  return JSON.parse(res.SecretString);
};

export const getSquareSpaceSecrets = async (): Promise<SquareSpaceCredentials> => {
  const secretPath = 'smoothstack/squarespace-credentials';
  const client = new SecretsManager({
    region: 'us-east-1',
  });

  const res = await client.getSecretValue({ SecretId: secretPath }).promise();
  return JSON.parse(res.SecretString);
};

export const getZoomSecrets = async (): Promise<ZoomCredentials> => {
  const secretPath = 'smoothstack/zoom-credentials';
  const client = new SecretsManager({
    region: 'us-east-1',
  });

  const res = await client.getSecretValue({ SecretId: secretPath }).promise();
  return JSON.parse(res.SecretString);
};

export const getMSSecrets = async (): Promise<MicrosoftCredentials> => {
  const secretPath = 'smoothstack/microsoft-credentials';
  const client = new SecretsManager({
    region: 'us-east-1',
  });

  const res = await client.getSecretValue({ SecretId: secretPath }).promise();
  return JSON.parse(res.SecretString);
};

export const getHackerRankSecrets = async (): Promise<HackerRankCredentials> => {
  const secretPath = 'smoothstack/hackerrank-credentials';
  const client = new SecretsManager({
    region: 'us-east-1',
  });

  const res = await client.getSecretValue({ SecretId: secretPath }).promise();
  return JSON.parse(res.SecretString);
};
