import { AWS } from '@serverless/typescript';

export const snsResources: AWS['resources']['Resources'] = {
  LinksGenerationTopic: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'smoothstack-links-generation-sns-topic-v2',
    },
  },
  AppointmentGenerationTopic: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'smoothstack-appointment-generation-sns-topic-v2',
    },
  },
  WebinarProcessingTopic: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'smoothstack-webinar-processing-sns-topic-v2',
    },
  },
  DocumentGenerationTopic: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'smoothstack-document-generation-sns-topic-v2',
    },
  },
};
