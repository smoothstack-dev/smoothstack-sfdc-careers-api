import { SNSEvent } from 'aws-lambda';
import { DocumentGenerationRequest } from '../../model/Document';
import { generateDocument } from '../../service/document.service';

const documentGenerator = async (event: SNSEvent) => {
  try {
    console.log('Received Document Generation Request.');
    const request: DocumentGenerationRequest = JSON.parse(event.Records[0].Sns.Message);
    await generateDocument(request.applicationId);
    console.log('Successfully generated document for application: ', request.applicationId);
  } catch (e) {
    console.error('Error generating document: ', e.message);
    throw e;
  }
};

export const main = documentGenerator;
