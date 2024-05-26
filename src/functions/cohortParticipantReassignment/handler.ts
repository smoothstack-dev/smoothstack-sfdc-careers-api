import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { publishCPReassignmentRequest } from '../../service/sns.service';

const cohortParticipantReassingment = async (event: APIGatewayEvent) => {
  console.log('Received Cohort Participant Reassignment Request: ', event);
  try {
    const cohortParticipantId = event.queryStringParameters?.cohortParticipantId;
    switch (event.httpMethod) {
      case 'GET': {
        if (cohortParticipantId) {
          await publishCPReassignmentRequest(cohortParticipantId);
          return {};
        }
        break;
      }
    }
    console.log('Successfully processed Cohort Participant Reassignment Request');
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(cohortParticipantReassingment);
