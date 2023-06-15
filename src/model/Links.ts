import { ApplicationStatus } from '../util/application.util';

export interface ChallengeLinksData {
  challengeLink: string;
  previousChallengeScore: number;
  previousChallengeId: string;
  applicationStatus: string;
}

export interface TechScreenLinksData {
  techScreenSchedulingLink: string;
  techScreenResult: string;
  techScreenDate: string;
  screenerEmail: string;
  screenerDetermination: string;
  applicationStatus: ApplicationStatus;
}
