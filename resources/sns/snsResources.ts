import { AWS } from '@serverless/typescript';

export const snsResources: AWS['resources']['Resources'] = {
  DataGenerationTopic: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'smoothstack-data-generation-sns-topic-v2',
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
  DocumentEventProcessingTopic: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'smoothstack-document-event-processing-sns-topic-v2',
    },
  },
  MSUserGenerationTopic: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'smoothstack-ms-user-generation-sns-topic-v2',
    },
  },
  ConsultantGenerationTopic: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'smoothstack-consultant-generation-sns-topic-v2',
    },
  },
  CohortUserGenerationTopic: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'smoothstack-cohort-user-generation-sns-topic-v2',
    },
  },
  JobEventProcessingTopic: {
    Type: 'AWS::SNS::Topic',
    Properties: {
      TopicName: 'smoothstack-job-event-processing-sns-topic-v2',
    },
  },
};
