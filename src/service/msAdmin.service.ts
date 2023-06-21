import axios from 'axios';
import { generate as generatePassword } from 'generate-password';
import { MSUser } from 'src/model/MSUser';
import { Candidate } from '../model/Candidate';
import { getSFDCConnection } from './auth/sfdc.auth.service';
import { listDeletedUsers, restoreDeletedUser } from './msDirectory.service';
import { fetchMSUser, findMsUserByEmail, findNameAlikeMSUsers } from './msUser.service';
import { fetchConsultant, findNameAlikeConsultants } from './consultant.service';
import { Fields$Job__c } from '../model/smoothstack.schema';
import { MSTeam } from '../model/MSTeam';

const BASE_URL = `https://graph.microsoft.com/v1.0`;

export const addUser = async (authToken: string, candidate: Candidate): Promise<MSUser> => {
  const { Id, FirstName, LastName, Potential_Smoothstack_Email__c } = candidate;
  const primaryEmail = await getOrDeriveEmailAddress(authToken, Id, Potential_Smoothstack_Email__c?.trim());
  const activeUser = await findMsUserByEmail(authToken, primaryEmail);
  if (!activeUser) {
    const tempPassword = generatePassword({
      length: 15,
      numbers: true,
      symbols: '!@$#$()&_',
    });
    const user = {
      accountEnabled: true,
      displayName: `${FirstName} ${LastName}`,
      userPrincipalName: primaryEmail,
      mailNickname: primaryEmail.split('@')[0],
      passwordProfile: {
        forceChangePasswordNextSignIn: true,
        password: tempPassword,
      },
      usageLocation: 'US',
    };
    const { data } = await axios.post(`${BASE_URL}/users`, user, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return { id: data.id, userPrincipalName: primaryEmail, tempPassword, assignedLicenses: [] };
  }
  return { id: undefined, userPrincipalName: primaryEmail, assignedLicenses: activeUser.assignedLicenses };
};

const getOrDeriveEmailAddress = async (token: string, candidateId: string, potentialEmail: string) => {
  const conn = await getSFDCConnection();
  const consultant = await fetchConsultant(conn, candidateId);
  if (consultant?.Smoothstack_Email__c) {
    const recentDeletedUsers = await listDeletedUsers(token);
    const deletedUserMatch = recentDeletedUsers.find((u) => u.mail === consultant.Smoothstack_Email__c);
    if (deletedUserMatch) {
      await restoreDeletedUser(token, deletedUserMatch.id);
    }
    return consultant.Smoothstack_Email__c;
  } else {
    const nameAdress = potentialEmail.split('@')[0];
    return derivePrimaryEmail(token, conn, nameAdress);
  }
};

const derivePrimaryEmail = async (token: string, sfdcConn: any, prefix: string) => {
  const existingUsers = await findDuplicateUsers(token, sfdcConn, prefix);
  if (existingUsers?.length) {
    const highestDigit = existingUsers.reduce((acc, u) => {
      const digit = +(u.userPrincipalName || u.Smoothstack_Email__c).match(/\d+/)?.[0];
      return digit > acc ? digit : acc;
    }, 0);
    return `${prefix}${highestDigit + 1}@smoothstack.com`;
  }
  return `${prefix}@smoothstack.com`;
};

const findDuplicateUsers = async (token: string, sfdcConnection: any, prefix: string) => {
  const requests = [findNameAlikeMSUsers(token, prefix), findNameAlikeConsultants(sfdcConnection, prefix)];
  const users = (await Promise.all(requests)).flat();
  const pattern = /^[a-z]+\.[a-z]+(\d*)@smoothstack\.com$/;
  return users.filter((u) => pattern.test((u.userPrincipalName || u.Smoothstack_Email__c).toLowerCase()));
};

export const addTeam = async (authToken: string, job: Fields$Job__c): Promise<MSTeam> => {
  const teamName = deriveTeamName(job);
  const team = {
    'template@odata.bind': `${BASE_URL}/teamsTemplates('standard')`,
    displayName: teamName,
    description: teamName,
    visibility: 'Private',
    members: [
      {
        '@odata.type': '#microsoft.graph.aadUserConversationMember',
        roles: ['owner'],
        'user@odata.bind': `${BASE_URL}/users('hr@smoothstack.com')`,
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
  job: Fields$Job__c,
  existingTeamName: string
): Promise<MSTeam> => {
  const teamName = deriveTeamName(job);
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

const deleteTeam = async (authToken: string, teamId: string) => {
  await axios.delete(`${BASE_URL}/groups/${teamId}`, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
};

export const addDistribution = async (
  authToken: string,
  job: Fields$Job__c,
  members: string[] = []
): Promise<MSTeam> => {
  const distributionName = deriveTeamName(job, '_Trainees');
  const distribution = {
    'owners@odata.bind': [`${BASE_URL}/users('hr@smoothstack.com')`],
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
  job: Fields$Job__c,
  existingDistroName: string
): Promise<MSTeam> => {
  const distributionName = deriveTeamName(job, '_Trainees');
  if (`${distributionName.toLowerCase()}@smoothstack.com` !== existingDistroName.toLowerCase()) {
    const existingMembers = await listDistributionMembers(authToken, distroId);
    const newDistroInfo = await addDistribution(authToken, job, existingMembers);
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

const deriveTeamName = (job: Fields$Job__c, suffix: string = '') => {
  const date = new Date(job.Quick_Course_Start_Date__c);
  const year = date.getFullYear();
  const numberMonth = (date.getMonth() + 1).toLocaleString('en-US', {
    minimumIntegerDigits: 2,
    useGrouping: false,
  });
  const dayOfMonth = date.getDate();
  const technology = job.Cohort_Category__c.replace(/ /g, '');
  return `${year}_${numberMonth}_${dayOfMonth}_${technology}${suffix}`;
};
