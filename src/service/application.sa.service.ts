import { Connection, DateString } from 'jsforce';
import { SmoothstackSchema } from '../model/smoothstack.schema';
import { SACandidate, SACandidateFields } from '../model/Candidate.sa';
import { SAApplication, SAApplicationFields } from '../model/Application.sa';
import { createSACandidate } from './candidate.sa.service';
import { deriveSAApplicationStatus } from '../util/application.sa.util';
import { SAJob } from '../model/Job.sa';

const SA_SUBMISSION_RECORD_TYPE_ID = '012Jw000001vSobIAE';

export const createSAApplication = async (
  conn: Connection<SmoothstackSchema>,
  jobId: string,
  application: { candidateFields: SACandidateFields; applicationFields: SAApplicationFields },
  existingCandidateId?: string
): Promise<{ candidateId: string; applicationId: string }> => {
  const { candidateFields, applicationFields } = application;

  const candidateId = await createSACandidate(conn, candidateFields, existingCandidateId);
  const { status, rejectionReason } = deriveSAApplicationStatus(applicationFields.status);
  const applicationRecord: Partial<SAApplication> = {
    RecordTypeId: SA_SUBMISSION_RECORD_TYPE_ID,
    Submission_Date__c: new Date().toISOString() as DateString,
    Status__c: status,
    ...(rejectionReason && { Rejection_Reason__c: rejectionReason }),
    Work_Authorization__c: applicationFields.workAuthorization,
    Willing_to_Relocate__c: applicationFields.willRelocate,
    Years_Experience__c: applicationFields.yearsOfProfessionalExperience,
    Resource__c: candidateId,
    Opportunity__c: jobId,
  };

  const { id: applicationId }: any = await conn._createSingle('Marketing__c', applicationRecord, {});
  // await conn._createSingle(
  //   'OpportunityContactRole',
  //   {
  //     ContactId: candidateId,
  //     OpportunityId: applicationId,
  //   },
  //   {}
  // );
  return { applicationId, candidateId };
};

export const fetchSAApplication = async (
  conn: Connection<SmoothstackSchema>,
  applicationId: string
): Promise<SAApplication> => {
  const application = await conn
    .sobject('Marketing__c')
    .findOne({ Id: { $eq: applicationId ?? null } })
    .select(
      'Id, Client_Name__c, Pay_Rate__c, Employee_Type__c, Resource__r.Id, Resource__r.FirstName, Resource__r.LastName, Resource__r.Email, Resource__r.MobilePhone, Resource__r.MailingCity, Resource__r.MailingStateCode, Resource__r.MailingStreet, Resource__r.MailingPostalCode, Opportunity__r.Id, Opportunity__r.Job_Title__c'
    );

  return application
    ? {
        ...application,
        Resource__r: (application as any).Resource__r as SACandidate,
        Opportunity__r: (application as any).Opportunity__r as SAJob,
      }
    : null;
};

export const findSAApplication = async (
  conn: Connection<SmoothstackSchema>,
  byField: string,
  fieldValue: string | number
): Promise<SAApplication> => {
  const application = await conn
    .sobject('Marketing__c')
    .findOne({ [byField]: { $eq: `${fieldValue}` } })
    .select('Id, Resource__r.Id, Opportunity__r.Id');

  return application
    ? {
        ...application,
        Resource__r: (application as any).Resource__r as SACandidate,
        Opportunity__r: (application as any).Opportunity__r as SAJob,
      }
    : null;
};

export const updateSAApplication = async (
  conn: Connection<SmoothstackSchema>,
  identifier:
    | { id: string; byField?: never; byValue?: never }
    | { byField: string; byValue: string | number; id?: never },
  updateFields: Partial<SAApplication>
) => {
  const { id, byField, byValue } = identifier;
  let applicationId = id;
  if (byField) {
    const application = await findSAApplication(conn, byField, byValue);
    applicationId = application?.Id;
  }
  if (applicationId) {
    await conn.sobject('Marketing__c').update({ Id: applicationId, ...updateFields });
  }
};
