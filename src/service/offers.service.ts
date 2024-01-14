import { OfferParams } from '../model/Offer';

export const sendOffer = async (offerParams: OfferParams) => {
  const { offerType, consultantId } = offerParams;
  console.log(`Successfully sent ${offerType} offer to consultant with id: ${consultantId}`);
};
