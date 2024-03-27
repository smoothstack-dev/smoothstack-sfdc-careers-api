import { Knockout } from '../model/Knockout';
import { SAKnockoutFields, SAKnockoutRequirements } from '../model/Knockout.sa';

export const calculateSAKnockout = (knockoutReqs: SAKnockoutRequirements, fields: SAKnockoutFields) => {
  const { requiredWorkAuthorization } = knockoutReqs;
  const { workAuthorization } = fields;
  if (!requiredWorkAuthorization.includes(workAuthorization)) {
    return Knockout.WORK_AUTH;
  }
  return Knockout.PASS;
};
