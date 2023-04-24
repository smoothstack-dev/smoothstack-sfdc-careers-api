interface WebinarInfo {
  id: string;
  uuid: string;
}

export interface WebinarEvent {
  event: string;
  webinar: WebinarInfo;
}
export interface WebinarRegistration {
  webinarId: string;
  occurrenceId: string;
  registrantId: string;
  joinUrl?: string;
}
