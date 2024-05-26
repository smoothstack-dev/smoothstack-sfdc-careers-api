import { SNSEvent } from 'aws-lambda';
import { reassignCohortParticipant } from '../../service/cohortReassignmentProcessor.service';

const cpReassignmentProcessor = async (event: SNSEvent) => {
  try {
    console.log('Received Cohort Participant Reassignment Processing Request.');
    const { cohortParticipantId } = JSON.parse(event.Records[0].Sns.Message);
    await reassignCohortParticipant(cohortParticipantId);
    console.log(
      `Successfully processed Cohort Participant Reassignment Request for participant with id: ${cohortParticipantId}`
    );
  } catch (e) {
    console.error('Error processing cohort participant reassignment event: ', e);
    throw e;
  }
};

export const main = cpReassignmentProcessor;
