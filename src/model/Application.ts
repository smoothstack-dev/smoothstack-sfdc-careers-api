import { Candidate } from './Candidate';
import { Fields$Job__c, Fields$Opportunity } from './smoothstack.schema';

export interface Application extends Fields$Opportunity {
  Candidate__r?: Candidate;
  Job__r?: Fields$Job__c;
}

export interface ApplicationFields {
  status: string;
  deviceType: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmTerm?: string;
  workAuthorization: string;
  relocation: string;
  selfRank: number;
  currentlyStudent: string;
  yearsOfExperience?: string;
  name?: string;
  graduationDate?: string;
  degreeExpected?: string;
  highestDegree?: string;
  major?: string;
  techSelection?: string;
  hardwareDesign?: string;
  hardwareSkills?: string;
  instagram?: string;
  linkedin?: string;
  physicalRequirements?: string;
}
