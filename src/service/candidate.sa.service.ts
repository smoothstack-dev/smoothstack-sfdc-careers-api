import { Connection } from 'jsforce';
import { SmoothstackSchema } from '../model/smoothstack.schema';
import { SACandidate, SACandidateFields } from '../model/Candidate.sa';
import { getStateCode } from '../util/state.util';

export const SA_CANDIDATE_RECORD_TYPE_ID = '012Jw0000020adSIAQ';

export const createSACandidate = async (
  conn: Connection<SmoothstackSchema>,
  candidateFields: SACandidateFields,
  existingId?: string
): Promise<string> => {
  const candidateRecord: Partial<SACandidate> = {
    RecordTypeId: SA_CANDIDATE_RECORD_TYPE_ID,
    Email: candidateFields.email,
    MobilePhone: candidateFields.phone,
    FirstName: candidateFields.firstName,
    LastName: candidateFields.lastName,
    ...(candidateFields.nickName && { Nickname__c: candidateFields.nickName }),
    Candidate_Status__c: candidateFields.status,
    MailingCity: candidateFields.city,
    MailingStateCode: getStateCode(candidateFields.state),
    MailingCountryCode: 'US',
    MailingPostalCode: candidateFields.zip,
  };

  const candidateRes = existingId
    ? await conn.update('Contact', { Id: existingId, ...candidateRecord })
    : await conn.insert('Contact', candidateRecord, { headers: { 'Sforce-Duplicate-Rule-Header': 'allowSave=true' } });

  return candidateRes.id;
};
