import { SNSEvent } from 'aws-lambda';
import { DocumentEvent } from '../../model/Document';
import { processSignedDocument, sendDocument } from '../../service/document.service';

const documentEventProcessor = async (event: SNSEvent) => {
  try {
    const docEvent: DocumentEvent = JSON.parse(event.Records[0].Sns.Message);
    console.log('Received Document Event Processing Request: ', docEvent);
    switch (docEvent.event) {
      case 'document_state_changed':
        if (docEvent.data.status === 'document.draft') {
          await sendDocument(docEvent.data.id, docEvent.data.metadata.applicationId);
        }
        break;
      case 'recipient_completed':
        await processSignedDocument(docEvent.data.id, docEvent.data.metadata.applicationId);
        break;
    }
    console.log('Successfully processed document event');
  } catch (e) {
    console.error('Error processing document event: ', e.message);
    throw e;
  }
};

export const main = documentEventProcessor;
