import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import createHttpError from 'http-errors';
import { OfferParams } from '../../model/Offer';
import { publishOfferEvent } from '../../service/sns.service';

const validateReqBody = (body: any) => {
  const requiredFields = [
    'consultantId',
    'offerType',
    'startDate',
    'reportsTo',
    'expirationDate',
    'year1Salary',
    'year2Salary',
    'minWage',
  ];
  const bodyFields = Object.keys(body);
  if (!requiredFields.every((f) => bodyFields.includes(f))) {
    throw createHttpError(400, `One or more offers are missing fields. Required fields: ${requiredFields}`);
  }
  if (!['RELO', 'NO-RELO'].includes(body.offerType)) {
    throw createHttpError(400, 'One or more offers have invalid offerType. Valid options: RELO, NO-RELO');
  }
};

const offers = async (event: APIGatewayEvent) => {
  try {
    switch (event.httpMethod) {
      case 'POST':
        const offerList = event.body as unknown as OfferParams[];
        if (!Array.isArray(offerList)) {
          throw createHttpError(400, 'Request body must be an array of offers.');
        }
        const offerEvents = offerList.map((offer) => {
          validateReqBody(offer);
          return publishOfferEvent(offer);
        });
        await Promise.all(offerEvents);
        return `Successfully processed ${offerList.length} offer/s in request`;
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(offers);
