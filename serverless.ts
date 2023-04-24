import type { AWS } from '@serverless/typescript';
import jobs from './src/functions/jobs';
import { snsResources } from './resources/sns/snsResources';
import linksGenerator from './src/functions/linksGenerator';
import appointmentGenerator from './src/functions/appointmentGenerator';
import schedulingEvents from './src/functions/schedulingEvents';
import webinarEvents from './src/functions/webinarEvents';
import webinarProcessing from './src/functions/webinarProcessing';
import challengeEvents from './src/functions/challengeEvents';
import documentEvents from './src/functions/documentEvents';

const serverlessConfiguration: AWS = {
  service: 'smoothstack-sfdc-careers-api',
  frameworkVersion: '3',
  plugins: ['serverless-esbuild', 'serverless-offline', 'serverless-offline-sns', 'serverless-ngrok-tunnel'],
  provider: {
    name: 'aws',
    runtime: 'nodejs16.x',
    stage: '${opt:stage, env:STAGE}',
    region: 'us-east-1',
    memorySize: 1024,
    timeout: 30,
    apiGateway: {
      minimumCompressionSize: 1024,
      shouldStartNameWithService: true,
      binaryMediaTypes: ['multipart/form-data'],
    },
    iam: {
      role: 'arn:aws:iam::${opt:aws_account, env: AWS_ACCOUNT}:role/${opt:lambda_role, env:LAMBDA_ROLE}',
    },
    environment: {
      AWS_NODEJS_CONNECTION_REUSE_ENABLED: '1',
      NODE_OPTIONS: '--enable-source-maps --stack-trace-limit=1000',
      AWS_ACCOUNT: '${opt:aws_account, env: AWS_ACCOUNT}',
      ENV: '${opt:stage, env:STAGE}',
      JSFORCE_CONNECTION_REGISTRY: 'sfdx',
    },
  },
  custom: {
    ngrokTunnel: {
      tunnels: [
        {
          port: 3000,
        },
      ],
    },
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node14',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10,
    },
    'serverless-offline-sns': {
      port: 4002,
      debug: false,
      accountId: '${opt:aws_account, env: AWS_ACCOUNT}',
    },
  },
  // import the function via paths
  package: { individually: true },
  functions: {
    jobs,
    linksGenerator,
    appointmentGenerator,
    schedulingEvents,
    webinarEvents,
    webinarProcessing,
    challengeEvents,
    documentEvents,
  },
  resources: {
    Resources: {
      ...snsResources,
    },
  },
};

module.exports = serverlessConfiguration;
