import { SNSEvent } from 'aws-lambda';

import { JobEventProcessingRequest } from '../../model/Job';
import { processJobEvent } from '../../service/jobEventProcessor.service';

const jobEventProcessor = async (event: SNSEvent) => {
  try {
    console.log('Received Job Event Processing Request.');
    const { jobId }: JobEventProcessingRequest = JSON.parse(event.Records[0].Sns.Message);
    await processJobEvent(jobId);
    console.log(`Successfully processed job event with id: ${jobId}`);
  } catch (e) {
    console.error('Error processing job: ', e);
    throw e;
  }
};

export const main = jobEventProcessor;
