import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sns: {
        arn: { Ref: 'DocumentEventProcessingTopic' },
        topicName: 'smoothstack-document-event-processing-sns-topic-v2',
      },
    },
  ],
};
