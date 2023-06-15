import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sns: {
        arn: { Ref: 'DataGenerationTopic' },
        topicName: 'smoothstack-data-generation-sns-topic-v2',
      },
    },
  ],
};
