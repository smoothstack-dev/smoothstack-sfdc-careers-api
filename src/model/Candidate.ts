import { Application } from './Application';
import { Owner } from './Owner';
import { Fields$Contact } from './smoothstack.schema';

export interface Candidate extends Fields$Contact {
  Applications__r?: { records: Application[] };
  Owner?: Owner;
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
