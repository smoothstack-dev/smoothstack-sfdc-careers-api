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
            if (!body?.applicationId) {
              throw createHttpError(400, 'applicationId missing in request body.');
            }
            const docType = body?.docType ?? 'QUICK_COURSE';
            if (!['QUICK_COURSE', 'RTR'].includes(docType)) {
              throw createHttpError(400, 'Invalid docType param in request body. Must be one of -> QUICK_COURSE, RTR');
            }

            await publishDocumentGenerationRequest({
              type: docType,
              params: { applicationId: body.applicationId },
            });

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
