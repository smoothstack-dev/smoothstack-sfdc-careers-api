import axios from 'axios';
import { getHackerRankSecrets } from './secrets.service';
import { Application } from '../model/Application';
import { ChallengeEvent, ChallengeSession } from '../model/Challenge';
import { getSFDCConnection } from './auth/sfdc.auth.service';
import { fetchApplication, findApplications, updateApplication } from './application.service';
import { Fields$Opportunity, SmoothstackSchema } from '../model/smoothstack.schema';
import { Connection } from 'jsforce';
import { CHALLENGE_APP_STATUS, deriveChallengeResult } from '../util/challenge.util';
import { deriveApplicationStatus } from '../util/application.util';
import { updateCandidate } from './candidate.service';
import { saveNote } from './notes.service';
import { publishDataGenerationRequest } from './sns.service';

const BASE_URL = `https://www.hackerrank.com/x/api/v3/tests`;

const getChallengeDetails = async (name: string, token: string) => {
  const { data } = await axios.get(BASE_URL, {
    params: {
      limit: 100,
      offset: 0,
    },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data.data.find((t: any) => t.name === name);
};

export const generateChallengeLink = async (application: Application): Promise<string> => {
  const { CALLBACK_URL_V2, BEARER_TOKEN } = await getHackerRankSecrets();
  const { Id: applicationId, Candidate__r, Job__r } = application;
  const { id: challengeId } = await getChallengeDetails(Job__r.Coding_Challenge_Name__c, BEARER_TOKEN);

  const url = `${BASE_URL}/${challengeId}/candidates`;
  const invitation = {
    full_name: `${Candidate__r.FirstName} ${Candidate__r.LastName}`,
    email: Candidate__r.Email,
    force_reattempt: true,
    force: true,
    test_result_url: `${CALLBACK_URL_V2}?applicationId=${applicationId}`,
  };
  const { data } = await axios.post(url, invitation, {
    headers: {
      Authorization: `Bearer ${BEARER_TOKEN}`,
    },
  });

  return data.test_link;
};

export const processChallengeEvent = async (
  { score, max_score, plagiarism_status }: ChallengeEvent,
  applicationId: string
) => {
  const conn = await getSFDCConnection();
  const prevApplications = await findApplications(conn, 'Previous_Challenge_ID__c', applicationId);
  const appicationIds = [...prevApplications.map((a) => a.Id), applicationId];
  const session: ChallengeSession = {
    evaluation: {
      result: score,
      max_result: max_score,
      plagiarism: plagiarism_status,
    },
  };
  const applicationEvents = appicationIds.map((appId) => saveApplicationChallengeResult(conn, appId, session));
  await Promise.all(applicationEvents);
};

const saveApplicationChallengeResult = async (
  conn: Connection<SmoothstackSchema>,
  applicationId: string,
  session: ChallengeSession
) => {
  const { evaluation } = session;
  const score = Math.round((evaluation.result / evaluation.max_result) * 100);
  const { Job__r, Candidate__r, Challenge_Link__c } = await fetchApplication(conn, applicationId);
  const candidateStatus = score >= Job__r.Passing_Challenge_Score__c ? 'Active' : 'Rejected';
  const result = deriveChallengeResult(score, Job__r.Passing_Challenge_Score__c);
  const { stageName, rejectionReason } = deriveApplicationStatus(CHALLENGE_APP_STATUS[result]);
  const updateData: Partial<Fields$Opportunity> = {
    Challenge_Score__c: score,
    Challenge_Result__c: result,
    StageName: stageName,
    ...(rejectionReason && { Rejection_Reason__c: rejectionReason }),
    ...(evaluation.plagiarism && { Challenge_Similarity_Flag__c: 'Potential Plagiarism' }),
  };
  const resultNoteTitle = `${CHALLENGE_APP_STATUS[result]} (${Job__r.Coding_Challenge_Name__c})`;
  const resultNote = `<p>${resultNoteTitle}</p><p>Challenge Score: ${score}</p><p>Challenge Link: ${Challenge_Link__c}</p>`;
  await saveNote(conn, Candidate__r.Id, { title: 'Challenge Result', content: resultNote });
  await updateCandidate(conn, Candidate__r.Id, { Candidate_Status__c: candidateStatus });
  await updateApplication(conn, { id: applicationId }, updateData);
  result === 'Pass' && (await publishDataGenerationRequest(applicationId, 'TECHSCREEN_LINKS'));
};
