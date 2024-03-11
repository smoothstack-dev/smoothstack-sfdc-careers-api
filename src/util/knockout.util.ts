import { Knockout, KnockoutFields, KnockoutRequirements } from '../model/Knockout';
import { calculateMonthsToGrad, hasMinDegree, hasMinYearsOfExperience, hasRecentApplication } from './apply.util';

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
    selfRank,
    existingApplications,
    physicalRequirements,
  } = fields;
  const monthsToGraduation = graduationDate ? calculateMonthsToGrad(new Date(graduationDate)) : 0;
  if (hasRecentApplication(existingApplications)) {
    return Knockout.RECENTLY_APPLIED;
  }
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
  if (selfRank < minSelfRank) {
    return Knockout.SELF_RANK;
  }
  if (physicalRequirements === 'No') {
    return Knockout.PHYSICAL_REQS;
  }
  return Knockout.PASS;
};
