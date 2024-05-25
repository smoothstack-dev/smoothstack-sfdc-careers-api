import { MSUser } from './MSUser';

export interface CohortUserGenerationRequest {
  applicationId: string;
  msUser: MSUser;
}

export interface CohortEventProcessingRequest {
  cohortId: string;
  eventType: 'created' | 'updated';
}
