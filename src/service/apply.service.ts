import { APIGatewayProxyEvent } from 'aws-lambda';
import { parse } from 'aws-multipart-parser';
import { Knockout, KNOCKOUT_NOTE, KNOCKOUT_STATUS } from '../model/Knockout';
import { toTitleCase } from '../util/misc.util';
import { resolveJobByKnockout } from '../util/job.util';
import { getSFDCConnection } from './auth/sfdc.auth.service';
import { findActiveKOJobs } from './jobs.service';
import { calculateKnockout } from '../util/knockout.util';
import { createApplication } from './application.service';
import { getSchedulingLink } from '../util/links';
import { SchedulingTypeId } from '../model/SchedulingType';
import { Application } from '../model/Application';
import { saveNote } from './notes.service';
import { generateApplicationNote } from '../util/note.util';
import { publishDataGenerationRequest } from './sns.service';
import { findContactByEmailOrPhone } from './contact.service';
import { saveSFDCFiles } from './files.service';

const DAY_DIFF = 60;

export const apply = async (event: APIGatewayProxyEvent) => {
  console.log('Received Candidate Application Request: ', event.queryStringParameters);
  const {
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
    ...extraFields
  } = event.queryStringParameters;
  const { resume } = parse(event, true);
  const conn = await getSFDCConnection();

  const formattedFirstName = toTitleCase(firstName);
  const formattedLastName = toTitleCase(lastName);
  const formattedEmail = email.toLowerCase();
  const formattedPhone = phone.replace(/\D+/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
  const existingCandidate = await findContactByEmailOrPhone(conn, formattedEmail, formattedPhone);
  const existingApplications = existingCandidate?.Applications__r?.records ?? [];

  if (!hasRecentApplication(existingApplications)) {
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
    } = extraFields;

    const activeJobs = await findActiveKOJobs(conn);
    const knockoutFields = {
      workAuthorization,
      relocation,
      graduationDate,
      yearsOfExperience,
      educationDegree,
      degreeExpected,
      codingAbility: +codingAbility,
      techSelection,
      hardwareDesign,
      hardwareSkills,
    };

    const job = resolveJobByKnockout(knockoutFields, activeJobs);
    const knockout = calculateKnockout(
      {
        requiredWorkAuthorization: job.Allowable_Work_Authorization__c.split(';'),
        jobLocation: job.Job_Location__c,
        maxMonthsToGraduation: job.Max_Months_to_Graduation__c,
        minYearsOfExperience: job.Min_Years_of_Coding_Experience__c,
        minRequiredDegree: job.Min_Degree_Required__c,
        minSelfRank: +job.Min_Coding_Self_Rank__c,
      },
      knockoutFields
    );

    const candidateFields = {
      firstName: formattedFirstName,
      lastName: formattedLastName,
      nickName,
      email: formattedEmail,
      phone: formattedPhone,
      city,
      state,
      zip,
      status: KNOCKOUT_STATUS[knockout].candidateStatus,
    };

    const applicationFields = {
      status: KNOCKOUT_STATUS[knockout].applicationStatus,
      deviceType,
      ...(utmSource && { utmSource }),
      ...(utmMedium && { utmMedium }),
      ...(utmCampaign && { utmCampaign }),
      ...(utmTerm && { utmTerm }),
      ...extraFields,
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
  }
  console.log(`Candidate already has a job submission in the last ${DAY_DIFF} days, skipping creation...`);
  return existingCandidate;
};

const hasRecentApplication = (applications: Application[]): boolean => {
  return applications.some((a) => {
    const timeDiff = new Date().getTime() - new Date(a.CreatedDate).getTime();
    const dayDiff = timeDiff / (1000 * 3600 * 24);
    return dayDiff < DAY_DIFF;
  });
};
