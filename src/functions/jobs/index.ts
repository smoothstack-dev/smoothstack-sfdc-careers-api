import { handlerPath } from '@libs/handler-resolver';
import { protectedFunctionSettings } from '../../libs/protectedFunctionSettings';

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
        method: 'get',
        path: 'jobs/{jobId}',
        cors: {
          origin: '*',
        },
      },
    },
    {
      http: {
        method: 'put',
        path: 'jobs/{jobId}',
        ...protectedFunctionSettings,
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
