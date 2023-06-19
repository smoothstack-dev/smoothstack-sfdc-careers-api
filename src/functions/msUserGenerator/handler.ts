import { SNSEvent } from 'aws-lambda';
import { addMSUser } from '../../service/msUser.service';
import { getMSAuthData } from '../../service/auth/microsoft.oauth.service';
import { getSFDCConnection } from '../../service/auth/sfdc.auth.service';
import { fetchApplication } from '../../service/application.service';
import { publishConsultantGenerationRequest } from '../../service/sns.service';

const msUserGenerator = async (event: SNSEvent) => {
  try {
    console.log('Received MS User Generation Request.');
    const { applicationId }: { applicationId: string } = JSON.parse(event.Records[0].Sns.Message);
    const { token } = await getMSAuthData();
    const conn = await getSFDCConnection();
    const { Candidate__r } = await fetchApplication(conn, applicationId);
    const msUser = await addMSUser(token, conn, Candidate__r);
    await publishConsultantGenerationRequest(applicationId, msUser);
    console.log('Successfully generated MS User.');
  } catch (e) {
    console.error('Error generating MS user: ', e);
    throw e;
  }
};

export const main = msUserGenerator;
