import { Connection, DateString } from 'jsforce';
import { ChallengeLinksData, TechScreenLinksData } from '../model/Links';
import { SchedulingTypeId } from '../model/SchedulingType';
import { SmoothstackSchema } from '../model/smoothstack.schema';
import { getSchedulingLink } from '../util/links';
import { fetchApplication, updateApplication } from './application.service';
import { fetchCandidate } from './candidate.service';
import { Application } from '../model/Application';
import { CHALLENGE_APP_STATUS, deriveChallengeResult } from '../util/challenge.util';
import { generateChallengeLink } from './challenge.service';
import { deriveApplicationStatus, deriveApplicationStatusTS } from '../util/application.util';
import { findHTDAssignmentGroupMemberByUserId } from './assigmentGroup.service';
import { publishDataGenerationRequest } from './sns.service';

export const generateInitialLinks = async (conn: Connection<SmoothstackSchema>, applicationId: string) => {
  const application = await fetchApplication(conn, applicationId);
  const { Candidate__r, Job__r } = application;
  const { Calendar_ID__c } = await findHTDAssignmentGroupMemberByUserId(conn, Candidate__r.Owner.Id);
  const webinarSchedulingLink = getSchedulingLink(
    Candidate__r.FirstName,
    Candidate__r.LastName,
    Candidate__r.Email,
    Candidate__r.MobilePhone,
    Job__r.Cohort_Category__c === 'Technician' ? SchedulingTypeId.TECHNICIAN_WEBINAR : SchedulingTypeId.WEBINAR,
    application.Id
  );

  const challengeSchedulingLink = getSchedulingLink(
    Candidate__r.FirstName,
    Candidate__r.LastName,
    Candidate__r.Email,
    Candidate__r.MobilePhone,
    SchedulingTypeId.CHALLENGE,
    application.Id
  );

  const prescreenSchedulingLink = getSchedulingLink(
    Candidate__r.FirstName,
    Candidate__r.LastName,
    Candidate__r.Email,
    Candidate__r.MobilePhone,
    SchedulingTypeId.PRESCREEN,
    application.Id,
    Calendar_ID__c
  );

  await updateApplication(
    conn,
    { id: applicationId },
    {
      Challenge_Scheduling_Link__c: challengeSchedulingLink,
      Webinar_Scheduling_Link__c: webinarSchedulingLink,
      Prescreen_Scheduling_Link__c: prescreenSchedulingLink,
    }
  );

  console.log('Successfully generated initial links for application:');
  console.log(`Application ID: ${applicationId}`);
};

export const generateChallengeLinks = async (conn: Connection<SmoothstackSchema>, applicationId: string) => {
  const application = await fetchApplication(conn, applicationId);
  const { Candidate__r, Challenge_Link__c } = application;

  if (!Challenge_Link__c) {
    const { Applications__r } = await fetchCandidate(conn, Candidate__r.Id);
    const { challengeLink, previousChallengeId, previousChallengeScore, applicationStatus } =
      await getChallengeLinksData(Applications__r.records, application);
    const { stageName, rejectionReason } = deriveApplicationStatus(applicationStatus);
    await updateApplication(
      conn,
      { id: applicationId },
      {
        Challenge_Link__c: challengeLink,
        ...(stageName && { StageName: stageName }),
        ...(rejectionReason && { Rejection_Reason__c: rejectionReason }),
        ...(previousChallengeId && { Previous_Challenge_ID__c: previousChallengeId }),
        ...(previousChallengeScore && { Challenge_Score__c: previousChallengeScore }),
      }
    );
    applicationStatus === 'Challenge Passed' && (await publishDataGenerationRequest(applicationId, 'TECHSCREEN_LINKS'));
    if (!applicationStatus) {
      return challengeLink;
    }
  }
  return Challenge_Link__c;
};

const getChallengeLinksData = async (
  existingApplications: Application[],
  newApplication: Application
): Promise<ChallengeLinksData> => {
  const matchedApplication = existingApplications.find(
    (a) =>
      a.Id !== newApplication.Id &&
      a.Challenge_Link__c &&
      a.Job__r.Coding_Challenge_Name__c === newApplication.Job__r.Coding_Challenge_Name__c &&
      !a.Previous_Challenge_ID__c
  );
  const challengeResult = deriveChallengeResult(
    matchedApplication?.Challenge_Score__c,
    newApplication.Job__r.Passing_Challenge_Score__c
  );
  const applicationStatus = CHALLENGE_APP_STATUS[challengeResult];

  return {
    challengeLink: matchedApplication?.Challenge_Link__c || (await generateChallengeLink(newApplication)),
    previousChallengeId: matchedApplication?.Id,
    previousChallengeScore: matchedApplication?.Challenge_Score__c,
    applicationStatus,
  };
};

export const generateTechScreenLinks = async (conn: Connection<SmoothstackSchema>, applicationId: string) => {
  const application = await fetchApplication(conn, applicationId);
  const { Candidate__r, Tech_Screen_Scheduling_Link__c, Job__r } = application;

  if (!Tech_Screen_Scheduling_Link__c) {
    const { Applications__r } = await fetchCandidate(conn, Candidate__r.Id);
    const { techScreenSchedulingLink, techScreenResult, techScreenDate, screenerDetermination, applicationStatus } =
      getTechScreenLinksData(Applications__r.records, application);

    const updateData: Partial<Application> = {
      Tech_Screen_Scheduling_Link__c: techScreenSchedulingLink,
      ...(applicationStatus?.stageName && { StageName: applicationStatus.stageName }),
      ...(applicationStatus?.rejectionReason && { StageName: applicationStatus.rejectionReason }),
      ...(techScreenResult && { Tech_Screen_Result__c: techScreenResult }),
      ...(techScreenDate && { Tech_Screen_Date__c: techScreenDate as DateString }),
      ...(screenerDetermination && { Screener_Determination__c: screenerDetermination }),
    };
    await updateApplication(conn, { id: applicationId }, updateData);
    console.log('Successfully generated techscreen links for submission:');
  } else {
    console.log('Submission already has techscreen links. Submission not processed:');
  }
  console.log(`Submission ID: ${applicationId}`);
  console.log({ Job__r, Candidate__r });
};

const getTechScreenLinksData = (
  existingApplications: Application[],
  newApplication: Application
): TechScreenLinksData => {
  const matchedApplication = existingApplications.find(
    (a) =>
      a.Id !== newApplication.Id &&
      a.Tech_Screen_Scheduling_Link__c &&
      a.Screener_Determination__c &&
      a.Job__r.Coding_Challenge_Name__c === newApplication.Job__r.Coding_Challenge_Name__c &&
      isRecentApplication(a, newApplication)
  );

  const applicationStatus = deriveApplicationStatusTS(matchedApplication?.Screener_Determination__c);
  return {
    techScreenSchedulingLink:
      matchedApplication?.Tech_Screen_Scheduling_Link__c ||
      getSchedulingLink(
        newApplication.Candidate__r.FirstName,
        newApplication.Candidate__r.LastName,
        newApplication.Candidate__r.Email,
        newApplication.Candidate__r.MobilePhone,
        SchedulingTypeId.TECHSCREEN,
        newApplication.Id
      ),
    techScreenResult: matchedApplication?.Tech_Screen_Result__c,
    techScreenDate: matchedApplication?.Tech_Screen_Date__c,
    screenerDetermination: matchedApplication?.Screener_Determination__c,
    applicationStatus,
  };
};

const isRecentApplication = (existingApplication: Application, newApplication: Application): boolean => {
  const DAY_DIFF = 90;
  const timeDiff = new Date(newApplication.CreatedDate).getTime() - new Date(existingApplication.CreatedDate).getTime();
  const dayDiff = timeDiff / (1000 * 3600 * 24);
  return dayDiff < DAY_DIFF;
};
