import { MSUser } from './MSUser';
import { Fields$Cohort_Participant__c, Fields$Cohort__c, Fields$Contact } from './smoothstack.schema';

export interface CohortUserGenerationRequest {
  applicationId: string;
  msUser: MSUser;
}

export interface CohortEventProcessingRequest {
  cohortId: string;
  eventType: 'upsert' | 'deleted';
}

export interface CohortParticipant extends Fields$Cohort_Participant__c {
  Cohort__r: Fields$Cohort__c;
  Participant__r: Fields$Contact;
}
