import { Application } from '../model/Application';
import { SchedulingTypeId } from '../model/SchedulingType';

export const getSchedulingLink = (
  firstName: string,
  lastName: string,
  email: string,
  phone: string,
  typeId: SchedulingTypeId,
  submissionId?: string
) => {
  return (
    `https://app.squarespacescheduling.com/schedule.php?owner=23045512&appointmentType=${typeId}&firstName=${encodeURIComponent(
      firstName
    )}&lastName=${encodeURIComponent(lastName)}&email=${encodeURIComponent(email)}&phone=${encodeURIComponent(
      phone
    )}&field:13195611=sfdc` + (submissionId ? `&field:11569425=${encodeURIComponent(submissionId)}` : '')
  );
};

export const getTechScreeningLink = (application: Application) => {
  const { Id: applicationId } = application;
  return `https://smoothstack.lightning.force.com/lightning/r/Opportunity/${applicationId}/view`;
};
