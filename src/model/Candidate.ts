import { Application } from './Application';
import { Fields$Contact } from './smoothstack.schema';

export interface Candidate extends Fields$Contact {
  Applications__r?: { records: Application[] };
  Owner?: {
    FirstName: string;
    LastName: string;
    Email: string;
  };
}

export interface CandidateFields {
  firstName: string;
  lastName: string;
  nickName: string;
  email: string;
  phone: string;
  status: string;
  city: string; 
  state: string;
  zip: string;
}
