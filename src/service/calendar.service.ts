import axios from 'axios';
import { Appointment } from '../model/Appointment';
import { Application } from '../model/Application';
import { getMSAuthData } from './auth/microsoft.oauth.service';
import { Candidate } from '../model/Candidate';
import { getTechScreeningLink } from '../util/links';

const BASE_URL = 'https://graph.microsoft.com/v1.0/users/info@smoothstack.com/calendar';

const getBaseURLbySender = (senderEmail: string) => {
  return `https://graph.microsoft.com/v1.0/users/${senderEmail}/calendar`;
};

export const sendChallengeCalendarInvite = async (
  application: Application,
  challengeLink: string,
  appointment: Appointment
): Promise<string> => {
  const { token } = await getMSAuthData();
  const candidate = application.Candidate__r;
  const event = {
    subject: `Smoothstack Coding Challenge - ${candidate.FirstName} ${candidate.LastName}`,
    body: {
      contentType: 'HTML',
      content: generateChallengeDescription(
        candidate.FirstName,
        challengeLink,
        appointment.confirmationPage,
        application.Job__r.Cohort_Category__c
      ),
    },
    start: {
      dateTime: appointment.datetime,
      timeZone: 'Eastern Standard Time',
    },
    end: {
      dateTime: new Date(+new Date(appointment.datetime) + appointment.duration * 60000).toISOString(),
      timeZone: 'Eastern Standard Time',
    },
    location: {
      displayName: challengeLink,
    },
    attendees: [
      {
        emailAddress: {
          address: candidate.Email,
          name: `${candidate.FirstName} ${candidate.LastName}`,
        },
        type: 'required',
      },
    ],
  };

  const { data } = await axios.post(`${BASE_URL}/events`, event, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data.id;
};

export const sendTechScreenCalendarInvite = async (
  application: Application,
  screenerEmail: string,
  appointment: Appointment
): Promise<string> => {
  const { token } = await getMSAuthData();
  const eventId = await createTechScreenEvent(token, application, appointment);
  // resumeFile && (await attachResumeToEvent(token, eventId, application.Candidate__r, resumeFile));
  await addAttendeesToEvent(token, eventId, application.Candidate__r, screenerEmail);
  return eventId;
};

const createTechScreenEvent = async (
  authToken: string,
  application: Application,
  appointment: Appointment
): Promise<string> => {
  const { Candidate__r } = application;
  const { Job_Title__c } = application.Job__r;
  const jobTitleString = Job_Title__c ? `<strong>Position Applied for: ${Job_Title__c}</strong><br/>` : '';

  const event = {
    subject: `Smoothstack Tech Screening/Video Chat - ${Candidate__r.FirstName} ${Candidate__r.LastName}`,
    body: {
      contentType: 'HTML',
      //Tech Screen Form Link: <a href="${getTechScreeningLink(application, Job_Title__c)}">${Candidate__r.FirstName}'s Tech Screening Form</a> (For Tech Screener Use Only)
      content: `${jobTitleString}Tech Screen Form Link: <a href="${getTechScreeningLink(application)}">${
        Candidate__r.FirstName
      }'s Tech Screening Form</a> (For Tech Screener Use Only)<br/><br/><strong>Note to Candidate:</strong> This is a <strong>videochat</strong> meeting. You must be ready to share your webcam during the call.`,
    },
    start: {
      dateTime: appointment.datetime,
      timeZone: 'Eastern Standard Time',
    },
    end: {
      dateTime: new Date(+new Date(appointment.datetime) + appointment.duration * 60000).toISOString(),
      timeZone: 'Eastern Standard Time',
    },
    isOnlineMeeting: true,
    onlineMeetingProvider: 'teamsForBusiness',
  };
  const { data } = await axios.post(`${BASE_URL}/events`, event, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
  return data.id;
};

const addAttendeesToEvent = async (authToken: string, eventId: string, candidate: Candidate, screenerEmail: string) => {
  const update = {
    attendees: [
      {
        emailAddress: {
          address: candidate.Email,
          name: `${candidate.FirstName} ${candidate.LastName}`,
        },
        type: 'required',
      },
      {
        emailAddress: {
          address: screenerEmail,
        },
        type: 'required',
      },
      {
        emailAddress: {
          address: candidate.Owner.Email,
        },
        type: 'optional',
      },
    ],
  };
  await axios.patch(`${BASE_URL}/events/${eventId}`, update, {
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });
};

// const attachResumeToEvent = async (
//   authToken: string,
//   eventId: string,
//   candidate: Candidate,
//   resumeFile: FileUpload
// ) => {
//   const fileExt = resumeFile.name.substring(resumeFile.name.lastIndexOf('.') + 1);
//   const attachment = {
//     '@odata.type': '#microsoft.graph.fileAttachment',
//     name: `RESUME_${candidate.FirstName.toUpperCase()}_${candidate.LastName.toUpperCase()}.${fileExt}`,
//     contentBytes: resumeFile.fileContent,
//   };
//   await axios.post(`${BASE_URL}/events/${eventId}/attachments`, attachment, {
//     headers: {
//       Authorization: `Bearer ${authToken}`,
//     },
//   });
// };

export const cancelCalendarInvite = async (eventId: string, senderEmail?: string) => {
  const { token } = await getMSAuthData();
  const baseUrl = senderEmail ? getBaseURLbySender(senderEmail) : BASE_URL;
  const url = `${baseUrl}/events/${eventId}/cancel`;
  eventId &&
    (await axios.post(
      url,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    ));
};

const generateChallengeDescription = (
  firstName: string,
  challengeLink: string,
  confirmationLink: string,
  cohortType: string
) => {
  const challengeType = cohortType === 'Technician' ? 'Skills' : 'Coding';
  const tipsBlock = `<br/><br/><p><u><strong><span style="font-size:16px;">8 Tips for successfully completing the Coding Challenge:</span></strong></u></p><p><span class="c-mrkdwn__br"></span>1. Read deliverables carefully! This will help ensure that your solution(s) reflect all requirements of the challenge.</p><p><span class="c-mrkdwn__br"></span>2. Set aside 2-3 hours of uninterrupted time to take the coding challenge.</p><p><span class="c-mrkdwn__br"></span>3. Choose a quiet space, without distractions.</p><p><span class="c-mrkdwn__br"></span>4. Double check your work, before submitting!</p><p><span class="c-mrkdwn__br"></span>5. Don't study! This is not a traditional test that can be studied for...the purpose of this test is to assess your basic scripting/coding knowledge.</p><p><span class="c-mrkdwn__br"></span>6. Write comments in your code to show your thought process (if you have extra time). This will allow us to review your code with a subjective lens in the event that you do not successfully pass the challenge.</p><p><span class="c-mrkdwn__br"></span>7. Don't cheat! Above all, Smoothstack values integrity. As such, we have controls in place to identify plagiarism and dishonesty.</p><p><span class="c-mrkdwn__br"></span>8. Read through the FAQ's in the link below. <span class="c-mrkdwn__br"></span><a target="_blank" href="https://support.hackerrank.com/hc/en-us/sections/115001822568-Frequently-Asked-Questions-FAQs-" style="background-color:rgb(248,248,248);text-decoration:none;font-family:'Slack-Lato', appleLogo, sans-serif;font-size:15px;" rel="background-color:rgb(248,248,248);text-decoration:none;font-family:'Slack-Lato', appleLogo, sans-serif;font-size:15px;">FAQ/DEMO</a></p><p><a target="_blank" href="https://support.hackerrank.com/hc/en-us/sections/115001822568-Frequently-Asked-Questions-FAQs-" style="background-color:rgb(248,248,248);text-decoration:none;font-family:'Slack-Lato', appleLogo, sans-serif;font-size:15px;" rel="noreferrer noopener"></a>Happy Coding!</p>`;
  return `Hi ${firstName}, your Smoothstack ${challengeType} Challenge appointment has been successfully scheduled.<br/><br/><a href="${challengeLink}">${challengeType} Challenge Link</a><br/><br/><a href="${confirmationLink}">Click here</a> to reschedule/cancel your appointment.${
    challengeType === 'Skills' ? '' : tipsBlock
  }`;
};
