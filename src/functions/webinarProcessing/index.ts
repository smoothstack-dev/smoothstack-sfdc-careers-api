import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sns: {
        arn: { Ref: 'WebinarProcessingTopic' },
        topicName: 'smoothstack-webinar-processing-sns-topic-v2',
      },
    },
  ],
  timeout: 300,
};
