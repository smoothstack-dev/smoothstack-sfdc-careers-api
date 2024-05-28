import { getMSAuthData } from './auth/microsoft.oauth.service';
import { getSFDCConnection } from './auth/sfdc.auth.service';
import {
  fetchCohort,
  fetchCohortParticipant,
  fetchPreviousParticipantCohortId,
  updateCohortParticipant,
} from './cohort.service';
import { addDistributionMember, addTeamMember, removeDistributionMember, removeTeamMember } from './msAdmin.service';
import { findMsUserByEmail } from './msUser.service';

export const reassignCohortParticipant = async (cohortParticipantId: string) => {
  const conn = await getSFDCConnection();
  const { token } = await getMSAuthData();
  const previousCohortId = await fetchPreviousParticipantCohortId(conn, cohortParticipantId);
  const previousCohort = await fetchCohort(conn, previousCohortId);
  
  const {
    Cohort__r: newCohort,
    MSMembershipId__c,
    Participant__r,
  } = await fetchCohortParticipant(conn, cohortParticipantId);
  const msUser = await findMsUserByEmail(token, Participant__r.Smoothstack_Email__c);
  try {
    const deleteRequests = [
      removeTeamMember(token, previousCohort.MSTeamID__c, MSMembershipId__c),
      removeDistributionMember(token, previousCohort.MSDistributionID__c, msUser.userPrincipalName),
    ];
    await Promise.all(deleteRequests);
  } catch (e) {
    console.error('Error attempting to remove existing MS Team/DL member on reassignment. Skipping removal step.');
  }

  const membershipId = await addTeamMember(token, newCohort.MSTeamID__c, msUser.id);
  await addDistributionMember(token, newCohort.MSDistributionID__c, msUser.id);
  await updateCohortParticipant(conn, cohortParticipantId, { MSMembershipId__c: membershipId });
};
