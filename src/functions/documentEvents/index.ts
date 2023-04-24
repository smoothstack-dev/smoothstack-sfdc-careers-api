import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'post',
        path: 'document-events',
        cors: {
          origin: '*',
          headers: ['Content-Type'],
        },
      },
    },
    {
      http: {
        method: 'post',
        path: 'document-events/generate',
        cors: {
          origin: '*',
          headers: ['Content-Type'],
        },
      },
    },
  ],
};
