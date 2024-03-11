import { Connection } from 'jsforce';
import { Fields$Job__c, SmoothstackSchema } from '../model/smoothstack.schema';

export const fetchJobs = async (conn: Connection<SmoothstackSchema>) => {
  const jobs = await conn.sobject('Job__c').find();
  return jobs;
};

export const findActiveJobs = async (conn: Connection<SmoothstackSchema>) => {
  const jobs = await conn.sobject('Job__c').find({ Publishing_Status__c: { $eq: 'Published' } });
  return jobs;
};

export const findActiveKOJobs = async (conn: Connection<SmoothstackSchema>) => {
  const jobs = await conn
    .sobject('Job__c')
    .find({ Publishing_Status__c: { $eq: 'Published' }, $and: { Job_ID__c: { $nin: [1, 2, 58] } } });
  return jobs;
};

export const fetchJob = async (conn: Connection<SmoothstackSchema>, jobId: number) => {
  const job = await conn.sobject('Job__c').findOne({ Job_ID__c: { $eq: jobId ?? null } });
  return job;
};

export const updateJob = async (
  conn: Connection<SmoothstackSchema>,
  jobId: number,
  updateFields: Partial<Fields$Job__c>
) => {
  const { Id } = await fetchJob(conn, jobId);
  await conn.sobject('Job__c').update({ Id, ...updateFields });
};
