import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { sendOffer } from '../../service/offers.service';

const offers = async (event: APIGatewayEvent) => {
  try {
    switch (event.httpMethod) {
      case 'POST':
        const { offerType } = event.body as any;
        return await sendOffer(offerType);
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(offers);
