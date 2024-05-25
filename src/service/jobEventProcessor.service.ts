import { getSFDCConnection } from './auth/sfdc.auth.service';
import { saveCohort } from './cohort.service';
import { fetchJob } from './jobs.service';

export const processJobEvent = async (jobId: number) => {
  const conn = await getSFDCConnection();
  const job = await fetchJob(conn, jobId);
  await saveCohort(conn, job);
  console.log('Successfully processed job event processing request.');
};
