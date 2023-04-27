export interface DocumentGenerationRequest {
  applicationId: string;
}

export interface DocumentEvent {
  event: 'document_state_changed' | 'recipient_completed';
  data: { id: string; status: string; metadata: any };
}
