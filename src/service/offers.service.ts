import createHttpError from 'http-errors';

export const sendOffer = async (offerType: 'RELO' | 'NO-RELO') => {
  if (!['RELO', 'NO-RELO'].includes(offerType)) {
    throw createHttpError(400, 'Invalid offer type. Valid options: RELO, NO-RELO');
  }
  return 'Successfully sent offer to consultant';
};
