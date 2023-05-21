import axios from 'axios';
import { HSDeal, HubspotEvent } from '../model/Hubspot';
import { getHubspotSecrets, getTextusSecrets } from './secrets.service';
import { getSFDCConnection } from './auth/sfdc.auth.service';
import { TEXTS } from '../constants/texts';
import { sendText } from './sms.service';
import { fetchApplication } from './application.service';
import { Application } from '../model/Application';
import { findAssignmentGroupMemberByUserId } from './assigmentGroup.service';

const BASE_URL = 'https://api.hubapi.com/crm/v3';

export const processHubspotEvent = async (event: HubspotEvent) => {
  if (event.propertyValue === 'Pending') {
    const { ACCESS_TOKEN: HS_ACCESS_TOKEN } = await getHubspotSecrets();
    const { ACCESS_TOKEN: TU_ACCESS_TOKEN } = await getTextusSecrets();
    const conn = await getSFDCConnection();
    const deal = await fetchDeal(HS_ACCESS_TOKEN, event.objectId);
    const application = await fetchApplication(conn, deal.properties.hs_salesforceopportunityid);
    const { Calendar_Link__c } = await findAssignmentGroupMemberByUserId(conn, application.Candidate__r.Owner.Id);
    const textMsg = prepTextMessage(TEXTS[event.propertyName], application, Calendar_Link__c);
    await sendText(
      TU_ACCESS_TOKEN,
      application.Candidate__r.Owner.Email,
      application.Candidate__r.MobilePhone,
      textMsg
    );
  }
};

const fetchDeal = async (token: string, dealId: number): Promise<HSDeal> => {
  const { data } = await axios.get(`${BASE_URL}/objects/deals/${dealId}?properties=hs_salesforceopportunityid`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return data;
};

const prepTextMessage = (msg: string, application: Application, hubspotCalLink: string) => {
  const vars = {
    '%FIRSTNAME%': application.Candidate__r.FirstName,
    '%OWNERFIRSTNAME%': application.Candidate__r.Owner.FirstName,
    '%CHALLENGE_SCHEDULING_LINK%': application.Challenge_Scheduling_Link__c,
    '%CHALLENGE_LINK%': application.Challenge_Link__c,
    '%CHALLENGE_DATE%': application.Challenge_Date_Time__c,
    '%WEBINAR_SCHEDULING_LINK%': application.Webinar_Scheduling_Link__c,
    '%HUBSPOT_CALENDAR_LINK%': hubspotCalLink,
  };

  return Object.keys(vars).reduce((acc, v) => {
    return acc.replaceAll(v, vars[v]);
  }, msg);
};
