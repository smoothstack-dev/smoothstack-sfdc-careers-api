import { SACandidate } from './Candidate.sa';
import { SAJob } from './Job.sa';
import { Fields$Marketing__c } from './smoothstack.schema';

export interface SAApplication extends Fields$Marketing__c {
  Resource__r?: SACandidate;
  Opportunity__r?: SAJob;
}

export interface SAApplicationFields {
  status: string;
  workAuthorization: string;
  willRelocate: string;
  educationLevel: string;
  yearsOfProfessionalExperience: string;
}
