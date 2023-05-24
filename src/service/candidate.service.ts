import { Connection } from 'jsforce';
import { Candidate, CandidateFields } from '../model/Candidate';
import { Fields$Contact, Fields$ContentVersion, SmoothstackSchema } from '../model/smoothstack.schema';
import { getStateCode } from '../util/state.util';
import { derivePotentialEmail } from '../util/candidate.util';
import { fetchHTDAssignmentGroup } from './assigmentGroup.service';

export const fetchCandidate = async (conn: Connection<SmoothstackSchema>, candidateId: string): Promise<Candidate> => {
  return await conn
    .sobject('Contact')
    .findOne({ Id: { $eq: candidateId } })
    .include('Applications__r')
    .select('*, Job__r.*')
    .end();
};

export const findCandidateByEmailOrPhone = async (
  conn: Connection<SmoothstackSchema>,
  email: string,
  phone: string
): Promise<Candidate> => {
  return await conn
    .sobject('Contact')
    .findOne({
      $or: [{ Email: { $eq: email } }, { MobilePhone: { $eq: phone } }],
      $and: { RecordTypeId: '0125G000000feaZQAQ' },
    })
    .include('Applications__r')
    .end();
};

export const createCandidate = async (
  conn: Connection<SmoothstackSchema>,
  candidateFields: CandidateFields,
  utmSource: string
): Promise<string> => {
  const candidateOwner = await deriveCandidateOwner(conn, utmSource);
  const candidateRecord: Partial<Fields$Contact> = {
    RecordTypeId: '0125G000000feaZQAQ',
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
    Potential_Smoothstack_Email__c: derivePotentialEmail(candidateFields.firstName, candidateFields.lastName),
    OwnerId: candidateOwner?.Id,
  };
  const candidateRes: any = await conn._createSingle('Contact', candidateRecord, {});
  return candidateRes.id;
};

const deriveCandidateOwner = async (conn: Connection<SmoothstackSchema>, utmSource: string) => {
  if (utmSource) {
    const assignmentGroup = await fetchHTDAssignmentGroup(conn);
    return assignmentGroup.Assignment_Group_Members__r.records.find((m) => utmSource.includes(m.User__r.Alias))
      ?.User__r;
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
      .find({ LinkedEntityId: { $eq: candidateId } })
      .select('ContentDocument.LatestPublishedVersionId')
  ).map((cdl) => cdl.ContentDocument.LatestPublishedVersionId);

  return contentVersionIds.length
    ? await conn.sobject('ContentVersion').find({ Id: { $in: contentVersionIds }, $and: { Type__c: fileType } })
    : [];
};
