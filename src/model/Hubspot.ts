export interface HubspotEvent {
  eventId: number;
  subscriptionId: number;
  portalId: number;
  appId: number;
  occurredAt: number;
  subscriptionType: string;
  attemptNumber: number;
  objectId: number;
  propertyName: string;
  propertyValue: string;
  changeSource: string;
  sourceId: string;
}

export interface HSDeal {
  id: string;
  properties: { hs_salesforceopportunityid: string };
  associations: {
    contacts: {
      results: {
        id: string;
        type: string;
      }[];
    };
  };
}
