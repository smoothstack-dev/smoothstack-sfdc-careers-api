import { handlerPath } from '@libs/handler-resolver';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'get',
        path: 'jobs',
        cors: {
          origin: '*',
        },
      },
    },
    {
      http: {
        method: 'post',
        path: 'jobs/apply',
        cors: {
          origin: '*',
          headers: ['Content-Type'],
        },
      },
    },
  ],
};
