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
  | {
      id: string;
      status: string;
      metadata: { type: 'QUICK_COURSE'; applicationId: string };
      action_by: { email: string };
    }
  | {
      id: string;
      status: string;
      metadata: { type: 'OFFER_LETTER'; consultantId: string };
      action_by: { email: string };
    }
  | {
      id: string;
      status: string;
      metadata: { type: 'RTR'; applicationId: string };
      action_by: { email: string };
    };

export type DocGenerationMsg = OfferDocMsg | QuickCourseDocMsg | RTRDocMsg;

interface OfferDocMsg {
  type: 'OFFER_LETTER';
  params: OfferParams;
}

interface QuickCourseDocMsg {
  type: 'QUICK_COURSE';
  params: { applicationId: string };
}

interface RTRDocMsg {
  type: 'RTR';
  params: { applicationId: string };
}
