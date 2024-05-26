import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sns: {
        arn: { Ref: 'CPReassignmentProcessingTopic' },
        topicName: 'smoothstack-cp-reassignment-processing-sns-topic-v2',
      },
    },
  ],
};
