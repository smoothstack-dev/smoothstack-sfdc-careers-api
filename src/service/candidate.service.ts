import { Connection } from 'jsforce';
import { Candidate, CandidateFields } from '../model/Candidate';
import { Fields$Contact, Fields$ContentVersion, SmoothstackSchema } from '../model/smoothstack.schema';
import { getStateCode } from '../util/state.util';
import { derivePotentialEmail } from '../util/candidate.util';
import { fetchHTDAssignmentGroup } from './assigmentGroup.service';

export const CANDIDATE_RECORD_TYPE_ID = '0125G000000feaZQAQ';

export const fetchCandidate = async (conn: Connection<SmoothstackSchema>, candidateId: string): Promise<Candidate> => {
  return await conn
    .sobject('Contact')
    .findOne({ Id: { $eq: candidateId ?? null } })
    .include('Applications__r')
    .select('*, Job__r.*')
    .end();
};

export const createCandidate = async (
  conn: Connection<SmoothstackSchema>,
  candidateFields: CandidateFields,
  utmTerm: string,
  existingId?: string
): Promise<string> => {
  const candidateOwner = await deriveCandidateOwner(conn, utmTerm);
  const candidateRecord: Partial<Fields$Contact> = {
    RecordTypeId: CANDIDATE_RECORD_TYPE_ID,
    Email: candidateFields.email,
    MobilePhone: candidateFields.phone,
    FirstName: candidateFields.firstName,
    LastName: candidateFields.lastName,
    ...(candidateFields.nickName && { Nickname__c: candidateFields.nickName }),
    ...(candidateFields.status && { Candidate_Status__c: candidateFields.status }),
    MailingCity: candidateFields.city,
    MailingStateCode: getStateCode(candidateFields.state),
    MailingCountryCode: 'US',
    MailingPostalCode: candidateFields.zip,
    Potential_Smoothstack_Email__c: derivePotentialEmail(candidateFields.firstName, candidateFields.lastName),
    Military_Status__c: candidateFields.militaryStatus,
    ...(candidateFields.militaryBranch && { Military_Service_Type__c: candidateFields.militaryBranch }),
    Race__c: candidateFields.race,
    GenderIdentity: candidateFields.gender,
    Disability__c: candidateFields.disability,
    OwnerId: candidateOwner?.Id,
  };

  const candidateRes = existingId
    ? await conn.update('Contact', { Id: existingId, ...candidateRecord })
    : await conn.insert('Contact', candidateRecord, { headers: { 'Sforce-Duplicate-Rule-Header': 'allowSave=true' } });

  return candidateRes.id;
};

const deriveCandidateOwner = async (conn: Connection<SmoothstackSchema>, utmTerm: string) => {
  if (utmTerm) {
    const assignmentGroup = await fetchHTDAssignmentGroup(conn);
    return assignmentGroup.Assignment_Group_Members__r.records.find((m) => utmTerm.includes(m.User__r.Alias))?.User__r;
  }
  return null;
};

export const updateCandidate = async (
  conn: Connection<SmoothstackSchema>,
  candidateId: string,
  updateFields: Partial<Fields$Contact>
) => {
  await conn.sobject('Contact').update({ Id: candidateId, ...updateFields });
};

export const fetchCandidateFiles = async (
  conn: Connection<SmoothstackSchema>,
  candidateId: string,
  fileType: string
): Promise<Fields$ContentVersion[]> => {
  const contentVersionIds = (
    await conn
      .sobject('ContentDocumentLink')
      .find({ LinkedEntityId: { $eq: candidateId ?? null } })
      .select('ContentDocument.LatestPublishedVersionId')
  ).map((cdl) => cdl.ContentDocument.LatestPublishedVersionId);

  return contentVersionIds.length
    ? await conn.sobject('ContentVersion').find({ Id: { $in: contentVersionIds }, $and: { Type__c: fileType } })
    : [];
};
