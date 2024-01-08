import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { sendOffer } from '../../service/offers.service';
import createHttpError from 'http-errors';

const offers = async (event: APIGatewayEvent) => {
  try {
    switch (event.httpMethod) {
      case 'POST':
        const { consultantId, offerType } = event.body as any;
        if (!consultantId) {
          throw createHttpError(400, 'consultantId is missing in request body');
        }
        if (!['RELO', 'NO-RELO'].includes(offerType)) {
          throw createHttpError(400, 'Invalid offer type. Valid options: RELO, NO-RELO');
        }
        return await sendOffer(consultantId, offerType);
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(offers);
