import { Connection } from 'jsforce';
import { SmoothstackSchema } from '../model/smoothstack.schema';
import { Fields$Assignment_Group_Member__c } from '../model/smoothstack.schema';

export const findAssignmentGroupMemberByUserId = async (
  conn: Connection<SmoothstackSchema>,
  userId: string
): Promise<Fields$Assignment_Group_Member__c> => {
  return await conn.sobject('Assignment_Group_Member__c').findOne({
    User__c: { $eq: userId },
  });
};
