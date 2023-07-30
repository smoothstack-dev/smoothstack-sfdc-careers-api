import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { publishJobProcessingRequest } from '../../service/sns.service';

const jobEvents = async (event: APIGatewayEvent) => {
  console.log('Received Job Event: ', event);
  try {
    const jobId = event.queryStringParameters?.jobId;
    switch (event.httpMethod) {
      case 'GET': {
        if (jobId) {
          await publishJobProcessingRequest({ jobId: +jobId });
          return {}
        }
        break;
      }
    }
    console.log('Successfully processed Job Event');
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(jobEvents);
