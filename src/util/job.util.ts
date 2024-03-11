import { KnockoutFields } from '../model/Knockout';
import { Fields$Job__c } from '../model/smoothstack.schema';
import { calculateMonthsToGrad, hasMinDegree, hasMinYearsOfExperience } from './apply.util';

export const JOB_BATCHTYPE_MAPPING = {
  java: ['Java'],
  python: ['Cloud', 'Pre-Silicon'],
  c: ['C++', 'Pre-Silicon', 'Dynamics'],
  dotNet: ['.NET'],
  other: ['Cloud', 'Salesforce', 'Pre-Silicon'],
};

export const resolveJobByKnockout = (knockout: KnockoutFields, activeJobs: Fields$Job__c[]) => {
  const {
    workAuthorization,
    relocation,
    graduationDate,
    yearsOfExperience,
    educationDegree,
    degreeExpected,
    selfRank,
    techSelection,
    hardwareDesign,
    hardwareSkills,
  } = knockout;
  const monthsToGraduation = graduationDate ? calculateMonthsToGrad(new Date(graduationDate)) : 0;
  if (hardwareDesign === 'No' || hardwareSkills === 'No') {
    activeJobs = activeJobs.filter((job) => job.Cohort_Category__c !== 'Pre-Silicon');
  }
  const pointMap = activeJobs.reduce(
    (acc, j) => ({
      ...acc,
      [j.Job_ID__c]: { basePoints: 0, extraPoints: 0 },
    }),
    {}
  );
  activeJobs.forEach((j) => {
    const {
      Allowable_Work_Authorization__c,
      Job_Location__c,
      Max_Months_to_Graduation__c,
      Min_Years_of_Coding_Experience__c,
      Min_Degree_Required__c,
      Min_Coding_Self_Rank__c,
    } = j;

    if (Allowable_Work_Authorization__c.split(';').includes(workAuthorization)) {
      pointMap[j.Job_ID__c].basePoints++;
    }
    if (['Unknown', 'Onsite'].includes(Job_Location__c) && relocation !== 'No') {
      pointMap[j.Job_ID__c].basePoints++;
    }
    if (Job_Location__c === 'Remote') {
      pointMap[j.Job_ID__c].basePoints++;
      if (relocation !== 'Yes') {
        pointMap[j.Job_ID__c].extraPoints++;
      }
    }
    if (Max_Months_to_Graduation__c === 'Not Specified' || monthsToGraduation <= +Max_Months_to_Graduation__c) {
      pointMap[j.Job_ID__c].basePoints++;
    }
    if (hasMinYearsOfExperience(Min_Years_of_Coding_Experience__c, yearsOfExperience)) {
      pointMap[j.Job_ID__c].basePoints++;
      if (Min_Years_of_Coding_Experience__c !== 'Not Specified') {
        pointMap[j.Job_ID__c].extraPoints++;
      }
    }
    if (hasMinDegree(Min_Degree_Required__c, educationDegree ?? degreeExpected)) {
      pointMap[j.Job_ID__c].basePoints++;
      if (Min_Degree_Required__c !== 'Not Specified') {
        pointMap[j.Job_ID__c].extraPoints++;
      }
    }
    if (selfRank >= +Min_Coding_Self_Rank__c) {
      pointMap[j.Job_ID__c].basePoints++;
    }
    if (JOB_BATCHTYPE_MAPPING[techSelection].includes(j.Cohort_Category__c)) {
      pointMap[j.Job_ID__c].extraPoints += 2;
    }
    if (hardwareDesign === 'Yes' && hardwareSkills === 'Yes' && j.Cohort_Category__c === 'Pre-Silicon') {
      pointMap[j.Job_ID__c].extraPoints++;
    }
  });

  const maxBasePoints = Math.max(...Object.keys(pointMap).map((k) => pointMap[k].basePoints));
  const maxBaseJobOrders = activeJobs.filter((job) => pointMap[job.Job_ID__c].basePoints === maxBasePoints);
  const maxTotalPoints = Math.max(
    ...maxBaseJobOrders.map((j) => pointMap[j.Job_ID__c].basePoints + pointMap[j.Job_ID__c].extraPoints)
  );
  const highestRankedJobs = maxBaseJobOrders.filter(
    (job) => pointMap[job.Job_ID__c].basePoints + pointMap[job.Job_ID__c].extraPoints === maxTotalPoints
  );

  return highestRankedJobs[(highestRankedJobs.length * Math.random()) | 0];
};
