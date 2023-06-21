import { Candidate } from '../model/Candidate';
import { MSUser, MSUserEvent } from '../model/MSUser';
import axios from 'axios';
import { SmoothstackSchema } from '../model/smoothstack.schema';
import { Connection } from 'jsforce';
import { fetchConsultant, findConsultantBySmoothstackEmail, findNameAlikeConsultants } from './consultant.service';
import { generate as generatePassword } from 'generate-password';
import { listDeletedUsers, restoreDeletedUser } from './msDirectory.service';
import { getMSAuthData } from './auth/microsoft.oauth.service';
import { getSFDCConnection } from './auth/sfdc.auth.service';
import { sendNewAccountDetails } from './email.service';
import { deleteUserSubscription } from './msSubscriptions.service';
import { updateCandidate } from './candidate.service';

const BASE_URL = 'https://graph.microsoft.com/v1.0/users';

export const addMSUser = async (
  authToken: string,
  conn: Connection<SmoothstackSchema>,
  candidate: Candidate
): Promise<MSUser> => {
  const { FirstName, LastName, Potential_Smoothstack_Email__c } = candidate;
  const primaryEmail = await getOrDeriveEmailAddress(
    authToken,
    conn,
    candidate.Id,
    Potential_Smoothstack_Email__c?.trim()
  );
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
    const { data } = await axios.post(BASE_URL, user, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    return { id: data.id, userPrincipalName: primaryEmail, tempPassword, assignedLicenses: [] };
  }
  return { id: undefined, userPrincipalName: primaryEmail, assignedLicenses: activeUser.assignedLicenses };
};

const getOrDeriveEmailAddress = async (
  token: string,
  conn: Connection<SmoothstackSchema>,
  candidateId: string,
  potentialEmail: string
) => {
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
      const digit = +u.userPrincipalName.match(/\d+/)?.[0];
      return digit > acc ? digit : acc;
    }, 0);
    return `${prefix}${highestDigit + 1}@smoothstack.com`;
  }
  return `${prefix}@smoothstack.com`;
};

export const findMsUserByEmail = async (authToken: string, email: string): Promise<MSUser> => {
  const { data } = await axios.get(`${BASE_URL}`, {
    params: {
      $filter: `userPrincipalName eq '${email}'`,
      $select: 'id,userPrincipalName,assignedLicenses',
    },
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return data.value[0];
};

export const findNameAlikeMSUsers = async (token: string, prefix: string) => {
  const { data } = await axios.get(`${BASE_URL}`, {
    params: {
      $filter: `startsWith(userPrincipalName, '${prefix}')`,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data.value;
};

const findDuplicateUsers = async (token: string, conn: Connection<SmoothstackSchema>, prefix: string) => {
  const requests = [findNameAlikeMSUsers(token, prefix), findNameAlikeConsultants(conn, prefix)];
  const users = (await Promise.all(requests)).flat();
  const pattern = /^[a-z]+\.[a-z]+(\d*)@smoothstack\.com$/;
  return users.filter((u) => pattern.test((u.userPrincipalName || u.Smoothstack_Email__c).toLowerCase()));
};

export const processMSUserEvent = async (event: MSUserEvent) => {
  const { token } = await getMSAuthData();
  const conn = await getSFDCConnection();
  const userId = event.value[0].resourceData.id;
  const { userPrincipalName, assignedLicenses } = await fetchMSUser(token, userId);
  if (assignedLicenses.length) {
    const { Id, Email, Temp_MS_Password__c, MS_Subscription_ID__c } = await findConsultantBySmoothstackEmail(
      conn,
      userPrincipalName
    );
    if (MS_Subscription_ID__c) {
      await sendNewAccountDetails(token, Email, userPrincipalName, Temp_MS_Password__c);
      await deleteUserSubscription(token, MS_Subscription_ID__c);
      await updateCandidate(conn, Id, { MS_Subscription_ID__c: null });
    }
  }
};

export const fetchMSUser = async (authToken: string, userId: string): Promise<MSUser> => {
  const { data } = await axios.get(`${BASE_URL}/${userId}`, {
    params: {
      $select: 'id,userPrincipalName,assignedLicenses',
    },
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return data;
};
