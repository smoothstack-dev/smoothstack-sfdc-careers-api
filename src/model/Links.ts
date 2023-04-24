import { ApplicationStatus } from "../util/application.util";

export type LinksGenerationType = 'initial' | 'techscreen';

export interface LinksGenerationRequest {
  type: LinksGenerationType;
  applicationId: string;
}

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
  techScreenType: string;
  screenerEmail: string;
  screenerDetermination: string;
  applicationStatus: ApplicationStatus;
}
