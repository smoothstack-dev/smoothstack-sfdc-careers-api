import { Connection } from 'jsforce';
import { Fields$Contact, SmoothstackSchema } from '../model/smoothstack.schema';
import { Candidate } from '../model/Candidate';
import { updateCandidate } from './candidate.service';
import { MSUser } from '../model/MSUser';

export const CONSULTANT_RECORD_TYPE_ID = '012f4000001MbodAAC';

export const fetchConsultant = async (
  conn: Connection<SmoothstackSchema>,
  consulantId: string
): Promise<Fields$Contact> => {
  return await conn.sobject('Contact').findOne({
    Id: { $eq: consulantId ?? null },
    $and: { RecordTypeId: CONSULTANT_RECORD_TYPE_ID },
  });
};

export const findConsultantBySmoothstackEmail = async (
  conn: Connection<SmoothstackSchema>,
  email: string
): Promise<Fields$Contact> => {
  return await conn.sobject('Contact').findOne({
    Smoothstack_Email__c: { $eq: email ?? null },
    $and: { RecordTypeId: CONSULTANT_RECORD_TYPE_ID },
  });
};

export const findNameAlikeConsultants = async (
  conn: Connection<SmoothstackSchema>,
  prefix: string
): Promise<Fields$Contact[]> => {
  return await conn.sobject('Contact').find({
    Smoothstack_Email__c: { $like: `${prefix}%@smoothstack.com` },
    $and: { RecordTypeId: CONSULTANT_RECORD_TYPE_ID },
  });
};

export const createConsultantFromCandidate = async (
  conn: Connection<SmoothstackSchema>,
  candidate: Candidate,
  msUser: MSUser
) => {
  await updateCandidate(conn, candidate.Id, {
    RecordTypeId: CONSULTANT_RECORD_TYPE_ID,
    Smoothstack_Email__c: msUser.userPrincipalName,
    Candidate_Primary_Status__c: 'Quick Course',
    Temp_MS_Password__c: msUser.tempPassword,
  });
};
