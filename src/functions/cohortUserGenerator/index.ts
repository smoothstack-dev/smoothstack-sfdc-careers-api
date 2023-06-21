import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sns: {
        arn: { Ref: 'CohortUserGenerationTopic' },
        topicName: 'smoothstack-cohort-user-generation-sns-topic-v2',
      },
    },
  ],
};
