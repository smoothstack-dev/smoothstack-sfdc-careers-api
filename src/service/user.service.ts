import { Connection } from 'jsforce';
import { Fields$User, SmoothstackSchema } from '../model/smoothstack.schema';

export const fetchUser = async (conn: Connection<SmoothstackSchema>, userId: string): Promise<Fields$User> => {
  return await conn.sobject('User').findOne({ Id: { $eq: userId ?? null } });
};

export const findUserByEmail = async (conn: Connection<SmoothstackSchema>, email: string): Promise<Fields$User> => {
  return await conn.sobject('User').findOne({
    Email: { $eq: email ?? null },
  });
};
