import { Connection } from 'jsforce';
import { Fields$Cohort_Participant__c, Fields$Cohort__c, SmoothstackSchema } from '../model/smoothstack.schema';

export const fetchCohort = async (conn: Connection<SmoothstackSchema>, cohortId: string): Promise<Fields$Cohort__c> => {
  return await conn.sobject('Cohort__c').findOne({ Id: { $eq: cohortId ?? null } });
};
export const findCohortByJobId = async (
  conn: Connection<SmoothstackSchema>,
  jobId: number
): Promise<Fields$Cohort__c> => {
  return await conn.sobject('Cohort__c').findOne({
    BH_Job_Id__c: { $eq: jobId ? `${jobId}` : null },
  });
};

export const findCohortParticipantByConsultantId = async (
  conn: Connection<SmoothstackSchema>,
  consultantId: string
): Promise<Fields$Cohort_Participant__c> => {
  return await conn.sobject('Cohort_Participant__c').findOne({
    Participant__c: { $eq: consultantId ?? null },
  });
};

export const insertCohortParticipant = async (
  conn: Connection<SmoothstackSchema>,
  cohortId: string,
  userId: string,
  membershipId: string
) => {
  await conn.sobject('Cohort_Participant__c').create({
    MSMembershipId__c: membershipId,
    Cohort__c: cohortId,
    Participant__c: userId,
  });
};

export const deleteCohortParticipant = async (conn: Connection<SmoothstackSchema>, cohortParticipantId: string) => {
  await conn.sobject('Cohort_Participant__c').destroy(cohortParticipantId);
};
