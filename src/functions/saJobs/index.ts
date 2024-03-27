import { handlerPath } from '@libs/handler-resolver';
import { protectedFunctionSettings } from '../../libs/protectedFunctionSettings';

export default {
  handler: `${handlerPath(__dirname)}/handler.main`,
  events: [
    {
      http: {
        method: 'get',
        path: 'staffAug/jobs',
        cors: {
          origin: '*',
        },
      },
    },
    {
      http: {
        method: 'get',
        path: 'staffAug/jobs/{jobId}',
        cors: {
          origin: '*',
        },
      },
    },
    {
      http: {
        method: 'put',
        path: 'staffAug/jobs/{jobId}',
        ...protectedFunctionSettings,
      },
    },
    {
      http: {
        method: 'post',
        path: 'staffAug/jobs/apply',
        cors: {
          origin: '*',
          headers: ['Content-Type'],
        },
      },
    },
  ],
};
