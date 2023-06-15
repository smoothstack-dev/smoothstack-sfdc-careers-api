export type GenerationType = 'INITIAL_LINKS' | 'TECHSCREEN_LINKS' | 'SMS_CONTACT';

export interface DataGenerationRequest {
  type: GenerationType;
  applicationId: string;
}
