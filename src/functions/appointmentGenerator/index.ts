import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sns: {
        arn: { Ref: 'AppointmentGenerationTopic' },
        topicName: 'smoothstack-appointment-generation-sns-topic-v2',
      },
    },
  ],
};
