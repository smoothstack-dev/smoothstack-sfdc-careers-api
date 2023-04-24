import { SNSEvent } from 'aws-lambda';
import {
  AppointmentGenerationRequest,
  AppointmentType,
  ChallengeAppointmentData,
  TechScreenAppointmentData,
} from '../model/AppointmentGenerationRequest';
import { sendTechScreenCalendarInvite } from './calendar.service';
import { sendChallengeCalendarInvite } from './calendar.service';
import { generateChallengeLinks } from './links.service';
import { getSFDCConnection } from './sfdc.service';
import { updateApplication } from './application.service';

export const generateAppointment = async (event: SNSEvent) => {
  console.log('Received Appointment Generation Request.');
  const request: AppointmentGenerationRequest = JSON.parse(event.Records[0].Sns.Message);
  switch (request.type) {
    case AppointmentType.CHALLENGE:
      await generateChallengeAppointment(request.appointmentData as ChallengeAppointmentData);
      break;
    case AppointmentType.TECHSCREEN:
      await generateTechScreenAppointment(request.appointmentData as TechScreenAppointmentData);
      break;
  }
  console.log(`Successfully generated ${request.type} appointment.`);
};

const generateChallengeAppointment = async (appointmentData: ChallengeAppointmentData) => {
  const conn = await getSFDCConnection();
  const candidate = appointmentData.application.Candidate__r;
  const challengeLink = await generateChallengeLinks(conn, appointmentData.application.Id);
  if (challengeLink) {
    const eventId = await sendChallengeCalendarInvite(candidate, challengeLink, appointmentData.appointment);
    await updateApplication(
      conn,
      { id: appointmentData.application.Id },
      {
        Event_ID_Microsoft__c: eventId,
      }
    );
  }
};

const generateTechScreenAppointment = async (appointmentData: TechScreenAppointmentData) => {
  const conn = await getSFDCConnection();
  const { application, screenerEmail, appointment } = appointmentData;
  // const candidateResume = (await fetchCandidateFiles(restUrl, BhRestToken, submission.candidate.id, ['Resume']))[0];
  const eventId = await sendTechScreenCalendarInvite(application, screenerEmail, appointment);
  await updateApplication(
    conn,
    { id: application.Id },
    {
      Event_ID_Microsoft__c: eventId,
    }
  );
};
