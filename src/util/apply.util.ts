import { Application } from '../model/Application';

const DAY_DIFF = 60;

export const calculateMonthsToGrad = (graduationDate: Date): number => {
  const today = new Date(
    new Date().toLocaleDateString('en-US', {
      timeZone: 'America/New_York',
    })
  );
  let diff = (today.getTime() - graduationDate.getTime()) / 1000;
  diff /= 60 * 60 * 24 * 7 * 4;
  const result = -Math.round(diff);
  return result;
};

export const hasMinYearsOfExperience = (minYears: string, years: string) => {
  const EXP_MAP = {
    'Not Specified': 0,
    '0-1': 0,
    '1-2': 1,
    '2-3': 2,
    '3+': 3,
  };
  return EXP_MAP[years] >= EXP_MAP[minYears];
};

export const hasMinDegree = (minDegree: string, educationDegree: string) => {
  const noDegreeList = ['None', 'GED', 'High School'];
  const validDegreeList = ['Not Specifed', "Associate's", "Bachelor's", "Master's", 'PhD'];
  const degree = noDegreeList.includes(educationDegree) ? 'Not Specified' : educationDegree;
  return validDegreeList.indexOf(degree) >= validDegreeList.indexOf(minDegree);
};

export const hasRecentApplication = (applications: Application[]): boolean => {
  return applications
    .filter((a) => a.Rejection_Reason__c !== 'Recently Applied')
    .some((a) => {
      const timeDiff = new Date().getTime() - new Date(a.CreatedDate).getTime();
      const dayDiff = timeDiff / (1000 * 3600 * 24);
      return dayDiff < DAY_DIFF;
    });
};
