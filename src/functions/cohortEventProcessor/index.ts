import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sns: {
        arn: { Ref: 'CohortEventProcessingTopic' },
        topicName: 'smoothstack-cohort-event-processing-sns-topic-v2',
      },
    },
  ],
};
