import { SNSEvent } from 'aws-lambda';
import { getSFDCConnection } from './auth/sfdc.auth.service';
import { generateInitialLinks, generateTechScreenLinks } from './links.service';
import { createContact } from './sms.service';
import { getTextusSecrets } from './secrets.service';
import { fetchApplication } from './application.service';
import { DataGenerationRequest } from '../model/ApplicationData';
import { migrateJobs, migrateCandidates, migrateApplications, migrateFiles, migrateChallengeDate } from './bh.service';

export const generateData = async (event: SNSEvent) => {
  console.log('Received Data Generation Request.');
  await migrateChallengeDate();
  // const request: DataGenerationRequest = JSON.parse(event.Records[0].Sns.Message);
  // const conn = await getSFDCConnection();
  // switch (request.type) {
  //   case 'INITIAL_LINKS': {
  //     await generateInitialLinks(conn, request.applicationId);
  //     break;
  //   }
  //   case 'TECHSCREEN_LINKS': {
  //     await generateTechScreenLinks(conn, request.applicationId);
  //     break;
  //   }
  //   case 'SMS_CONTACT': {
  //     const { ACCESS_TOKEN } = await getTextusSecrets();
  //     const { Candidate__r } = await fetchApplication(conn, request.applicationId);
  //     await createContact(ACCESS_TOKEN, Candidate__r.MobilePhone, Candidate__r.FirstName, Candidate__r.LastName);
  //     break;
  //   }
  // }
};
