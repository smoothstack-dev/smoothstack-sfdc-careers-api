import { Connection } from 'jsforce';
import { SmoothstackSchema } from '../model/smoothstack.schema';

export const fetchJobs = async (conn: Connection<SmoothstackSchema>) => {
  const jobs = await conn.sobject('Job__c').find();
  return jobs;
};

// TODO: Add logic to find active jobs through publishing status
export const findActiveJobs = async (conn: Connection<SmoothstackSchema>) => {
  const jobs = await conn.sobject('Job__c').find();
  return jobs;
};
