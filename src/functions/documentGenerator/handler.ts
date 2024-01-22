import { SNSEvent } from 'aws-lambda';
import { generateOfferDoc, generateQuickCourseDoc } from '../../service/document.service';
import { DocGenerationMsg } from '../../model/Document';

const documentGenerator = async (event: SNSEvent) => {
  try {
    console.log('Received Document Generation Request.');
    const request: DocGenerationMsg = JSON.parse(event.Records[0].Sns.Message);
    if (request.type === 'QUICK_COURSE') {
      await generateQuickCourseDoc(request.params.applicationId);
      console.log('Successfully generated Quick Course Doc for application: ', request.params.applicationId);
    }
    if (request.type === 'OFFER_LETTER') {
      await generateOfferDoc(request.params);
      console.log('Successfully generated Offer Doc for consultant: ', request.params.consultantId);
    }
  } catch (e) {
    console.error('Error generating document: ', e.message);
    throw e;
  }
};

export const main = documentGenerator;
