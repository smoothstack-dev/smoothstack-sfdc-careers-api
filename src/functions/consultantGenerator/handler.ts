import { SNSEvent } from 'aws-lambda';
import { getSFDCConnection } from '../../service/auth/sfdc.auth.service';


const consultantGenerator = async (event: SNSEvent) => {
  try {
    console.log('Received Consultant Generation Request.');
    const { applicationId }: { applicationId: string } = JSON.parse(event.Records[0].Sns.Message);
    const conn = await getSFDCConnection();

    console.log('Successfully generated consultant.');
  } catch (e) {
    console.error('Error generating Consultant: ', e);
    throw e;
  }
};

export const main = consultantGenerator;
