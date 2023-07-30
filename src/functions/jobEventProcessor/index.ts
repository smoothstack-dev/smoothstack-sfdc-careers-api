import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sns: {
        arn: { Ref: 'JobEventProcessingTopic' },
        topicName: 'smoothstack-job-event-processing-sns-topic-v2',
      },
    },
  ],
};
