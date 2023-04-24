import { SNSEvent } from 'aws-lambda';
import axios from 'axios';
import { Appointment } from '../model/Appointment';
import { generateZoomToken } from './auth/zoom.jwt.service';
import { WebinarEvent, WebinarRegistration } from '../model/Webinar';
import { getSFDCConnection } from './sfdc.service';
import { updateApplication } from './application.service';

export const WEBINAR_TOPIC = 'Candidate Information Session / Learn about Smoothstack';

export const WEBINAR_TYPE = 9;
const BASE_URL = 'https://api.zoom.us/v2';

export const generateWebinarRegistration = async (appointment: Appointment): Promise<WebinarRegistration> => {
  const token = await generateZoomToken();
  const webinarId = await findWebinarId(token, appointment.datetime);
  const occurrenceId = await findWebinarOccurrenceId(token, webinarId, appointment.datetime);
  return registerCandidate(token, webinarId, occurrenceId, appointment);
};

export const cancelWebinarRegistration = async (registration: WebinarRegistration): Promise<void> => {
  const token = await generateZoomToken();
  const { registrantId, webinarId, occurrenceId } = registration;
  const url = `${BASE_URL}/webinars/${webinarId}/registrants/${registrantId}?occurrence_id=${occurrenceId}`;

  return axios.delete(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};

export const getWebinarRegistrationURL = async () => {
  const token = await generateZoomToken();
  const webinarId = await findWebinarId(token, new Date().toISOString());

  const url = `${BASE_URL}/webinars/${webinarId}`;
  const { data } = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.registration_url;
};

const findWebinarId = async (token: string, date: string): Promise<string> => {
  const url = `${BASE_URL}/users/OxHMtzLCQ7yQtd3RjNJfXw/webinars`;

  const { data } = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      page_size: 300,
    },
  });

  const appointmentDate = new Date(date).toISOString();
  const webinar = data.webinars
    .sort((a, b) => {
      return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
    })
    .find((w: any) => {
      const lastOccurrenceDate = new Date(w.start_time).toISOString();
      return w.type === WEBINAR_TYPE && w.topic === WEBINAR_TOPIC && appointmentDate <= lastOccurrenceDate;
    });

  return webinar.id;
};

const findWebinarOccurrenceId = async (token: string, webinarId: string, date: string): Promise<string> => {
  const url = `${BASE_URL}/webinars/${webinarId}`;

  const { data } = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      show_previous_occurrences: true,
    },
  });

  const appointmentDate = new Date(date).toISOString();
  return data.occurrences.find((o) => new Date(o.start_time).toISOString() === appointmentDate).occurrence_id;
};

const registerCandidate = async (
  token: string,
  webinarId: string,
  occurrenceId: string,
  appointment: Appointment
): Promise<WebinarRegistration> => {
  const registrantPath = `${webinarId}/registrants`;
  const url = `${BASE_URL}/webinars/${registrantPath}`;

  const registrationData = {
    email: appointment.email,
    first_name: appointment.firstName,
    last_name: appointment.lastName,
    phone: appointment.phone,
  };

  const { data } = await axios.post(url, registrationData, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      occurrence_ids: occurrenceId,
    },
  });

  return {
    registrantId: data.registrant_id,
    webinarId,
    occurrenceId,
    joinUrl: data.join_url,
  };
};

export const processWebinarEvent = async (event: SNSEvent): Promise<void> => {
  const message = event.Records[0].Sns.Message;
  console.log('Received Webinar Event Request: ', message);
  const request: WebinarEvent = JSON.parse(message);
  const conn = await getSFDCConnection();
  const token = await generateZoomToken();

  const attendees = await getWebinarParticipants(token, request.webinar.uuid);
  const poll = await getPollAnswers(token, request.webinar.uuid);
  for (const attendee of attendees) {
    const pollAnswer = getParticipantPollAnswer(attendee, poll);
    await updateApplication(
      conn,
      { byField: 'Webinar_Registrant_ID__c', byValue: attendee.registrant_id },
      {
        Webinar_Attended__c: 'Yes',
        Webinar_Poll_Response__c: pollAnswer,
        ...(pollAnswer === 'No'
          ? { StageName: 'Rejected', Rejection_Reason__c: 'Webinar Poll Question' }
          : { StageName: 'Webinar Passed' }),
      }
    );
  }

  const absentees = await getWebinarAbsentees(token, request.webinar.uuid);
  for (const absentee of absentees) {
    await updateApplication(
      conn,
      { byField: 'Webinar_Registrant_ID__c', byValue: absentee.id },
      { Webinar_Attended__c: 'No', StageName: 'Rejected', Rejection_Reason__c: 'Webinar no show' }
    );
  }
  console.log('Successfully processed webinar event');
};

const getParticipantPollAnswer = (participant: any, questionList: any[]): string => {
  const question = questionList.find((q) => q.email.toLowerCase() === participant.user_email.toLowerCase());
  const answer = question?.question_details.reduce((acc: boolean, qd: any) => qd.answer === 'Yes' && acc, true);
  return answer ? 'Yes' : 'No';
};

const getWebinarParticipants = async (token: string, webinarUUID: string): Promise<any> => {
  const url = `${BASE_URL}/past_webinars/${encodeURIComponent(encodeURIComponent(webinarUUID))}/participants`;
  const { data } = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      page_size: 300,
    },
  });

  return data.participants.filter((p) => !!p.user_email);
};

const getWebinarAbsentees = async (token: string, webinarUUID: string): Promise<any> => {
  const url = `${BASE_URL}/past_webinars/${encodeURIComponent(encodeURIComponent(webinarUUID))}/absentees`;
  const { data } = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    params: {
      page_size: 300,
    },
  });

  return data.registrants;
};

const getPollAnswers = async (token: string, webinarUUID: string): Promise<any[]> => {
  const url = `${BASE_URL}/past_webinars/${encodeURIComponent(encodeURIComponent(webinarUUID))}/polls`;
  const { data } = await axios.get(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.questions;
};
