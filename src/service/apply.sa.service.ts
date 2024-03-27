import { APIGatewayProxyEvent } from 'aws-lambda';
import { parse } from 'aws-multipart-parser';
import { Knockout, KNOCKOUT_NOTE } from '../model/Knockout';
import { toTitleCase } from '../util/misc.util';
import { getSFDCConnection } from './auth/sfdc.auth.service';
import { getSchedulingLink } from '../util/links';
import { SchedulingTypeId } from '../model/SchedulingType';
import { saveNote } from './notes.service';
import { publishDataGenerationRequest } from './sns.service';
import { findContactByEmailOrPhone } from './contact.service';
import { saveSFDCFiles } from './files.service';
import { SACandidateFields } from '../model/Candidate.sa';
import { SA_CANDIDATE_RECORD_TYPE_ID } from './candidate.sa.service';
import { createSAApplication } from './application.sa.service';
import { SAApplicationFields } from '../model/Application.sa';
import { calculateSAKnockout } from '../util/knockout.sa.util';
import { fetchSAJob } from './jobs.sa.service';
import { SA_KNOCKOUT_STATUS } from '../model/Knockout.sa';

export const apply = async (event: APIGatewayProxyEvent) => {
  console.log('Received SA Candidate Application Request: ', event.queryStringParameters);

  const { firstName, lastName, email, format, phone, jobId, ...extraFields } = event.queryStringParameters;
  const { workAuthorization, willRelocate, yearsOfProfessionalExperience, city, state, zip, nickName } = extraFields;

  const { resume } = parse(event, true);
  const conn = await getSFDCConnection();

  const formattedFirstName = toTitleCase(firstName);
  const formattedLastName = toTitleCase(lastName);
  const formattedEmail = email.toLowerCase();
  const formattedPhone = phone.replace(/\D+/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  const existingCandidate = await findContactByEmailOrPhone(
    conn,
    formattedEmail,
    formattedPhone,
    SA_CANDIDATE_RECORD_TYPE_ID
  );

  const job = await fetchSAJob(conn, jobId);
  const knockout = calculateSAKnockout(
    { requiredWorkAuthorization: job.Req_Work_Authorization__c.split(';') },
    { workAuthorization }
  );

  const candidateFields: SACandidateFields = {
    firstName: formattedFirstName,
    lastName: formattedLastName,
    nickName,
    email: formattedEmail,
    phone: formattedPhone,
    status: SA_KNOCKOUT_STATUS[knockout].candidateStatus,
    city,
    state,
    zip,
  };

  const applicationFields: SAApplicationFields = {
    status: SA_KNOCKOUT_STATUS[knockout].applicationStatus,
    workAuthorization,
    willRelocate,
    yearsOfProfessionalExperience,
  };

  const { applicationId, candidateId } = await createSAApplication(
    conn,
    job.Id,
    {
      candidateFields,
      applicationFields,
    },
    existingCandidate?.Id
  );

  await saveNote(conn, candidateId, { title: 'Knockout', content: KNOCKOUT_NOTE[knockout] });
  await publishDataGenerationRequest(applicationId, 'SMS_CONTACT');

  try {
    const resumeFile = resume as any;
    await saveSFDCFiles(conn, applicationId, [
      {
        type: 'Submission Resume',
        contentType: resumeFile.contentType,
        fileContent: Buffer.from(resumeFile.content).toString('base64'),
        name: resumeFile.filename,
      },
    ]);
  } catch (e) {
    await saveNote(conn, candidateId, {
      title: 'Resume Upload Error',
      content:
        'Error uploading Submission Resume. Please collect file manually from candidate at a later stage in the recruiting process.',
    });
  }

  console.log('Successfully created new Candidate.');

  return {
    applicationId,
    candidateId,
  };
};
