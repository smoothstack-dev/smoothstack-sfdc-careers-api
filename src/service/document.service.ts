import { salaryFormatter } from '../util/misc.util';
import { updateApplication } from './application.service';
import { fetchApplication } from './application.service';
import { getPandaDocConfig } from './auth/pandadoc.auth.service';
import { getSFDCConnection } from './auth/sfdc.auth.service';
import {
  DocumentsApi,
  DocumentsApiCreateDocumentRequest,
  DocumentsApiDownloadDocumentRequest,
  DocumentsApiSendDocumentRequest,
} from 'pandadoc-node-client';
import { saveSFDCFiles } from './files.service';
import { publishMSUserGenerationRequest } from './sns.service';

export const generateDocument = async (applicationId: string) => {
  const conn = await getSFDCConnection();
  const pDoc = new DocumentsApi(await getPandaDocConfig());
  const application = await fetchApplication(conn, applicationId);

  const body: DocumentsApiCreateDocumentRequest = {
    documentCreateRequest: {
      name: 'Smoothstack Document Signature Request',
      templateUuid: 'e7pDooH4o9KqdwBQcdQt7g',
      recipients: [
        {
          email: application.Candidate__r.Email,
          firstName: application.Candidate__r.FirstName,
          lastName: application.Candidate__r.LastName,
          role: 'Client',
          signingOrder: 1,
        },
      ],
      tokens: [
        {
          name: 'email',
          value: application.Candidate__r.Email,
        },
        {
          name: 'firstName',
          value: application.Candidate__r.FirstName,
        },
        {
          name: 'lastName',
          value: application.Candidate__r.LastName,
        },
        {
          name: 'mailingCity',
          value: application.Candidate__r.MailingCity,
        },
        {
          name: 'mailingStateCode',
          value: application.Candidate__r.MailingStateCode,
        },
        {
          name: 'mailingStreet',
          value: application.Candidate__r.MailingStreet,
        },
        {
          name: 'mailingZip',
          value: application.Candidate__r.MailingPostalCode,
        },
        {
          name: 'ownerEmail',
          value: application.Candidate__r.Owner.Email,
        },
        {
          name: 'ownerFirstName',
          value: application.Candidate__r.Owner.FirstName,
        },
        {
          name: 'ownerLastName',
          value: application.Candidate__r.Owner.LastName,
        },
        {
          name: 'startDate',
          value: application.Job__r.Quick_Course_Start_Date__c,
        },
        {
          name: 'trainingLength',
          value: application.Job__r.Training_Length_Weeks__c,
        },
        {
          name: 'year1Salary',
          value: `${salaryFormatter().format(application.Job__r.Year_1_Salary__c)}`,
        },
        {
          name: 'year2Salary',
          value: `${salaryFormatter().format(application.Job__r.Year_2_Salary__c)}`,
        },
      ],
      metadata: { applicationId },
    },
  };

  await pDoc.createDocument(body);
};

export const sendDocument = async (documentId: string, applicationId:string) => {
  const conn = await getSFDCConnection();
  const pDoc = new DocumentsApi(await getPandaDocConfig());
  const body: DocumentsApiSendDocumentRequest = {
    id: documentId,
    documentSendRequest: {
      subject: 'Smoothstack Document Signature Request',
      message: 'Please sign the following document to confirm enrollment.',
      sender: {
        email: 'info@smoothstack.com',
      },
    },
  };
  await pDoc.sendDocument(body);
  await updateApplication(
    conn,
    { id: applicationId },
    {
      StageName: 'Quick Course Offered',
    }
  );
};

export const processSignedDocument = async (documentId: string, applicationId: string) => {
  const conn = await getSFDCConnection();
  const pDoc = new DocumentsApi(await getPandaDocConfig());
  const body: DocumentsApiDownloadDocumentRequest = {
    id: documentId,
  };
  const docFile = await pDoc.downloadDocument(body);
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
};
