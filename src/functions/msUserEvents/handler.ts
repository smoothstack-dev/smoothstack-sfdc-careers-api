import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { processMSUserEvent } from '../../service/msUser.service';

const msUserEvents = async (event: APIGatewayEvent) => {
  console.log('Received MS User Event: ', event);
  try {
    switch (event.httpMethod) {
      case 'POST': {
        if (event.queryStringParameters?.validationToken) {
          return {
            statusCode: 200,
            body: event.queryStringParameters.validationToken,
            headers: {
              'Content-Type': 'text/plain',
            },
          };
        }
        await processMSUserEvent(event.body as any);
      }
    }
    console.log('Successfully processed MS User Event');
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(msUserEvents);
