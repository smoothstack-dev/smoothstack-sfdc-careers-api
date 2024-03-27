import { Connection } from 'jsforce';
import { SmoothstackSchema } from '../model/smoothstack.schema';
import { SAJob } from '../model/Job.sa';

const SA_REQ_RECORD_TYPE_ID = '0125G000001MwvKQAS';

export const fetchSAJobs = async (conn: Connection<SmoothstackSchema>): Promise<SAJob[]> => {
  const jobs = await conn.sobject('Opportunity').find({ RecordTypeId: SA_REQ_RECORD_TYPE_ID });
  return jobs;
};

export const findActiveSAJobs = async (conn: Connection<SmoothstackSchema>): Promise<SAJob[]> => {
  const jobs = await conn
    .sobject('Opportunity')
    .find({ Publishing_Status__c: { $eq: 'Published' }, $and: { RecordTypeId: SA_REQ_RECORD_TYPE_ID } });
  return jobs;
};

export const fetchSAJob = async (conn: Connection<SmoothstackSchema>, jobId: string) => {
  const job = await conn
    .sobject('Opportunity')
    .findOne({ Requisition__c: { $eq: jobId ?? null }, $and: { RecordTypeId: SA_REQ_RECORD_TYPE_ID } });
  return job;
};

export const updateSAJob = async (conn: Connection<SmoothstackSchema>, jobId: string, updateFields: Partial<SAJob>) => {
  const { Id } = await fetchSAJob(conn, jobId);
  await conn.sobject('Opportunity').update({ Id, ...updateFields });
};
