import { Connection } from 'jsforce';
import { SmoothstackSchema } from '../model/smoothstack.schema';
import { Fields$Assignment_Group_Member__c } from '../model/smoothstack.schema';
import { AssignmentGroup } from '../model/AssignmentGroup';

const HTD_GROUP_ID = 'a1W5G00000GkiysUAB';

export const findHTDAssignmentGroupMemberByUserId = async (
  conn: Connection<SmoothstackSchema>,
  userId: string
): Promise<Fields$Assignment_Group_Member__c> => {
  return await conn.sobject('Assignment_Group_Member__c').findOne({
    User__c: { $eq: userId },
    $and: { Assignment_Group__c: HTD_GROUP_ID },
  });
};

export const fetchHTDAssignmentGroup = async (conn: Connection<SmoothstackSchema>): Promise<AssignmentGroup> => {
  return await conn
    .sobject('Assignment_Group__c')
    .findOne({ Id: HTD_GROUP_ID })
    .include('Assignment_Group_Members__r')
    .select('User__r.*')
    .end();
};
