import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { apply } from '../../service/apply.service';
import { fetchJob, fetchJobs, findActiveJobs, updateJob } from '../../service/jobs.service';
import { getSFDCConnection } from '../../service/auth/sfdc.auth.service';
import { deriveMailingState, migrateCandidates } from '../../service/bh.service';
import { publishDataGenerationRequest } from '../../service/sns.service';

const jobs = async (event: APIGatewayEvent) => {
  try {
    const { jobId } = event.pathParameters ?? {};
    const conn = await getSFDCConnection();
    switch (event.httpMethod) {
      case 'GET':
        await publishDataGenerationRequest('123', 'INITIAL_LINKS')
        break;
      // if (jobId) {
      //   return await fetchJob(conn, +jobId);
      // } else {
      //   const { active } = event.queryStringParameters || {};
      //   return active === 'true' ? await findActiveJobs(conn) : await fetchJobs(conn);
      // }
      case 'POST':
        return await apply(event as any);
      case 'PUT':
        await updateJob(conn, +jobId, event.body as any);
        break;
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(jobs);
