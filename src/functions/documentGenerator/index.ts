import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sns: {
        arn: { Ref: 'DocumentGenerationTopic' },
        topicName: 'smoothstack-document-generation-sns-topic-v2',
      },
    },
  ],
};
