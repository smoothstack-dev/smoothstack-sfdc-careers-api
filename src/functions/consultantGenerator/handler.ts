import { SNSEvent } from 'aws-lambda';
import { getSFDCConnection } from '../../service/auth/sfdc.auth.service';
import { fetchApplication } from '../../service/application.service';
import { createConsultantFromCandidate } from '../../service/consultant.service';
import { ConsultantGenerationRequest } from '../../model/Consultant';
import { getMSAuthData } from '../../service/auth/microsoft.oauth.service';
import { createMSUserSubscription } from '../../service/msSubscriptions.service';
import { updateCandidate } from '../../service/candidate.service';
import { sendLicenseAssignmentNotification } from '../../service/email.service';
import { publishCohortUserGenerationRequest } from '../../service/sns.service';

const consultantGenerator = async (event: SNSEvent) => {
  try {
    console.log('Received Consultant Generation Request.');
    const { applicationId, msUser }: ConsultantGenerationRequest = JSON.parse(event.Records[0].Sns.Message);
    const conn = await getSFDCConnection();
    const { token: msToken, callBackUrlV2 } = await getMSAuthData();
    const { Candidate__r } = await fetchApplication(conn, applicationId);
    await createConsultantFromCandidate(conn, Candidate__r, msUser);
    if (msUser.id) {
      const subscriptionId = await createMSUserSubscription(msToken, msUser.id, callBackUrlV2);
      await updateCandidate(conn, Candidate__r.Id, { MS_Subscription_ID__c: subscriptionId });
    }
    if (!msUser.assignedLicenses.length) {
      await sendLicenseAssignmentNotification(msToken, Candidate__r, msUser.userPrincipalName);
    }
    await publishCohortUserGenerationRequest(applicationId, msUser);
    console.log('Successfully generated consultant.');
  } catch (e) {
    console.error('Error generating Consultant: ', e);
    throw e;
  }
};

export const main = consultantGenerator;
