import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sns: {
        arn: { Ref: 'MSUserGenerationTopic' },
        topicName: 'smoothstack-ms-user-generation-sns-topic-v2',
      },
    },
  ],
};
