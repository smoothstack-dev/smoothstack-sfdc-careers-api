export interface KnockoutRequirements {
  requiredWorkAuthorization: string[];
  jobLocation: string;
  maxMonthsToGraduation: string;
  minYearsOfExperience: string;
  minRequiredDegree: string;
  minSelfRank: number;
}

export interface KnockoutFields {
  workAuthorization: string;
  relocation: string;
  yearsOfExperience: string;
  graduationDate?: string;
  educationDegree?: string;
  degreeExpected?: string;
  codingAbility: number;
  techSelection?: string;
  hardwareDesign?: string;
  hardwareSkills?: string;
}

export enum Knockout {
  PASS = 'PASS',
  WORK_AUTH = 'WORK_AUTH',
  RELOCATION = 'RELOCATION',
  GRADUATION = 'GRADUATION',
  YEARS_OF_EXP = 'YEARS_OF_EXP',
  DEGREE = 'DEGREE',
  SELF_RANK = 'SELF_RANK',
}

export const KNOCKOUT_STATUS = {
  [Knockout.PASS]: { applicationStatus: 'Submitted', candidateStatus: 'Active' },
  [Knockout.WORK_AUTH]: { applicationStatus: 'R-Work Authorization', candidateStatus: 'Rejected' },
  [Knockout.RELOCATION]: { applicationStatus: 'R-Relocation', candidateStatus: 'Rejected' },
  [Knockout.GRADUATION]: { applicationStatus: 'S-Graduation Date', candidateStatus: 'Snooze' },
  [Knockout.YEARS_OF_EXP]: { applicationStatus: 'R-Years of Experience', candidateStatus: 'Rejected' },
  [Knockout.DEGREE]: { applicationStatus: 'R-Education', candidateStatus: 'Rejected' },
  [Knockout.SELF_RANK]: { applicationStatus: 'R-Self Rank', candidateStatus: 'Rejected' },
};

export const KNOCKOUT_NOTE = {
  [Knockout.PASS]: 'Candidate Passed Knockout.',
  [Knockout.WORK_AUTH]: 'Candidate rejected for work authorization.',
  [Knockout.RELOCATION]: 'Candidate rejected for relocation.',
  [Knockout.GRADUATION]:
    'Candidate Snoozed as they are currently in school and not graduating within a reasonable timeframe.',
  [Knockout.YEARS_OF_EXP]: 'Candidate rejected for years of experience. Potentially eligible for another role.',
  [Knockout.DEGREE]: 'Candidate rejected for education. Potentially eligible for another role.',
  [Knockout.SELF_RANK]: 'Candidate rejected for coding self rank ability.',
};
