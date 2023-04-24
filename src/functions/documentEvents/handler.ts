import { middyfy } from '@libs/lambda';
import { APIGatewayEvent } from 'aws-lambda';
import { publishDocumentGenerationRequest } from '../../service/sns.service';
import createHttpError from 'http-errors';

const documentEvents = async (event: APIGatewayEvent) => {
  try {
    switch (event.path) {
      case '/document-events': {
        switch (event.httpMethod) {
          case 'POST': {
            return 'Processed document successfully.';
          }
        }
      }
      case '/document-events/generate': {
        switch (event.httpMethod) {
          case 'POST': {
            const body = event.body as any;
            if (body?.applicationId) {
              await publishDocumentGenerationRequest(body.applicationId);
            } else {
              throw createHttpError(400, 'applicationId missing in request body.');
            }
          }
        }
      }
    }
  } catch (e) {
    console.error(e);
    throw e;
  }
};

export const main = middyfy(documentEvents);
