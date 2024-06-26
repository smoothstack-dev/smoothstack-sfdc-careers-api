import { SNSEvent } from 'aws-lambda';
import { DocumentEvent } from '../../model/Document';
import { downloadSignedDocument, sendDocument } from '../../service/document.service';
import { updateApplication } from '../../service/application.service';
import { getSFDCConnection } from '../../service/auth/sfdc.auth.service';
import { updateConsultant } from '../../service/consultant.service';
import { DateString } from 'jsforce';
import { saveSFDCFiles } from '../../service/files.service';
import { HttpFile } from 'pandadoc-node-client';
import { publishMSUserGenerationRequest } from '../../service/sns.service';
import { downloadSASignedDocument, sendSADocument } from '../../service/document.sa.service';
import { updateSAApplication } from '../../service/application.sa.service';

const documentEventProcessor = async (event: SNSEvent) => {
  try {
    const docEvent: DocumentEvent = JSON.parse(event.Records[0].Sns.Message);
    console.log('Received Document Event Processing Request: ', docEvent);
    switch (docEvent.event) {
      case 'document_state_changed':
        if (docEvent.data.status === 'document.draft') {
          switch (docEvent.data.metadata.type) {
            case 'QUICK_COURSE':
              await sendDocument(docEvent.data.id, {
                subject: 'Smoothstack Document Signature Request',
                message: 'Please sign the following document to confirm enrollment.',
              });
              await updateApplicationData(docEvent.data.metadata.applicationId, 'SENT');
              break;
            case 'OFFER_LETTER':
              await sendDocument(docEvent.data.id, {
                subject: 'Smoothstack Offer Letter',
                message: 'See attached Employment Offer Letter from Smoothstack.',
              });
              await updateConsultantData(docEvent.data.metadata.consultantId, 'SENT');
              break;
            case 'RTR':
              await sendSADocument(docEvent.data.id, {
                subject: 'Smoothstack Right to Represent',
                message: 'See attached RTR Document from Smoothstack.',
              });
              await updateSAApplicationData(docEvent.data.metadata.applicationId, 'SENT');
              break;
          }
        }
        break;
      case 'recipient_completed':
        switch (docEvent.data.metadata.type) {
          case 'QUICK_COURSE': {
            const docFile = await downloadSignedDocument(docEvent.data.id);
            await updateApplicationData(docEvent.data.metadata.applicationId, 'SIGNED', docFile);
            break;
          }
          case 'OFFER_LETTER': {
            if (docEvent.data.action_by.email !== 'hr@smoothstack.com') {
              await updateConsultantData(docEvent.data.metadata.consultantId, 'SIGNED');
            }
            break;
          }
          case 'RTR': {
            const docFile = await downloadSASignedDocument(docEvent.data.id);
            await updateSAApplicationData(docEvent.data.metadata.applicationId, 'SIGNED', docFile);
            break;
          }
        }
        break;
    }
    console.log('Successfully processed document event');
  } catch (e) {
    console.error('Error processing document event: ', e.message);
    throw e;
  }
};

const updateApplicationData = async (applicationId: string, eventType: 'SENT' | 'SIGNED', docFile?: HttpFile) => {
  const conn = await getSFDCConnection();
  switch (eventType) {
    case 'SENT':
      await updateApplication(
        conn,
        { id: applicationId },
        {
          StageName: 'Quick Course Offered',
        }
      );
      break;
    case 'SIGNED':
      await updateApplication(
        conn,
        { id: applicationId },
        {
          StageName: 'Quick Course Signed',
        }
      );
      await saveSFDCFiles(conn, applicationId, [
        {
          type: 'Quick Course Offer',
          contentType: 'application/pdf',
          fileContent: docFile.data.toString('base64'),
          name: 'Signed_Quick_Course_Offer.pdf',
        },
      ]);
      await publishMSUserGenerationRequest(applicationId);
      break;
  }
};

const updateSAApplicationData = async (applicationId: string, eventType: 'SENT' | 'SIGNED', docFile?: HttpFile) => {
  const conn = await getSFDCConnection();
  switch (eventType) {
    case 'SENT':
      await updateSAApplication(
        conn,
        { id: applicationId },
        {
          RTR_Status__c: 'Sent',
          RTR_Sent__c: new Date().toISOString() as DateString,
        }
      );
      break;
    case 'SIGNED':
      await updateSAApplication(
        conn,
        { id: applicationId },
        {
          Status__c: 'RTR Signed',
          RTR_Status__c: 'Signed',
          RTR_Signed__c: new Date().toISOString() as DateString,
        }
      );
      await saveSFDCFiles(conn, applicationId, [
        {
          type: 'RTR',
          contentType: 'application/pdf',
          fileContent: docFile.data.toString('base64'),
          name: 'Signed_RTR.pdf',
        },
      ]);
      break;
  }
};

const updateConsultantData = async (consultantId: string, eventType: 'SENT' | 'SIGNED') => {
  const conn = await getSFDCConnection();
  switch (eventType) {
    case 'SENT':
      await updateConsultant(conn, consultantId, {
        Employment_Offer_Sent__c: new Date().toISOString() as DateString,
      });
      break;
    case 'SIGNED':
      await updateConsultant(conn, consultantId, {
        Employment_Offer_Signed__c: new Date().toISOString() as DateString,
        Candidate_Primary_Status__c: 'Training',
      });
      break;
  }
};

export const main = documentEventProcessor;
