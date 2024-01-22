import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { publishDocumentEventProcessingRequest, publishDocumentGenerationRequest } from '../../service/sns.service';
import createHttpError from 'http-errors';
import { DocumentEvent } from '../../model/Document';

const documentEvents = async (event: APIGatewayEvent) => {
  try {
    switch (event.path) {
      case '/document-events': {
        switch (event.httpMethod) {
          case 'POST': {
            const docEvents = event.body as unknown as DocumentEvent[];
            for (const docEvent of docEvents) {
              if (['document_state_changed', 'recipient_completed'].includes(docEvent.event)) {
                await publishDocumentEventProcessingRequest(docEvent);
              }
            }
            break;
          }
        }
        break;
      }
      case '/document-events/generate': {
        switch (event.httpMethod) {
          case 'POST': {
            const body = event.body as any;
            if (body?.applicationId) {
              await publishDocumentGenerationRequest({
                type: 'QUICK_COURSE',
                params: { applicationId: body.applicationId },
              });
            } else {
              throw createHttpError(400, 'applicationId missing in request body.');
            }
            break;
          }
        }
        break;
      }
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(documentEvents);
