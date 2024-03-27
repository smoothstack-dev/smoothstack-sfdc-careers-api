import { SAApplication } from './Application.sa';
import { Fields$Contact } from './smoothstack.schema';

export interface SACandidate extends Fields$Contact {
  Marketings__r?: { records: SAApplication[] };
}

export interface SACandidateFields {
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
