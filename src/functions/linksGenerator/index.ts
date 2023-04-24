import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sns: {
        arn: { Ref: 'LinksGenerationTopic' },
        topicName: 'smoothstack-links-generation-sns-topic-v2',
      },
    },
  ],
};
