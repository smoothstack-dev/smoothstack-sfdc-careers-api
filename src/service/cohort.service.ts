import { Connection } from 'jsforce';
import {
  Fields$Cohort_Participant__c,
  Fields$Cohort__c,
  Fields$Job__c,
  SmoothstackSchema,
} from '../model/smoothstack.schema';
import { CohortParticipant } from '../model/Cohort';

export const fetchCohort = async (conn: Connection<SmoothstackSchema>, cohortId: string): Promise<Fields$Cohort__c> => {
  return await conn.sobject('Cohort__c').findOne({ Id: { $eq: cohortId ?? null } });
};

export const findCohortByJobId = async (
  conn: Connection<SmoothstackSchema>,
  jobId: string
): Promise<Fields$Cohort__c> => {
  return await conn.sobject('Cohort__c').findOne({
    Job_Id__c: { $eq: jobId ? `${jobId}` : null },
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

const insertCohort = async (
  conn: Connection<SmoothstackSchema>,
  insertFields: Partial<Fields$Cohort__c>
): Promise<string> => {
  const { id } = await conn.sobject('Cohort__c').create(insertFields);
  return id;
};

export const updateCohort = async (
  conn: Connection<SmoothstackSchema>,
  cohortId: string,
  updateFields: Partial<Fields$Cohort__c>
) => {
  await conn.sobject('Cohort__c').update({ Id: cohortId, ...updateFields });
};

export const fetchCohortParticipant = async (
  conn: Connection<SmoothstackSchema>,
  cohortParticipantId: string
): Promise<CohortParticipant> => {
  return await conn
    .sobject('Cohort_Participant__c')
    .findOne({ Id: { $eq: cohortParticipantId ?? null } })
    .select('Id, MSMembershipId__c, Cohort__r.*, Participant__r.*');
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
    Is_Latest__c: true,
  });
};

export const updateCohortParticipant = async (
  conn: Connection<SmoothstackSchema>,
  cohortParticipantId: string,
  updateFields: Partial<Fields$Cohort_Participant__c>
) => {
  await conn.sobject('Cohort_Participant__c').update({ Id: cohortParticipantId, ...updateFields });
};

export const deleteCohortParticipant = async (conn: Connection<SmoothstackSchema>, cohortParticipantId: string) => {
  await conn.sobject('Cohort_Participant__c').destroy(cohortParticipantId);
};

export const saveCohort = async (
  conn: Connection<SmoothstackSchema>,
  job: Fields$Job__c
): Promise<Partial<Fields$Cohort__c>> => {
  const dataFields: Partial<Fields$Cohort__c> = {
    Name: deriveCohortName(job.Quick_Course_Start_Date__c, job.Cohort_Category__c),
    Training_Start_Date__c: job.Quick_Course_Start_Date__c,
    Cohort_Category__c: job.Cohort_Category__c,
    Job_ID__c: job.Id,
  };
  const existingCohort = await findCohortByJobId(conn, job.Id);
  if (existingCohort) {
    await updateCohort(conn, existingCohort.Id, dataFields);
    return existingCohort;
  } else {
    return { Id: await insertCohort(conn, dataFields) };
  }
};

export const deriveCohortName = (startDate: string, category: string) => {
  const date = new Date(startDate);
  const year = date.getFullYear();
  const numberMonth = (date.getMonth() + 1).toLocaleString('en-US', {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });
  const dayOfMonth = date.getUTCDate().toLocaleString('en-US', {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });
  const technology = category.replace(/ /g, '');

  return `${year}_${numberMonth}_${dayOfMonth}_${technology}`;
};

export const fetchPreviousParticipantCohortId = async (
  conn: Connection<SmoothstackSchema>,
  cohortParticipantId: string
): Promise<string> => {
  const history = await conn
    .sobject('Cohort_Participant__History')
    .find({ ParentId: { $eq: cohortParticipantId ?? null }, $and: [{ Field: 'Cohort__c' }, { DataType: 'EntityId' }] })
    .orderby('CreatedDate', 'DESC');
  return history[0].OldValue;
};
