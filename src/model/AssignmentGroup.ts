import { Owner } from './Owner';
import { Fields$Assignment_Group_Member__c, Fields$Assignment_Group__c } from './smoothstack.schema';

export interface AssignmentGroup extends Fields$Assignment_Group__c {
  Assignment_Group_Members__r: { records: Assignment_Group_Member[] };
}

interface Assignment_Group_Member extends Fields$Assignment_Group_Member__c {
  User__r: Owner;
}
