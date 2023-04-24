import { Application } from './Application';
import { Appointment } from './Appointment';

export interface AppointmentGenerationRequest {
  type: string;
  appointmentData: TechScreenAppointmentData | ChallengeAppointmentData;
}

export interface TechScreenAppointmentData {
  application: Application;
  screenerEmail: string;
  appointment: Appointment;
}

export interface ChallengeAppointmentData {
  application: Application;
  appointment: Appointment;
}

export enum AppointmentType {
  TECHSCREEN = 'techscreen',
  CHALLENGE = 'challenge',
}
