import { CohortEventProcessingRequest } from '../model/Cohort';
import { getMSAuthData } from './auth/microsoft.oauth.service';
import { getSFDCConnection } from './auth/sfdc.auth.service';
import { fetchCohort, updateCohort } from './cohort.service';
import { addDistribution, addTeam, deleteTeam, updateDistribution, updateTeam } from './msAdmin.service';

export const processCohortEvent = async ({ eventType, cohortId }: CohortEventProcessingRequest) => {
  const conn = await getSFDCConnection();
  const { token } = await getMSAuthData();

  const cohort = await fetchCohort(conn, cohortId);
  if (eventType === 'deleted') {
    const requests = [deleteTeam(token, cohort.MSDistributionID__c), deleteTeam(token, cohort.MSTeamID__c)];
    await Promise.all(requests);
  } else {
    const {
      MSTeamID__c: existingMsTeamId,
      MSDistributionID__c: existingMsDistroId,
      Slack_Channel_Name__c: existingMsTeamName,
      Email_Distribution_Name__c: existingMsDistroName,
    } = cohort;
    const { id: msTeamId, name: msTeamName } = existingMsTeamId
      ? await updateTeam(token, existingMsTeamId, cohort, existingMsTeamName)
      : await addTeam(token, cohort);
    await updateCohort(conn, cohortId, {
      MSTeamID__c: msTeamId,
      Slack_Channel_Name__c: msTeamName,
    });
    const { id: msDistroId, name: msDistroName } = existingMsDistroId
      ? await updateDistribution(token, existingMsDistroId, cohort, existingMsDistroName)
      : await addDistribution(token, cohort);
    await updateCohort(conn, cohortId, {
      MSDistributionID__c: msDistroId,
      Email_Distribution_Name__c: `${msDistroName}@smoothstack.com`,
    });
  }
  console.log('Successfully processed cohort event processing request.');
};
