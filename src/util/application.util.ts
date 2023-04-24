export interface ApplicationStatus {
  stageName: string;
  rejectionReason?: string;
}

export const deriveApplicationStatus = (status: string): ApplicationStatus => {
  const shortStatus = status?.split('-')[0];
  const rejectionReason = status?.split('-')[1];
  return {
    stageName: shortStatus === 'R' ? 'Rejected' : status,
    rejectionReason,
  };
};

export const deriveApplicationStatusTS = (screenerRecommendation: string): ApplicationStatus => {
  const screenerDetermination = screenerRecommendation?.split('-')[0];
  const determinationReason = screenerRecommendation?.split('-')[1];
  switch (screenerDetermination) {
    case 'Fail':
      return { stageName: 'Rejected', rejectionReason: determinationReason };
    case 'Pass':
      return { stageName: 'Tech Screen Passed' };
    default:
      return undefined;
  }
};
