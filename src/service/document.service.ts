import { rateFormatter, salaryFormatter } from '../util/misc.util';
import { fetchApplication } from './application.service';
import { getPandaDocConfig } from './auth/pandadoc.auth.service';
import { getSFDCConnection } from './auth/sfdc.auth.service';
import {
  DocumentsApi,
  DocumentsApiCreateDocumentRequest,
  DocumentsApiDownloadDocumentRequest,
  DocumentsApiSendDocumentRequest,
} from 'pandadoc-node-client';
import { fetchConsultant } from './consultant.service';
import { OfferParams, isSPOffer } from '../model/Offer';

const QUICK_COURSE_TEMPLATE_ID = 'e7pDooH4o9KqdwBQcdQt7g';
const OFFER_TEMPLATE_IDS = {
  'RELO/R': 'BA5q2CoffK9xoLqNCDm6bL',
  'NO-RELO/R': 'fbpQ77GDUf5bT5TVrci2GF',
  'RELO/SP': 'jUyhgnXA3UxktXr5zLUKgQ',
  'NO-RELO/SP': 'pbxpyJsJ3Cp3ohHAZKvQfE',
};

export const generateQuickCourseDoc = async (applicationId: string) => {
  const conn = await getSFDCConnection();
  const pDoc = new DocumentsApi(await getPandaDocConfig());
  const application = await fetchApplication(conn, applicationId);

  const body: DocumentsApiCreateDocumentRequest = {
    documentCreateRequest: {
      name: 'Smoothstack Document Signature Request',
      templateUuid: QUICK_COURSE_TEMPLATE_ID,
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
          value: salaryFormatter().format(application.Job__r.Year_1_Salary__c),
        },
        {
          name: 'year2Salary',
          value: salaryFormatter().format(application.Job__r.Year_2_Salary__c),
        },
      ],
      metadata: { applicationId, type: 'QUICK_COURSE' },
    },
  };

  await pDoc.createDocument(body);
};

export const generateOfferDoc = async (offerParams: OfferParams) => {
  const conn = await getSFDCConnection();
  const pDoc = new DocumentsApi(await getPandaDocConfig());
  const consultant = await fetchConsultant(conn, offerParams.consultantId);

  const body: DocumentsApiCreateDocumentRequest = {
    documentCreateRequest: {
      name: 'Smoothstack Offer Letter and Employment Agreement',
      templateUuid:
        OFFER_TEMPLATE_IDS[`${offerParams.offerType}/${isSPOffer(consultant.MailingStateCode) ? 'SP' : 'R'}`],
      recipients: [
        {
          email: consultant.Smoothstack_Email__c,
          firstName: consultant.FirstName,
          lastName: consultant.LastName,
          role: 'Client',
          signingOrder: 1,
        },
        {
          email: 'hr@smoothstack.com',
          firstName: 'Gabriela',
          lastName: 'Hower',
          role: 'HR',
          signingOrder: 2,
        },
      ],
      tokens: [
        {
          name: 'email',
          value: consultant.Smoothstack_Email__c,
        },
        {
          name: 'firstName',
          value: consultant.FirstName,
        },
        {
          name: 'lastName',
          value: consultant.LastName,
        },
        {
          name: 'reportsTo',
          value: offerParams.reportsTo,
        },
        {
          name: 'sentDate',
          value: new Date().toLocaleDateString('en-US', { timeZone: 'America/New_York' }),
        },
        {
          name: 'startDate',
          value: new Date(offerParams.startDate).toLocaleDateString('en-US'),
        },
        {
          name: 'minWage',
          value: rateFormatter().format(offerParams.minWage),
        },
        {
          name: 'year1Hourly',
          value: rateFormatter().format(offerParams.year1Salary / 2080),
        },
        {
          name: 'year2Hourly',
          value: rateFormatter().format(offerParams.year2Salary / 2080),
        },
        {
          name: 'year1Salary',
          value: salaryFormatter().format(offerParams.year1Salary),
        },
        {
          name: 'year2Salary',
          value: salaryFormatter().format(offerParams.year2Salary),
        },
        {
          name: 'expirationDate',
          value: new Date(offerParams.expirationDate).toLocaleDateString('en-US'),
        },
      ],
      metadata: { consultantId: offerParams.consultantId, type: 'OFFER_LETTER' },
    },
  };

  await pDoc.createDocument(body);
};

export const sendDocument = async (documentId: string, docParams: { subject: string; message: string }) => {
  const pDoc = new DocumentsApi(await getPandaDocConfig());
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

export const downloadSignedDocument = async (documentId: string) => {
  const pDoc = new DocumentsApi(await getPandaDocConfig());
  const body: DocumentsApiDownloadDocumentRequest = {
    id: documentId,
  };
  return await pDoc.downloadDocument(body);
};
