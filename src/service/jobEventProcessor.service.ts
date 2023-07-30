import { getMSAuthData } from './auth/microsoft.oauth.service';
import { getSFDCConnection } from './auth/sfdc.auth.service';
import { saveCohort, updateCohort } from './cohort.service';
import { fetchJob } from './jobs.service';
import { addDistribution, addTeam, updateDistribution, updateTeam } from './msAdmin.service';

export const processJobEvent = async (jobId: number) => {
  const { token } = await getMSAuthData();
  const conn = await getSFDCConnection();
  const job = await fetchJob(conn, jobId);
  const {
    Id: cohortId,
    MSTeamID__c: existingMsTeamId,
    MSDistributionID__c: existingMsDistroId,
    Slack_Channel_Name__c: existingMsTeamName,
    Email_Distribution_Name__c: existingMsDistroName,
  } = await saveCohort(conn, job);

  const { id: msTeamId, name: msTeamName } = existingMsTeamId
    ? await updateTeam(token, existingMsTeamId, job, existingMsTeamName)
    : await addTeam(token, job);
  await updateCohort(conn, cohortId, {
    MSTeamID__c: msTeamId,
    Slack_Channel_Name__c: msTeamName,
  });
  const { id: msDistroId, name: msDistroName } = existingMsDistroId
    ? await updateDistribution(token, existingMsDistroId, job, existingMsDistroName)
    : await addDistribution(token, job);
  await updateCohort(conn, cohortId, {
    MSDistributionID__c: msDistroId,
    Email_Distribution_Name__c: `${msDistroName}@smoothstack.com`,
  });

  console.log('Successfully processed job event processing request.');
};
