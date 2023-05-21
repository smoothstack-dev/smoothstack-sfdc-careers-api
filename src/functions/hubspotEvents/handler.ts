import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { processHubspotEvent } from '../../service/hubspot.service';

const hubspotEvents = async (event: APIGatewayEvent) => {
  console.log('Received Hubspot Event: ', event);
  try {
    switch (event.httpMethod) {
      case 'POST': {
        for (const e of event.body) {
          await processHubspotEvent(e as any);
        }
      }
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(hubspotEvents);
