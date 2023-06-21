import { Connection, DateString } from 'jsforce';
import { v4 as uuidv4 } from 'uuid';
import { Candidate, CandidateFields } from '../model/Candidate';
import {
  Fields$Contact,
  Fields$Job__c,
  Fields$Opportunity,
  Fields$OpportunityFieldHistory,
  SmoothstackSchema,
} from '../model/smoothstack.schema';
import { calculateMonthsToGrad } from '../util/apply.util';
import { createCandidate } from './candidate.service';
import { saveSFDCFiles } from './files.service';
import { Appointment } from '../model/Appointment';
import { SchedulingType } from '../model/SchedulingType';
import { deriveApplicationStatus } from '../util/application.util';
import { WebinarRegistration } from '../model/Webinar';
import { Application, ApplicationFields } from '../model/Application';
import { saveNote } from './notes.service';
import { generateSchedulingNote } from '../util/note.util';

const APPLICATION_RECORD_TYPE_ID = '0125G000000feaeQAA';

export const createApplication = async (
  conn: Connection<SmoothstackSchema>,
  jobId: string,
  application: { candidateFields: CandidateFields; applicationFields: ApplicationFields },
  resume: any
): Promise<{ candidateId: string; applicationId: string }> => {
  const { candidateFields, applicationFields } = application;

  const candidateId = await createCandidate(conn, candidateFields, applicationFields.utmTerm);
  const { stageName, rejectionReason, snoozeReason } = deriveApplicationStatus(applicationFields.status);
  const applicationRecord: Partial<Fields$Opportunity> = {
    RecordTypeId: APPLICATION_RECORD_TYPE_ID,
    Name: uuidv4(),
    CloseDate: new Date().toISOString() as DateString,
    Application_Date__c: new Date().toISOString() as DateString,
    StageName: stageName,
    ...(rejectionReason && { Rejection_Reason__c: rejectionReason }),
    ...(snoozeReason && { Snooze_Reason__c: snoozeReason }),
    Application_Device__c: applicationFields.deviceType,
    ...(applicationFields.utmSource && { UTM_Source__c: applicationFields.utmSource }),
    ...(applicationFields.utmMedium && { UTM_Medium__c: applicationFields.utmMedium }),
    ...(applicationFields.utmCampaign && { UTM_Campaign__c: applicationFields.utmCampaign }),
    ...(applicationFields.utmTerm && { UTM_Term__c: applicationFields.utmTerm }),
    Work_Authorization__c: applicationFields.workAuthorization,
    Willing_to_Relocate__c: applicationFields.relocation,
    Coding_Self_Rank__c: +applicationFields.codingAbility,
    Years_of_Experience_Self_Disclosed__c: applicationFields.yearsOfExperience,
    ...(applicationFields.graduationDate && {
      Graduation_Date__c: new Date(applicationFields.graduationDate).toISOString().split('T')[0] as DateString,
      Months_to_Graduation__c: calculateMonthsToGrad(new Date(applicationFields.graduationDate)),
    }),
    ...(applicationFields.degreeExpected && { Expected_Degree__c: applicationFields.degreeExpected }),
    ...(applicationFields.highestDegree && { Education_Level__c: applicationFields.highestDegree }),
    Military_Status__c: applicationFields.militaryStatus,
    ...(applicationFields.militaryBranch && { Military_Branch__c: applicationFields.militaryBranch }),
    ...(applicationFields.major && { Major__c: applicationFields.major }),
    ...(applicationFields.linkedin && { LinkedIn_URL__c: applicationFields.linkedin }),
    ...(applicationFields.instagram && { Instagram_URL__c: applicationFields.instagram }),
    Candidate__c: candidateId,
    Job__c: jobId,
  };

  const { id: applicationId }: any = await conn._createSingle('Opportunity', applicationRecord, {});
  await conn._createSingle(
    'OpportunityContactRole',
    {
      ContactId: candidateId,
      OpportunityId: applicationId,
    },
    {}
  );
  resume &&
    (await saveSFDCFiles(conn, applicationId, [
      {
        type: 'Application Resume',
        contentType: resume.contentType,
        fileContent: Buffer.from(resume.content).toString('base64'),
        name: resume.filename,
      },
    ]));

  return { applicationId, candidateId };
};

export const fetchApplication = async (
  conn: Connection<SmoothstackSchema>,
  applicationId: string
): Promise<Application> => {
  const application = await conn
    .sobject('Opportunity')
    .findOne({ Id: { $eq: applicationId ?? null } })
    .select(
      'Id, Challenge_Scheduling_Link__c, Prescreen_Scheduling_Link__c, Challenge_Link__c, Challenge_Date_Time__c, Webinar_Scheduling_Link__c, Webinar_Registrant_ID__c, Webinar_ID__c, Webinar_Occurrence_ID__c, Event_ID_Microsoft__c, Candidate__r.Id, Candidate__r.FirstName, Candidate__r.LastName, Candidate__r.Nickname__c, Candidate__r.Email, Candidate__r.MobilePhone, Candidate__r.MailingCity, Candidate__r.MailingStateCode, Candidate__r.MailingStreet, Candidate__r.MailingPostalCode, Candidate__r.Owner.*, Candidate__r.Potential_Smoothstack_Email__c, Job__r.*'
    );

  return application
    ? {
        ...application,
        Candidate__r: (application as any).Candidate__r as Candidate,
        Job__r: (application as any).Job__r as Fields$Job__c,
      }
    : null;
};

export const findApplicationByAppointmentId = async (
  conn: Connection<SmoothstackSchema>,
  appointmentId: number,
  schedulingType: SchedulingType
) => {
  let appointmentIdField: string;
  switch (schedulingType) {
    case SchedulingType.CHALLENGE:
      appointmentIdField = 'Challenge_Appointment_ID__c';
      break;
    case SchedulingType.TECHSCREEN:
      appointmentIdField = 'Tech_Screen_Appointment_ID__c';
      break;
    case SchedulingType.WEBINAR:
      appointmentIdField = 'Webinar_Appointment_ID__c';
      break;
    case SchedulingType.PRESCREEN:
      appointmentIdField = 'Prescreen_Appointment_ID__c';
      break;
  }

  return await findApplication(conn, appointmentIdField, appointmentId);
};

export const findApplication = async (
  conn: Connection<SmoothstackSchema>,
  byField: string,
  fieldValue: string | number
): Promise<Application> => {
  const application = await conn
    .sobject('Opportunity')
    .findOne({ [byField]: { $eq: `${fieldValue}` } })
    .select(
      'Id, Webinar_Registrant_ID__c, Webinar_ID__c, Webinar_Occurrence_ID__c, Event_ID_Microsoft__c, Candidate__r.Id, Candidate__r.FirstName, Candidate__r.LastName, Candidate__r.Email, Candidate__r.MobilePhone, Candidate__r.Owner.*, Job__r.*'
    );

  return application
    ? {
        ...application,
        Candidate__r: (application as any).Candidate__r as Fields$Contact,
        Job__r: (application as any).Job__r as Fields$Job__c,
      }
    : null;
};

export const findApplications = async (
  conn: Connection<SmoothstackSchema>,
  byField: string,
  fieldValue: string | number
): Promise<Application[]> => {
  const applications = await conn
    .sobject('Opportunity')
    .find({ [byField]: { $eq: `${fieldValue}` } })
    .select(
      'Id, Candidate__r.FirstName, Candidate__r.LastName, Candidate__r.Email, Candidate__r.MobilePhone, Job__r.*'
    );

  return applications.map((application) => ({
    ...application,
    Candidate__r: (application as any).Candidate__r as Fields$Contact,
    Job__r: (application as any).Job__r as Fields$Job__c,
  }));
};

export const updateApplication = async (
  conn: Connection<SmoothstackSchema>,
  identifier:
    | { id: string; byField?: never; byValue?: never }
    | { byField: string; byValue: string | number; id?: never },
  updateFields: Partial<Fields$Opportunity>
) => {
  const { id, byField, byValue } = identifier;
  let applicationId = id;
  if (byField) {
    const application = await findApplication(conn, byField, byValue);
    applicationId = application?.Id;
  }
  if (applicationId) {
    await conn.sobject('Opportunity').update({ Id: applicationId, ...updateFields });
  }
};

export const saveSchedulingDataByApplicationId = async (
  conn: Connection<SmoothstackSchema>,
  applicationId: string,
  status: string,
  appointment: Appointment,
  type: SchedulingType,
  applicationStatus: string,
  webinarRegistration?: WebinarRegistration,
  screenerUserId?: string
) => {
  const { datetime: date } = appointment;
  const application = await fetchApplication(conn, applicationId);
  const { stageName, rejectionReason } = deriveApplicationStatus(applicationStatus);
  let updateData: Partial<Fields$Opportunity>;
  let eventType: string = type;
  switch (type) {
    case SchedulingType.CHALLENGE: {
      eventType = `${type}(${application.Job__r.Coding_Challenge_Name__c})`;
      updateData = {
        Challenge_Appointment_Status__c: status,
        Challenge_Date_Time__c: date as DateString,
        Challenge_Appointment_ID__c: `${appointment.id}`,
        StageName: stageName,
        ...(rejectionReason && { Rejection_Reason__c: rejectionReason }),
      };
      break;
    }
    case SchedulingType.TECHSCREEN: {
      updateData = {
        Tech_Screen_Appointment_Status__c: status,
        Tech_Screen_Date__c: date as DateString,
        Tech_Screen_Appointment_ID__c: `${appointment.id}`,
        StageName: stageName,
        ...(rejectionReason && { Rejection_Reason__c: rejectionReason }),
        Tech_Screen_Cancellation_Link__c: appointment.confirmationPage,
        ...(screenerUserId && { Tech_Screener__c: screenerUserId }),
      };
      break;
    }
    case SchedulingType.WEBINAR: {
      updateData = {
        StageName: stageName,
        ...(rejectionReason && { Rejection_Reason__c: rejectionReason }),
        Webinar_Appointment_Status__c: status,
        Webinar_Appointment_ID__c: `${appointment.id}`,
        Webinar_Date__c: date as DateString,
        Webinar_Link__c: webinarRegistration.joinUrl,
        Webinar_Registrant_ID__c: webinarRegistration.registrantId,
        Webinar_ID__c: webinarRegistration.webinarId,
        Webinar_Occurrence_ID__c: webinarRegistration.occurrenceId,
      };
      break;
    }
    case SchedulingType.PRESCREEN: {
      updateData = {
        StageName: stageName,
        ...(rejectionReason && { Rejection_Reason__c: rejectionReason }),
        Prescreen_Appointment_Status__c: status,
        Prescreen_Appointment_ID__c: `${appointment.id}`,
        Prescreen_Date__c: date as DateString,
      };
      break;
    }
  }

  await updateApplication(conn, { id: applicationId }, updateData);
  await saveNote(conn, application.Candidate__r.Id, {
    title: 'Scheduling Event',
    content: generateSchedulingNote(eventType, status, date),
  });

  return application;
};

export const saveSchedulingDataByAppointmentId = async (
  conn: Connection<SmoothstackSchema>,
  status: string,
  appointmentId: number,
  date: string,
  type: SchedulingType,
  applicationStatus: string,
  webinarRegistration?: WebinarRegistration,
  screenerUserId?: string
) => {
  const application = await findApplicationByAppointmentId(conn, appointmentId, type);
  if (application) {
    let updateData: Partial<Fields$Opportunity>;
    const { stageName, rejectionReason } = deriveApplicationStatus(applicationStatus);
    let eventType: string = type;
    switch (type) {
      case SchedulingType.CHALLENGE: {
        eventType = `${type}(${application.Job__r.Coding_Challenge_Name__c})`;
        updateData = {
          Challenge_Appointment_Status__c: status,
          Challenge_Date_Time__c: date as DateString,
          StageName: stageName,
          ...(rejectionReason && { Rejection_Reason__c: rejectionReason }),
        };
        break;
      }
      case SchedulingType.TECHSCREEN: {
        updateData = {
          Tech_Screen_Appointment_Status__c: status,
          Tech_Screen_Date__c: date as DateString,
          StageName: stageName,
          ...(rejectionReason && { Rejection_Reason__c: rejectionReason }),
          ...(screenerUserId && { Tech_Screener__c: screenerUserId }),
        };
        break;
      }
      case SchedulingType.WEBINAR: {
        updateData = {
          StageName: stageName,
          ...(rejectionReason && { Rejection_Reason__c: rejectionReason }),
          Webinar_Appointment_Status__c: status,
          Webinar_Date__c: date as DateString,
          ...(webinarRegistration && {
            Webinar_Link__c: webinarRegistration.joinUrl,
            Webinar_Registrant_ID__c: webinarRegistration.registrantId,
            Webinar_ID__c: webinarRegistration.webinarId,
            Webinar_Occurrence_ID__c: webinarRegistration.occurrenceId,
          }),
        };
        break;
      }
      case SchedulingType.PRESCREEN: {
        updateData = {
          StageName: stageName,
          ...(rejectionReason && { Rejection_Reason__c: rejectionReason }),
          Prescreen_Appointment_Status__c: status,
          Prescreen_Date__c: date as DateString,
        };
        break;
      }
    }

    await updateApplication(conn, { id: application.Id }, updateData);
    await saveNote(conn, application.Candidate__r.Id, {
      title: 'Scheduling Event',
      content: generateSchedulingNote(eventType, status, date),
    });
  }
  return application;
};

export const fetchApplicationHistory = async (
  conn: Connection<SmoothstackSchema>,
  identifier:
    | { id: string; byField?: never; byValue?: never }
    | { byField: string; byValue: string | number; id?: never },
  historyField: string
): Promise<Fields$OpportunityFieldHistory[]> => {
  const { id, byField, byValue } = identifier;
  let applicationId = id;
  if (byField) {
    const application = await findApplication(conn, byField, byValue);
    applicationId = application?.Id;
  }

  return applicationId
    ? await conn
        .sobject('OpportunityFieldHistory')
        .find({ OpportunityId: { $eq: applicationId ?? null }, $and: { Field: historyField } })
    : [];
};
