import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { apply } from '../../service/apply.service';
import { fetchJobs } from '../../service/jobs.service';
import { getSFDCConnection } from '../../service/sfdc.service';

const jobs = async (event: APIGatewayEvent) => {
  try {
    switch (event.httpMethod) {
      case 'GET':
        const conn = await getSFDCConnection();
        return await fetchJobs(conn);
      case 'POST':
        return await apply(event as any);
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(jobs);
