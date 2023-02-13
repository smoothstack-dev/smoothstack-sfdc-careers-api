import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { getSFDCConnection } from '../../service/sfdc.service';

const sfdcUser = async (event: APIGatewayEvent) => {
  const conn = await getSFDCConnection();
  const userEmail = event.queryStringParameters?.email;
  return await conn.sobject('Contact').find({
    Email: userEmail,
  });
};

export const main = middyfy(sfdcUser);
