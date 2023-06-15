export interface ApplicationStatus {
  stageName: string;
  rejectionReason?: string;
  snoozeReason?: string;
}

export const deriveApplicationStatus = (status: string): ApplicationStatus => {
  const shortStatus = status?.split('-')[0];
  const reason = status?.split('-')[1];
  const statusMap = {
    R: 'Rejected',
    S: 'Snooze',
  };
  return {
    stageName: statusMap[shortStatus] ?? status,
    ...(shortStatus === 'S' && { snoozeReason: reason }),
    ...(shortStatus === 'R' && { rejectionReason: reason }),
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
