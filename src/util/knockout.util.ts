import { Knockout, KnockoutFields, KnockoutRequirements } from '../model/Knockout';
import { calculateMonthsToGrad, hasMinDegree, hasMinYearsOfExperience } from './apply.util';

export const calculateKnockout = (knockoutReqs: KnockoutRequirements, fields: KnockoutFields): Knockout => {
  const {
    requiredWorkAuthorization,
    jobLocation,
    maxMonthsToGraduation,
    minYearsOfExperience,
    minRequiredDegree,
    minSelfRank,
  } = knockoutReqs;
  const {
    workAuthorization,
    relocation,
    graduationDate,
    yearsOfExperience,
    educationDegree,
    degreeExpected,
    codingAbility,
  } = fields;
  const monthsToGraduation = graduationDate ? calculateMonthsToGrad(new Date(graduationDate)) : 0;
  if (!requiredWorkAuthorization.includes(workAuthorization)) {
    return Knockout.WORK_AUTH;
  }
  if (['Unknown', 'Onsite'].includes(jobLocation) && relocation === 'No') {
    return Knockout.RELOCATION;
  }
  if (maxMonthsToGraduation !== 'Not Specified' && monthsToGraduation > +maxMonthsToGraduation) {
    return Knockout.GRADUATION;
  }
  if (!hasMinYearsOfExperience(minYearsOfExperience, yearsOfExperience)) {
    return Knockout.YEARS_OF_EXP;
  }
  if (!hasMinDegree(minRequiredDegree, educationDegree ?? degreeExpected)) {
    return Knockout.DEGREE;
  }
  if (codingAbility < minSelfRank) {
    return Knockout.SELF_RANK;
  }
  return Knockout.PASS;
};
