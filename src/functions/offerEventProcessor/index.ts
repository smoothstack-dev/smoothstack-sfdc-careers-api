import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sns: {
        arn: { Ref: 'OfferEventProcessingTopic' },
        topicName: 'smoothstack-offer-event-processing-sns-topic-v2',
      },
    },
  ],
};
