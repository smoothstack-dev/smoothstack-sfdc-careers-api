import { SNSEvent } from 'aws-lambda';
import { OfferParams } from '../../model/Offer';
import { sendOffer } from '../../service/offers.service';

const offerEventProcessor = async (event: SNSEvent) => {
  try {
    console.log('Received Offer Event Processing Request.');
    const offerRequest: OfferParams = JSON.parse(event.Records[0].Sns.Message);
    await sendOffer(offerRequest);
    console.log('Successfully processed offer event');
  } catch (e) {
    console.error('Error processing offer event: ', e);
    throw e;
  }
};

export const main = offerEventProcessor;
