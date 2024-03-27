import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { apply } from '../../service/apply.sa.service';
import { getSFDCConnection } from '../../service/auth/sfdc.auth.service';
import { fetchSAJob, fetchSAJobs, findActiveSAJobs, updateSAJob } from '../../service/jobs.sa.service';

const saJobs = async (event: APIGatewayEvent) => {
  try {
    const { jobId } = event.pathParameters ?? {};
    const conn = await getSFDCConnection();
    switch (event.httpMethod) {
      case 'GET':
        if (jobId) {
          return await fetchSAJob(conn, jobId);
        } else {
          const { active } = event.queryStringParameters || {};
          return active === 'true' ? await findActiveSAJobs(conn) : await fetchSAJobs(conn);
        }
      case 'POST':
        return await apply(event as any);
      case 'PUT':
        await updateSAJob(conn, jobId, event.body as any);
        break;
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(saJobs);
