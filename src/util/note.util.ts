import { ApplicationFields } from '../model/Application';
import { CandidateFields } from '../model/Candidate';

export const generateApplicationNote = ({
  candidateFields,
  applicationFields,
}: {
  candidateFields: CandidateFields;
  applicationFields: ApplicationFields;
}): string => {
  const noteObj = {
    'First Name': candidateFields.firstName,
    'Last Name': candidateFields.lastName,
    Email: candidateFields.email,
    'Mobile Phone': candidateFields.phone,
    City: candidateFields.city,
    State: candidateFields.state,
    'Zip Code': candidateFields.zip,
    'Are you legally Authorized to work in the U.S?': applicationFields.workAuthorization,
    'Willingness to relocate': applicationFields.relocation,
    'How would you rank your coding ability? (0 - lowest, 10 - highest)': applicationFields.codingAbility,
    'Strongest Language': applicationFields.techSelection,
    ...(applicationFields.hardwareDesign && {
      'Interest in Hardware Design/Architecture?': applicationFields.hardwareDesign,
    }),
    ...(applicationFields.hardwareSkills && {
      'Do you have at least 1 Hardware Design/Architecture Skill?': applicationFields.hardwareSkills,
    }),
    'Are you currently a student?': applicationFields.currentlyStudent,
    ...(applicationFields.graduationDate && { 'Expected Graduation Date': applicationFields.graduationDate }),
    ...(applicationFields.degreeExpected && { 'Degree Expected': applicationFields.degreeExpected }),
    ...(applicationFields.highestDegree && { 'Highest Degree Achieved': applicationFields.highestDegree }),
    ...(applicationFields.major && { Major: applicationFields.major }),
    'Years of Experience (Including Personal/Educational Projects)': applicationFields.yearsOfExperience,
    'Military Status': applicationFields.militaryStatus,
    ...(applicationFields.militaryBranch && { 'Military Branch': applicationFields.militaryBranch }),
  };
  return `<p> ${Object.keys(noteObj).reduce(
    (acc, q, i) => `${acc}<strong>Q${i + 1} - ${q}</strong></p><p>A${i + 1} - ${noteObj[q]}</p><p>`,
    ''
  )} </p>`;
};

export const generateSchedulingNote = (eventType: string, schedulingAction: string, date: string) => {
  const formattedDate = date
    ? ` for: ${new Date(date).toLocaleString('en-US', {
        timeZone: 'America/New_York',
        dateStyle: 'short',
        timeStyle: 'short',
      })}`
    : '';
  return `${eventType} Appointment has been ${schedulingAction} for candidate${formattedDate}`;
};
