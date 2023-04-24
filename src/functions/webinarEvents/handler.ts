import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { publishWebinarProcessingRequest } from '../../service/sns.service';

const webinarEvents = async (event: APIGatewayEvent) => {
  console.log('Received Webinar Event: ', event.body);
  try {
    switch (event.httpMethod) {
      case 'POST':
        // return {
        //   plainToken: (event.body as any).payload.plainToken,
        //   encryptedToken: createHmac('sha256', 'secretKey')
        //     .update((event.body as any).payload.plainToken)
        //     .digest('hex'),
        // };
        await publishWebinarProcessingRequest(event.body as any);
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(webinarEvents);
