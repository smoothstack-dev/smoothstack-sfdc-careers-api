import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { publishCohortEventProcessingRequest } from '../../service/sns.service';

const cohortEvents = async (event: APIGatewayEvent) => {
  console.log('Received Cohort Event: ', event);
  try {
    const cohortId = event.queryStringParameters?.cohortId;
    const eventType = event.queryStringParameters?.eventType as any;
    switch (event.httpMethod) {
      case 'GET': {
        if (cohortId) {
          await publishCohortEventProcessingRequest({ cohortId, eventType });
          return {};
        }
        break;
      }
    }
    console.log('Successfully processed Cohort Event');
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(cohortEvents);
