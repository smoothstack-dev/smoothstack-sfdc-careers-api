import { SNSEvent } from 'aws-lambda';
import { getSFDCConnection } from '../../service/auth/sfdc.auth.service';
import { fetchApplication } from '../../service/application.service';
import { CohortUserGenerationRequest } from '../../model/Cohort';
import {
  deleteCohortParticipant,
  fetchCohort,
  findCohortByJobId,
  findCohortParticipantByConsultantId,
  insertCohortParticipant,
} from '../../service/cohort.service';
import {
  addDistributionMember,
  addTeamMember,
  removeDistributionMember,
  removeTeamMember,
} from '../../service/msAdmin.service';
import { getMSAuthData } from '../../service/auth/microsoft.oauth.service';
import { fetchMSUser } from '../../service/msUser.service';

const cohortUserGenerator = async (event: SNSEvent) => {
  try {
    console.log('Received Cohort User Generation Request.');
    const { applicationId, msUser }: CohortUserGenerationRequest = JSON.parse(event.Records[0].Sns.Message);
    const conn = await getSFDCConnection();
    const { token: msToken } = await getMSAuthData();
    const { Candidate__r, Job__r } = await fetchApplication(conn, applicationId);
    const { Id: Cohort_Id, MSTeamID__c, MSDistributionID__c } = await findCohortByJobId(conn, Job__r.Job_ID__c);
    const cohortParticipant = await findCohortParticipantByConsultantId(conn, Candidate__r.Id);
    if (cohortParticipant?.Cohort__c !== Cohort_Id) {
      if (cohortParticipant) {
        const participantCohort = await fetchCohort(conn, cohortParticipant.Cohort__c);
        await removeTeamMember(msToken, participantCohort.MSTeamID__c, cohortParticipant.MSMembershipId__c);
        await removeDistributionMember(msToken, participantCohort.MSDistributionID__c, msUser.userPrincipalName);
        await deleteCohortParticipant(conn, cohortParticipant.Id);
      }
      const msUserId = msUser.id ?? (await fetchMSUser(msToken, msUser.userPrincipalName)).id;
      const membershipId = await addTeamMember(msToken, MSTeamID__c, msUserId);
      await addDistributionMember(msToken, MSDistributionID__c, msUserId);
      await insertCohortParticipant(conn, Cohort_Id, Candidate__r.Id, membershipId);
    }
    console.log('Successfully generated Cohort User.');
  } catch (e) {
    console.error('Error generating Cohort User: ', e);
    throw e;
  }
};

export const main = cohortUserGenerator;
