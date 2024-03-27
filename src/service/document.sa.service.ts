import {
  DocumentsApi,
  DocumentsApiCreateDocumentRequest,
  DocumentsApiDownloadDocumentRequest,
  DocumentsApiSendDocumentRequest,
} from 'pandadoc-node-client';
import { getSFDCConnection } from './auth/sfdc.auth.service';
import { getPandaDocConfig } from './auth/pandadoc.auth.service';
import { fetchSAApplication } from './application.sa.service';
import { RTRParams } from '../model/RTR.sa';
import { rateFormatter } from '../util/misc.util';

const RTR_TEMPLATE_ID = '5sKfP3JKDF7sWFUHpLhrEY';

export const generateRTRDoc = async (rtrParams: RTRParams) => {
  const conn = await getSFDCConnection();
  const pDoc = new DocumentsApi(await getPandaDocConfig('SA_API_KEY'));
  const { Resource__r, Employee_Type__c, Opportunity__r, Client_Name__c, Pay_Rate__c } = await fetchSAApplication(
    conn,
    rtrParams.applicationId
  );

  const body: DocumentsApiCreateDocumentRequest = {
    documentCreateRequest: {
      name: 'Smoothstack Right to Represent',
      templateUuid: RTR_TEMPLATE_ID,
      recipients: [
        {
          email: Resource__r.Email,
          firstName: Resource__r.FirstName,
          lastName: Resource__r.LastName,
          role: 'Client',
          signingOrder: 1,
        },
      ],
      tokens: [
        {
          name: 'fullName',
          value: `${Resource__r.FirstName} ${Resource__r.LastName}`,
        },
        {
          name: 'position',
          value: Opportunity__r.Job_Title__c,
        },
        {
          name: 'employmentType',
          value: Employee_Type__c,
        },
        {
          name: 'clientName',
          value: Client_Name__c,
        },
        {
          name: 'rateDetails',
          value: getRateDetails(Pay_Rate__c, Employee_Type__c),
        },
      ],
      metadata: { applicationId: rtrParams.applicationId, type: 'RTR' },
    },
  };

  await pDoc.createDocument(body);
};

const getRateDetails = (payRate: number, employmentType: string) => {
  if (employmentType === 'W2') {
    return `Rate: ${rateFormatter().format(payRate)}/hr plus benefits`;
  }
  if (['1099', 'Self C2C'].includes(employmentType)) {
    return `Rate: ${rateFormatter().format(payRate)}/hr`;
  }
  return '';
};

export const sendSADocument = async (documentId: string, docParams: { subject: string; message: string }) => {
  const pDoc = new DocumentsApi(await getPandaDocConfig('SA_API_KEY'));
  const body: DocumentsApiSendDocumentRequest = {
    id: documentId,
    documentSendRequest: {
      subject: docParams.subject,
      message: docParams.message,
      sender: {
        email: 'info@smoothstack.com',
      },
    },
  };
  await pDoc.sendDocument(body);
};

export const downloadSASignedDocument = async (documentId: string) => {
  const pDoc = new DocumentsApi(await getPandaDocConfig('SA_API_KEY'));
  const body: DocumentsApiDownloadDocumentRequest = {
    id: documentId,
  };
  return await pDoc.downloadDocument(body);
};
