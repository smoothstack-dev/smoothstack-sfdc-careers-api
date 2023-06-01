import { Application } from '../model/Application';
import { SchedulingTypeId } from '../model/SchedulingType';

export const getSchedulingLink = (
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  typeId: SchedulingTypeId,
  applicationId: string,
  calendarId?: string
) => {
  return (
    `https://app.squarespacescheduling.com/schedule.php?owner=23045512&appointmentType=${typeId}&firstName=${encodeURIComponent(
      firstName
    )}&lastName=${encodeURIComponent(lastName)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(
      phone
    )}&field:13195611=sfdc&field:11569425=${encodeURIComponent(applicationId)}` +
    (calendarId ? `&calendarID=${encodeURIComponent(calendarId)}` : '')
  );
};

export const getTechScreeningLink = (application: Application) => {
  const { Id: applicationId } = application;
  return `https://smoothstack.my.salesforce.com/lightning/n/Tech_Screen?c__appId=${applicationId}`;
};
