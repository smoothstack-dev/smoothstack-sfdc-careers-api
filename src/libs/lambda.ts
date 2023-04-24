import middy from '@middy/core';
import cors from '@middy/http-cors';
import middyJsonBodyParser from '@middy/http-json-body-parser';
import httpUrlEncodeBodyParser from '@middy/http-urlencode-body-parser';

import { apiGatewayResponseMiddleware } from './middleware';

export const middyfy = (handler) => {
  return middy(handler)
    .use(middyJsonBodyParser())
    .use(httpUrlEncodeBodyParser())
    .use(cors())
    .use(apiGatewayResponseMiddleware());
};
