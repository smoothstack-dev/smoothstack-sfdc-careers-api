import { SNSEvent } from 'aws-lambda';
import { processWebinarEvent } from '../../service/webinar.service';


const webinarProcessing = async (event: SNSEvent) => {
  try {
    await processWebinarEvent(event);
  } catch (e) {
    console.error('Error processing webinar event: ', e);
    throw e;
  }
};

export const main = webinarProcessing;
