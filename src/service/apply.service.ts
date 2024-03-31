import { APIGatewayProxyEvent } from 'aws-lambda';
import { parse } from 'aws-multipart-parser';
import { Knockout, KNOCKOUT_NOTE, KNOCKOUT_STATUS } from '../model/Knockout';
import { toTitleCase } from '../util/misc.util';
import { resolveJobByKnockout } from '../util/job.util';
import { getSFDCConnection } from './auth/sfdc.auth.service';
import { fetchJob, findActiveKOJobs } from './jobs.service';
import { calculateKnockout } from '../util/knockout.util';
import { createApplication } from './application.service';
import { getSchedulingLink } from '../util/links';
import { SchedulingTypeId } from '../model/SchedulingType';
import { saveNote } from './notes.service';
import { generateApplicationNote } from '../util/note.util';
import { publishDataGenerationRequest } from './sns.service';
import { findContactByEmailOrPhone } from './contact.service';
import { saveSFDCFiles } from './files.service';
import { Candidate, CandidateFields } from '../model/Candidate';
import { Fields$Job__c } from '../model/smoothstack.schema';
import { CANDIDATE_RECORD_TYPE_ID } from './candidate.service';

export const apply = async (event: APIGatewayProxyEvent) => {
  console.log('Received Candidate Application Request: ', event.queryStringParameters);
  const {
    jobId,
    firstName,
    lastName,
    nickName,
    email,
    format,
    phone,
    utmSource,
    utmMedium,
    utmCampaign,
    utmTerm,
    deviceType,
    city,
    state,
    zip,
    gender,
    race,
    disability,
    militaryStatus,
    militaryBranch,
    ...extraFields
  } = event.queryStringParameters;
  const { resume } = parse(event, true);
  const conn = await getSFDCConnection('57.0');

  const formattedFirstName = toTitleCase(firstName);
  const formattedLastName = toTitleCase(lastName);
  const formattedEmail = email.toLowerCase();
  const formattedPhone = phone.replace(/\D+/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  const existingCandidate: Candidate = await findContactByEmailOrPhone(
    conn,
    formattedEmail,
    formattedPhone,
    CANDIDATE_RECORD_TYPE_ID
  );
  const existingApplications = existingCandidate?.Applications__r?.records ?? [];

  const {
    workAuthorization,
    relocation,
    graduationDate,
    yearsOfExperience,
    highestDegree: educationDegree,
    degreeExpected,
    codingAbility,
    techSelection,
    hardwareDesign,
    hardwareSkills,
    mechanicalAbility,
    physicalRequirements,
  } = extraFields;

  const knockoutFields = {
    workAuthorization,
    relocation,
    graduationDate,
    yearsOfExperience,
    educationDegree,
    degreeExpected,
    selfRank: +(codingAbility ?? mechanicalAbility),
    techSelection,
    hardwareDesign,
    hardwareSkills,
    existingApplications,
    // technician job
    physicalRequirements,
  };

  let job: Fields$Job__c;

  if (+jobId === 1) {
    const activeJobs = await findActiveKOJobs(conn);
    job = resolveJobByKnockout(knockoutFields, activeJobs);
  } else {
    job = await fetchJob(conn, 58);
  }
  const knockoutReqs = {
    requiredWorkAuthorization: job.Allowable_Work_Authorization__c.split(';'),
    jobLocation: job.Job_Location__c,
    maxMonthsToGraduation: job.Max_Months_to_Graduation__c,
    minYearsOfExperience: job.Min_Years_of_Coding_Experience__c,
    minRequiredDegree: job.Min_Degree_Required__c,
    minSelfRank: +job.Min_Coding_Self_Rank__c,
  };
  const knockout = calculateKnockout(knockoutReqs, knockoutFields);

  const candidateFields: CandidateFields = {
    firstName: formattedFirstName,
    lastName: formattedLastName,
    nickName,
    email: formattedEmail,
    phone: formattedPhone,
    city,
    state,
    zip,
    status: KNOCKOUT_STATUS[knockout].candidateStatus,
    gender,
    race,
    disability,
    militaryStatus,
    militaryBranch,
  };

  const applicationFields = {
    status: KNOCKOUT_STATUS[knockout].applicationStatus,
    deviceType,
    ...(utmSource && { utmSource }),
    ...(utmMedium && { utmMedium }),
    ...(utmCampaign && { utmCampaign }),
    ...(utmTerm && { utmTerm }),
    ...extraFields,
    selfRank: +(codingAbility ?? mechanicalAbility),
  } as any;

  const { applicationId, candidateId } = await createApplication(
    conn,
    job.Id,
    {
      candidateFields,
      applicationFields,
    },
    existingCandidate?.Id
  );

  const noteReqs = [
    saveNote(conn, candidateId, {
      title: 'Application Survey',
      content: generateApplicationNote({ candidateFields, applicationFields }),
    }),
    saveNote(conn, candidateId, { title: 'Knockout', content: KNOCKOUT_NOTE[knockout] }),
  ];
  await Promise.all(noteReqs);
  await publishDataGenerationRequest(applicationId, 'INITIAL_LINKS');
  await publishDataGenerationRequest(applicationId, 'SMS_CONTACT');

  if (resume) {
    try {
      const resumeFile = resume as any;
      await saveSFDCFiles(conn, applicationId, [
        {
          type: 'Application Resume',
          contentType: resumeFile.contentType,
          fileContent: Buffer.from(resumeFile.content).toString('base64'),
          name: resumeFile.filename,
        },
      ]);
    } catch (e) {
      await saveNote(conn, candidateId, {
        title: 'Resume Upload Error',
        content:
          'Error uploading Application Resume. Please collect file manually from candidate at a later stage in the recruiting process.',
      });
    }
  }

  console.log('Successfully created new Candidate.');

  return {
    ...(knockout === Knockout.PASS && {
      schedulingLink: getSchedulingLink(
        formattedFirstName,
        formattedLastName,
        formattedEmail,
        formattedPhone,
        SchedulingTypeId.CHALLENGE,
        applicationId
      ),
      jobOrder: job,
    }),
  };
};
