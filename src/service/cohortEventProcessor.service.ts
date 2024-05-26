import { CohortEventProcessingRequest } from '../model/Cohort';
import { getMSAuthData } from './auth/microsoft.oauth.service';
import { getSFDCConnection } from './auth/sfdc.auth.service';
import { fetchCohort, updateCohort } from './cohort.service';
import { addDistribution, addTeam, updateDistribution, updateTeam } from './msAdmin.service';

export const processCohortEvent = async ({ eventType, cohortId }: CohortEventProcessingRequest) => {
  const conn = await getSFDCConnection();
  const { token } = await getMSAuthData();
  const cohort = await fetchCohort(conn, cohortId);
  // switch (eventType) {
  //   case 'created': {
  //     const { id: msTeamId, name: msTeamName } = await addTeam(token, cohort);
  //     await updateCohort(conn, cohortId, {
  //       MSTeamID__c: msTeamId,
  //       Slack_Channel_Name__c: msTeamName,
  //     });
  //     const { id: msDistroId, name: msDistroName } = await addDistribution(token, cohort);
  //     await updateCohort(conn, cohortId, {
  //       MSDistributionID__c: msDistroId,
  //       Email_Distribution_Name__c: `${msDistroName}@smoothstack.com`,
  //     });
  //     break;
  //   }
  //   case 'updated': {
  //     const {
  //       Id: cohortId,
  //       MSTeamID__c: existingMsTeamId,
  //       MSDistributionID__c: existingMsDistroId,
  //       Slack_Channel_Name__c: existingMsTeamName,
  //       Email_Distribution_Name__c: existingMsDistroName,
  //     } = cohort;
  //     const { id: msTeamId, name: msTeamName } = await updateTeam(token, existingMsTeamId, cohort, existingMsTeamName);
  //     await updateCohort(conn, cohortId, {
  //       MSTeamID__c: msTeamId,
  //       Slack_Channel_Name__c: msTeamName,
  //     });
  //     const { id: msDistroId, name: msDistroName } = await updateDistribution(
  //       token,
  //       existingMsDistroId,
  //       cohort,
  //       existingMsDistroName
  //     );
  //     await updateCohort(conn, cohortId, {
  //       MSDistributionID__c: msDistroId,
  //       Email_Distribution_Name__c: `${msDistroName}@smoothstack.com`,
  //     });
  //     break;
  //   }
  // }

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
  console.log('Successfully processed cohort event processing request.');
};
