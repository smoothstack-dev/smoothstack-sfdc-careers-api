import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      sns: {
        arn: { Ref: 'ConsultantGenerationTopic' },
        topicName: 'smoothstack-consultant-generation-sns-topic-v2',
      },
    },
  ],
};
