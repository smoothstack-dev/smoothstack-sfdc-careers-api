import axios from 'axios';
import { fetchMSUser } from './msUser.service';
import { Fields$Cohort__c } from '../model/smoothstack.schema';
import { MSTeam } from '../model/MSTeam';

const BASE_URL = `https://graph.microsoft.com/v1.0`;

export const addTeam = async (authToken: string, cohort: Fields$Cohort__c): Promise<MSTeam> => {
  const teamName = deriveTeamName(cohort);
  const team = {
    'template@odata.bind': `${BASE_URL}/teamsTemplates('standard')`,
    displayName: teamName,
    description: teamName,
    visibility: 'Private',
    members: [
      {
        '@odata.type': '#microsoft.graph.aadUserConversationMember',
        roles: ['owner'],
        'user@odata.bind': `${BASE_URL}/users('support@smoothstack.com')`,
      },
    ],
  };
  const { headers } = await axios.post(`${BASE_URL}/teams`, team, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return { id: headers['content-location'].split("'")[1], name: teamName };
};

// Clones and Deletes old team due to MS Graph Limitation
export const updateTeam = async (
  authToken: string,
  teamId: string,
  cohort: Fields$Cohort__c,
  existingTeamName: string
): Promise<MSTeam> => {
  const teamName = deriveTeamName(cohort);
  if (teamName.toLowerCase() !== existingTeamName.toLowerCase()) {
    const teamInfo = {
      displayName: teamName,
      description: teamName,
      mailNickname: teamName,
      partsToClone: 'apps,tabs,settings,channels,members',
    };
    const clonedTeamId = await cloneTeam(authToken, teamId, teamInfo);
    await deleteTeam(authToken, teamId);
    return { id: clonedTeamId, name: teamName };
  }
  return { id: teamId, name: existingTeamName };
};

const cloneTeam = async (authToken: string, teamId: string, teamInfo: any) => {
  const { headers } = await axios.post(`${BASE_URL}/teams/${teamId}/clone`, teamInfo, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return headers['content-location'].split("'")[1];
};

export const deleteTeam = async (authToken: string, teamId: string) => {
  await axios.delete(`${BASE_URL}/groups/${teamId}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
};

export const addDistribution = async (
  authToken: string,
  cohort: Fields$Cohort__c,
  members: string[] = []
): Promise<MSTeam> => {
  const distributionName = deriveTeamName(cohort, '_Trainees');
  const distribution = {
    'owners@odata.bind': [`${BASE_URL}/users('support@smoothstack.com')`],
    groupTypes: ['Unified'],
    displayName: distributionName,
    mailEnabled: true,
    mailNickname: distributionName,
    securityEnabled: false,
    ...(members.length && { 'members@odata.bind': members.map((memberId) => `${BASE_URL}/users/${memberId}`) }),
  };

  const { data } = await axios.post(`${BASE_URL}/groups`, distribution, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return { id: data.id, name: distributionName };
};

// Manually Clones and Deletes old distribution due to MS Graph Limitation
export const updateDistribution = async (
  authToken: string,
  distroId: string,
  cohort: Fields$Cohort__c,
  existingDistroName: string
): Promise<MSTeam> => {
  const distributionName = deriveTeamName(cohort, '_Trainees');
  if (`${distributionName.toLowerCase()}@smoothstack.com` !== existingDistroName.toLowerCase()) {
    const existingMembers = await listDistributionMembers(authToken, distroId);
    const newDistroInfo = await addDistribution(authToken, cohort, existingMembers);
    await deleteTeam(authToken, distroId);
    return newDistroInfo;
  }
  return { id: distroId, name: existingDistroName };
};

const listDistributionMembers = async (authToken: string, distroId: string): Promise<string[]> => {
  const { data } = await axios.get(`${BASE_URL}/groups/${distroId}/members`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return data.value.map((member: any) => member.id);
};

export const addTeamMember = async (authToken: string, teamId: string, userId: string): Promise<string> => {
  const { data } = await axios.post(
    `${BASE_URL}/teams/${teamId}/members`,
    {
      '@odata.type': '#microsoft.graph.aadUserConversationMember',
      'user@odata.bind': `${BASE_URL}/users('${userId}')`,
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );
  return data.id;
};

export const removeTeamMember = async (authToken: string, teamId: string, membershipId: string) => {
  await axios.delete(`${BASE_URL}/teams/${teamId}/members/${membershipId}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
};

export const addDistributionMember = async (authToken: string, distroId: string, userId: string): Promise<string> => {
  const { data } = await axios.patch(
    `${BASE_URL}/groups/${distroId}`,
    {
      'members@odata.bind': [`${BASE_URL}/users('${userId}')`],
    },
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    }
  );
  return data.id;
};

export const removeDistributionMember = async (authToken: string, distroId: string, userPrincipalName: string) => {
  const { id: userId } = await fetchMSUser(authToken, userPrincipalName);
  await axios.delete(`${BASE_URL}/groups/${distroId}/members/${userId}/$ref`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
};

const deriveTeamName = (cohort: Fields$Cohort__c, suffix: string = '') => {
  const date = new Date(cohort.Training_Start_Date__c);
  const year = date.getFullYear();
  const numberMonth = (date.getMonth() + 1).toLocaleString('en-US', {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });
  const dayOfMonth = date.getUTCDate();
  const technology = cohort.Cohort_Category__c.replace(/ /g, '');
  return `${year}_${numberMonth}_${dayOfMonth}_${technology}${suffix}`;
};
