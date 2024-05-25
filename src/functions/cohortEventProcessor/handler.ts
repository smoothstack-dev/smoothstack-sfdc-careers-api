import { SNSEvent } from 'aws-lambda';
import { CohortEventProcessingRequest } from '../../model/Cohort';
import { processCohortEvent } from '../../service/cohortEventProcessor.service';

const cohortEventProcessor = async (event: SNSEvent) => {
  try {
    console.log('Received Cohort Event Processing Request.');
    const cohortEvent: CohortEventProcessingRequest = JSON.parse(event.Records[0].Sns.Message);
    await processCohortEvent(cohortEvent);
    console.log(`Successfully processed cohort event with id: ${cohortEvent.cohortId}`);
  } catch (e) {
    console.error('Error processing cohort event: ', e);
    throw e;
  }
};

export const main = cohortEventProcessor;
