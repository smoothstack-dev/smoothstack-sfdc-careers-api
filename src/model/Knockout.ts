import { Application } from './Application';

export interface KnockoutRequirements {
  requiredWorkAuthorization: string[];
  jobLocation: string;
  maxMonthsToGraduation: string;
  minYearsOfExperience: string;
  minRequiredDegree: string;
  minSelfRank: number;
}

export interface KnockoutFields {
  // baseFields
  workAuthorization: string;
  relocation: string;
  graduationDate?: string;
  educationDegree?: string;
  degreeExpected?: string;
  existingApplications: Application[];
  selfRank: number;
  // coding job
  yearsOfExperience?: string;
  techSelection?: string;
  hardwareDesign?: string;
  hardwareSkills?: string;
  // tehnician job
  physicalRequirements?: string;
}

export enum Knockout {
  PASS = 'PASS',
  WORK_AUTH = 'WORK_AUTH',
  RELOCATION = 'RELOCATION',
  GRADUATION = 'GRADUATION',
  YEARS_OF_EXP = 'YEARS_OF_EXP',
  DEGREE = 'DEGREE',
  SELF_RANK = 'SELF_RANK',
  RECENTLY_APPLIED = 'RECENTLY_APPLIED',
  // technician job
  PHYSICAL_REQS = 'PHYSICAL_REQS',
}

export const KNOCKOUT_STATUS = {
  [Knockout.PASS]: { applicationStatus: 'Submitted', candidateStatus: 'Active' },
  [Knockout.WORK_AUTH]: { applicationStatus: 'R-Work Authorization', candidateStatus: 'Rejected' },
  [Knockout.RELOCATION]: { applicationStatus: 'R-Relocation', candidateStatus: 'Rejected' },
  [Knockout.GRADUATION]: { applicationStatus: 'S-Graduation Date', candidateStatus: 'Snooze' },
  [Knockout.YEARS_OF_EXP]: { applicationStatus: 'R-Years of Experience', candidateStatus: 'Rejected' },
  [Knockout.DEGREE]: { applicationStatus: 'R-Education', candidateStatus: 'Rejected' },
  [Knockout.SELF_RANK]: { applicationStatus: 'R-Self Rank', candidateStatus: 'Rejected' },
  [Knockout.RECENTLY_APPLIED]: { applicationStatus: 'R-Recently Applied', candidateStatus: null },
  [Knockout.PHYSICAL_REQS]: { applicationStatus: 'R-Physical Requirements', candidateStatus: 'Rejected' },
};

export const KNOCKOUT_NOTE = {
  [Knockout.PASS]: 'Candidate Passed Knockout.',
  [Knockout.WORK_AUTH]: 'Candidate rejected for work authorization.',
  [Knockout.RELOCATION]: 'Candidate rejected for relocation.',
  [Knockout.GRADUATION]:
    'Candidate Snoozed as they are currently in school and not graduating within a reasonable timeframe.',
  [Knockout.YEARS_OF_EXP]: 'Candidate rejected for years of experience. Potentially eligible for another role.',
  [Knockout.DEGREE]: 'Candidate rejected for education. Potentially eligible for another role.',
  [Knockout.SELF_RANK]: 'Candidate rejected for technical self ranking.',
  [Knockout.RECENTLY_APPLIED]: 'Candidate rejected because they have another application within the last 60 days',
  [Knockout.PHYSICAL_REQS]: 'Candidate rejected for not meeting physical requirements for job',
};
