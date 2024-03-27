import { Knockout } from "./Knockout";

export interface SAKnockoutRequirements {
  requiredWorkAuthorization: string[];
}

export interface SAKnockoutFields {
  workAuthorization: string;
}


export const SA_KNOCKOUT_STATUS = {
    [Knockout.PASS]: { applicationStatus: 'Potential Submission', candidateStatus: 'Active' },
    [Knockout.WORK_AUTH]: { applicationStatus: 'R-Work Authorization', candidateStatus: 'Rejected' },
  };