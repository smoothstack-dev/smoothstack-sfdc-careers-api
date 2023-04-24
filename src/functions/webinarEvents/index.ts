import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'webinar-events',
        cors: {
          origin: '*',
          headers: ['Content-Type'],
        },
      },
    },
  ],
};
