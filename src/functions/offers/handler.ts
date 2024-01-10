import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { sendOffer } from '../../service/offers.service';
import createHttpError from 'http-errors';
import { OfferParams } from '../../model/Offer';

const validateReqBody = (body: any) => {
  const requiredFields = [
    'consultantId',
    'offerType',
    'startDate',
    'reportsTo',
    'expirationDate',
    'year1Salary',
    'year2Salary',
  ];
  const bodyFields = Object.keys(body);
  if (!requiredFields.every((f) => bodyFields.includes(f))) {
    throw createHttpError(400, `Missing request body fields. Required fields: ${requiredFields}`);
  }
  if (!['RELO', 'NO-RELO'].includes(body.offerType)) {
    throw createHttpError(400, 'Invalid offer type. Valid options: RELO, NO-RELO');
  }
};

const offers = async (event: APIGatewayEvent) => {
  try {
    switch (event.httpMethod) {
      case 'POST':
        const offerParams = event.body as unknown as OfferParams;
        validateReqBody(offerParams);
        return await sendOffer(offerParams);
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(offers);
