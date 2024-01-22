import { OfferParams } from './Offer';

export type DocumentEvent = DocSignedEvent | DocChangedEvent;

interface DocChangedEvent {
  event: 'document_state_changed';
  data: DocEventData;
}

interface DocSignedEvent {
  event: 'recipient_completed';
  data: DocEventData;
}

type DocEventData =
  | { id: string; status: string; metadata: { type: 'QUICK_COURSE'; applicationId: string } }
  | { id: string; status: string; metadata: { type: 'OFFER_LETTER'; consultantId: string } };

export type DocGenerationMsg = OfferDocMsg | QuickCourseDocMsg;

interface OfferDocMsg {
  type: 'OFFER_LETTER';
  params: OfferParams;
}

interface QuickCourseDocMsg {
  type: 'QUICK_COURSE';
  params: { applicationId: string };
}
