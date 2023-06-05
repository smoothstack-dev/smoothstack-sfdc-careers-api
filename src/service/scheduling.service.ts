import axios from 'axios';
import { Appointment } from '../model/Appointment';
import { SchedulingEvent } from '../model/SchedulingEvent';
import { getSquareSpaceSecrets } from './secrets.service';
import { SchedulingType, SchedulingTypeId } from '../model/SchedulingType';
import { cancelWebinarRegistration, generateWebinarRegistration } from './webinar.service';
import { publishAppointmentGenerationRequest } from './sns.service';
import { cancelCalendarInvite } from './calendar.service';
import { AppointmentType } from 'src/model/AppointmentGenerationRequest';
import {
  fetchApplication,
  fetchApplicationHistory,
  findApplicationByAppointmentId,
  saveSchedulingDataByApplicationId,
  saveSchedulingDataByAppointmentId,
} from './application.service';
import { updateCandidate } from './candidate.service';
import { getSFDCConnection } from './auth/sfdc.auth.service';
import { Connection } from 'jsforce';
import { SmoothstackSchema } from '../model/smoothstack.schema';

const baseUrl = 'https://acuityscheduling.com/api/v1';

export const processSchedulingEvent = async (event: SchedulingEvent) => {
  console.log('Received Scheduling Event: ', event);

  switch (event.appointmentTypeID) {
    case SchedulingTypeId.CHALLENGE:
      await processChallengeScheduling(event);
      break;
    case SchedulingTypeId.WEBINAR:
      await processWebinarScheduling(event);
      break;
    case SchedulingTypeId.TECHSCREEN:
      await processTechScreenScheduling(event);
      break;
    case SchedulingTypeId.PRESCREEN:
      await processPrescreenScheduling(event);
      break;
  }
};

const processChallengeScheduling = async (event: SchedulingEvent) => {
  const { apiKey, userId } = await getSquareSpaceSecrets();
  const appointment = await fetchAppointment(apiKey, userId, event.id);
  const source = appointment.forms.find((f) => f.id === 2075339).values.find((v) => v.fieldID === 13195611).value;
  if (source !== 'sfdc') {
    return;
  }
  const conn = await getSFDCConnection();
  const eventType = event.action.split('.')[1];
  const schedulingType = SchedulingType.CHALLENGE;
  switch (eventType) {
    case 'scheduled': {
      const existingAppointment = await findExistingAppointment(apiKey, userId, appointment);
      const status = existingAppointment ? 'rescheduled' : 'scheduled';
      const applicationId = appointment.forms
        .find((f) => f.id === 2075339)
        .values.find((v) => v.fieldID === 11569425).value;
      if (await hasFailedPreviousChallenge(conn, { byType: 'application', id: applicationId })) {
        return;
      }
      const application = await saveSchedulingDataByApplicationId(
        conn,
        applicationId,
        status,
        appointment,
        schedulingType,
        'Challenge Scheduled'
      );
      await updateCandidate(conn, application.Candidate__r.Id, { Candidate_Status__c: 'Active' });
      if (existingAppointment) {
        await cancelAppointment(apiKey, userId, existingAppointment.id);
        await cancelCalendarInvite(application.Event_ID_Microsoft__c);
      }
      await publishAppointmentGenerationRequest(
        {
          application,
          appointment,
        },
        AppointmentType.CHALLENGE
      );

      break;
    }
    case 'rescheduled': {
      if (await hasFailedPreviousChallenge(conn, { byType: 'appointment', id: appointment.id })) {
        return;
      }
      const application = await saveSchedulingDataByAppointmentId(
        conn,
        eventType,
        appointment.id,
        appointment.datetime,
        schedulingType,
        'Challenge Scheduled'
      );
      if (application) {
        await updateCandidate(conn, application.Candidate__r.Id, { Candidate_Status__c: 'Active' });
        await cancelCalendarInvite(application.Event_ID_Microsoft__c);
        await publishAppointmentGenerationRequest(
          {
            application,
            appointment,
          },
          AppointmentType.CHALLENGE
        );
      }
      break;
    }
    case 'canceled': {
      const application = await saveSchedulingDataByAppointmentId(
        conn,
        eventType,
        appointment.id,
        '',
        schedulingType,
        'R-Challenge Canceled'
      );
      if (application) {
        await updateCandidate(conn, application.Candidate__r.Id, { Candidate_Status__c: 'Rejected' });
        await cancelCalendarInvite(application.Event_ID_Microsoft__c);
      }
      break;
    }
  }
};

const processWebinarScheduling = async (event: SchedulingEvent) => {
  const { apiKey, userId } = await getSquareSpaceSecrets();
  const appointment = await fetchAppointment(apiKey, userId, event.id);
  const source = appointment.forms.find((f) => f.id === 2075339).values.find((v) => v.fieldID === 13195611).value;
  if (source !== 'sfdc') {
    return;
  }
  const conn = await getSFDCConnection();
  const eventType = event.action.split('.')[1];
  const schedulingType = SchedulingType.WEBINAR;
  switch (eventType) {
    case 'scheduled': {
      const existingAppointment = await findExistingAppointment(apiKey, userId, appointment);
      const status = existingAppointment ? 'rescheduled' : 'scheduled';
      const applicationId = appointment.forms
        .find((f) => f.id === 2075339)
        .values.find((v) => v.fieldID === 11569425).value;
      if (existingAppointment) {
        await cancelAppointment(apiKey, userId, existingAppointment.id);
        const application = await fetchApplication(conn, applicationId);
        if (application) {
          await cancelWebinarRegistration({
            registrantId: application.Webinar_Registrant_ID__c,
            webinarId: application.Webinar_ID__c,
            occurrenceId: application.Webinar_Occurrence_ID__c,
          });
        }
      }
      const registration = await generateWebinarRegistration(appointment);
      const application = await saveSchedulingDataByApplicationId(
        conn,
        applicationId,
        status,
        appointment,
        schedulingType,
        'Webinar Scheduled',
        registration
      );
      await updateCandidate(conn, application.Candidate__r.Id, { Candidate_Status__c: 'Active' });
      break;
    }
    case 'rescheduled': {
      const application = await findApplicationByAppointmentId(conn, appointment.id, schedulingType);
      if (application) {
        await cancelWebinarRegistration({
          registrantId: application.Webinar_Registrant_ID__c,
          webinarId: application.Webinar_ID__c,
          occurrenceId: application.Webinar_Occurrence_ID__c,
        });
        const registration = await generateWebinarRegistration(appointment);
        const appReq = saveSchedulingDataByAppointmentId(
          conn,
          eventType,
          appointment.id,
          appointment.datetime,
          schedulingType,
          'Webinar Scheduled',
          registration
        );
        const canReq = updateCandidate(conn, application.Candidate__r.Id, { Candidate_Status__c: 'Active' });
        await Promise.all([appReq, canReq]);
      }
      break;
    }
    case 'canceled': {
      const application = await saveSchedulingDataByAppointmentId(
        conn,
        eventType,
        appointment.id,
        '',
        schedulingType,
        'R-Webinar Canceled',
        { joinUrl: '', registrantId: '', webinarId: '', occurrenceId: '' }
      );
      if (application) {
        await updateCandidate(conn, application.Candidate__r.Id, { Candidate_Status__c: 'Rejected' });
        await cancelWebinarRegistration({
          registrantId: application.Webinar_Registrant_ID__c,
          webinarId: application.Webinar_ID__c,
          occurrenceId: application.Webinar_Occurrence_ID__c,
        });
      }
      break;
    }
  }
};

const processTechScreenScheduling = async (event: SchedulingEvent) => {
  const { apiKey, userId } = await getSquareSpaceSecrets();
  const appointment = await fetchAppointment(apiKey, userId, event.id);
  const source = appointment.forms.find((f) => f.id === 2075339).values.find((v) => v.fieldID === 13195611).value;
  if (source !== 'sfdc') {
    return;
  }
  const conn = await getSFDCConnection();
  const eventType = event.action.split('.')[1];
  const schedulingType = SchedulingType.TECHSCREEN;
  switch (eventType) {
    case 'scheduled': {
      const existingAppointment = await findExistingAppointment(apiKey, userId, appointment);
      const status = existingAppointment ? 'rescheduled' : 'scheduled';
      const applicationId = appointment.forms
        .find((f) => f.id === 2075339)
        .values.find((v) => v.fieldID === 11569425).value;
      const screenerEmail = await findCalendarEmail(apiKey, userId, appointment.calendarID);
      const application = await saveSchedulingDataByApplicationId(
        conn,
        applicationId,
        status,
        appointment,
        schedulingType,
        'Tech Screen Scheduled'
      );
      await updateCandidate(conn, application.Candidate__r.Id, { Candidate_Status__c: 'Active' });
      if (existingAppointment) {
        const cancelAppReq = cancelAppointment(apiKey, userId, existingAppointment.id);
        const cancelCalReq = cancelCalendarInvite(application.Event_ID_Microsoft__c);
        await Promise.all([cancelAppReq, cancelCalReq]);
      }
      await publishAppointmentGenerationRequest(
        {
          application,
          screenerEmail,
          appointment,
        },
        AppointmentType.TECHSCREEN
      );
      break;
    }
    case 'rescheduled': {
      const screenerEmail = await findCalendarEmail(apiKey, userId, appointment.calendarID);
      const application = await saveSchedulingDataByAppointmentId(
        conn,
        eventType,
        appointment.id,
        appointment.datetime,
        schedulingType,
        'Tech Screen Scheduled'
      );
      if (application) {
        await updateCandidate(conn, application.Candidate__r.Id, { Candidate_Status__c: 'Active' });
        const cancelReq = cancelCalendarInvite(application.Event_ID_Microsoft__c);
        const publishReq = publishAppointmentGenerationRequest(
          {
            application,
            screenerEmail,
            appointment,
          },
          AppointmentType.TECHSCREEN
        );
        await Promise.all([cancelReq, publishReq]);
      }
      break;
    }
    case 'canceled': {
      const application = await saveSchedulingDataByAppointmentId(
        conn,
        eventType,
        appointment.id,
        '',
        schedulingType,
        'R-Tech Screen Canceled'
      );
      if (application) {
        await updateCandidate(conn, application.Candidate__r.Id, { Candidate_Status__c: 'Rejected' });
        await cancelCalendarInvite(application.Event_ID_Microsoft__c);
      }
      break;
    }
  }
};

const processPrescreenScheduling = async (event: SchedulingEvent) => {
  const { apiKey, userId } = await getSquareSpaceSecrets();
  const appointment = await fetchAppointment(apiKey, userId, event.id);
  const conn = await getSFDCConnection();
  const eventType = event.action.split('.')[1];
  const schedulingType = SchedulingType.PRESCREEN;
  switch (eventType) {
    case 'scheduled': {
      const existingAppointment = await findExistingAppointment(apiKey, userId, appointment);
      const status = existingAppointment ? 'rescheduled' : 'scheduled';
      const applicationId = appointment.forms
        .find((f) => f.id === 2075339)
        .values.find((v) => v.fieldID === 11569425).value;
      const application = await saveSchedulingDataByApplicationId(
        conn,
        applicationId,
        status,
        appointment,
        schedulingType,
        'Prescreen Scheduled'
      );
      await updateCandidate(conn, application.Candidate__r.Id, { Candidate_Status__c: 'Active' });
      if (existingAppointment) {
        await cancelAppointment(apiKey, userId, existingAppointment.id);
      }
      break;
    }
    case 'rescheduled': {
      const application = await saveSchedulingDataByAppointmentId(
        conn,
        eventType,
        appointment.id,
        appointment.datetime,
        schedulingType,
        'Prescreen Scheduled'
      );
      if (application) {
        await updateCandidate(conn, application.Candidate__r.Id, { Candidate_Status__c: 'Active' });
      }
      break;
    }
    case 'canceled': {
      const application = await saveSchedulingDataByAppointmentId(
        conn,
        eventType,
        appointment.id,
        '',
        schedulingType,
        'R-Prescreen Canceled'
      );
      if (application) {
        await updateCandidate(conn, application.Candidate__r.Id, { Candidate_Status__c: 'Rejected' });
      }
      break;
    }
  }
};

const fetchAppointment = async (apiKey: string, userId: string, appointmentId: string): Promise<Appointment> => {
  const url = `${baseUrl}/appointments/${appointmentId}`;

  const { data } = await axios.get(url, {
    auth: {
      username: userId,
      password: apiKey,
    },
  });

  return data;
};

const findExistingAppointment = async (
  apiKey: string,
  userId: string,
  newAppointment: Appointment
): Promise<Appointment> => {
  const { email, appointmentTypeID, id: newAppointmentId } = newAppointment;
  const url = `${baseUrl}/appointments`;

  const { data } = await axios.get(url, {
    params: {
      email,
      appointmentTypeID,
    },
    auth: {
      username: userId,
      password: apiKey,
    },
  });

  return data.filter((a: Appointment) => a.id !== newAppointmentId)[0];
};

const cancelAppointment = async (apiKey: string, userId: string, appointmentId: number): Promise<void> => {
  const url = `${baseUrl}/appointments/${appointmentId}/cancel`;

  return axios.put(
    url,
    {},
    {
      params: {
        noEmail: true,
        admin: true,
      },
      auth: {
        username: userId,
        password: apiKey,
      },
    }
  );
};

const findCalendarEmail = async (apiKey: string, userId: string, calendarId: number): Promise<string> => {
  const url = `${baseUrl}/calendars`;

  const { data } = await axios.get(url, {
    auth: {
      username: userId,
      password: apiKey,
    },
  });

  return data.find((c: any) => c.id === calendarId).email;
};

type LookupIdentifier =
  | {
      byType: 'appointment';
      id: number;
    }
  | { byType: 'application'; id: string };

const hasFailedPreviousChallenge = async (conn: Connection<SmoothstackSchema>, { byType, id }: LookupIdentifier) => {
  const applicationHistory =
    byType === 'application'
      ? await fetchApplicationHistory(conn, { id }, 'Rejection_Reason__c')
      : await fetchApplicationHistory(
          conn,
          { byField: 'Challenge_Appointment_ID__c', byValue: id },
          'Rejection_Reason__c'
        );

  return applicationHistory.some((h) => h.OldValue === 'Challenge Failed' || h.NewValue === 'Challenge Failed');
};
