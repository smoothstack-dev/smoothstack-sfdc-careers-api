import { Connection } from 'jsforce';
import { Fields$Contact, SmoothstackSchema } from '../model/smoothstack.schema';
import { Candidate } from '../model/Candidate';

const CONSULTANT_RECORD_TYPE_ID = '012f4000001MbodAAC';

export const findConsultantByCandidateId = async (
  conn: Connection<SmoothstackSchema>,
  candidateId: string
): Promise<Fields$Contact> => {
  return await conn.sobject('Contact').findOne({
    Candidate__c: { $eq: candidateId },
    $and: { RecordTypeId: CONSULTANT_RECORD_TYPE_ID },
  });
};

export const findNameAlikeConsultants = async (conn: Connection<SmoothstackSchema>, prefix: string) => {
  return await conn.sobject('Contact').find({
    Email: { $like: `${prefix}%@smoothstack.com` },
    $and: { RecordTypeId: CONSULTANT_RECORD_TYPE_ID },
  });
};

export const createConsultant = async (conn: Connection<SmoothstackSchema>, candidate: Candidate, msUser: string) => {
  const consultantRecord: Partial<Fields$Contact> = {
    
  };
  await conn._createSingle('Candidate', consultantRecord, {});
};
