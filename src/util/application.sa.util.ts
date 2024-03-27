export interface SAApplicationStatus {
  status: string;
  rejectionReason?: string;
}

export const deriveSAApplicationStatus = (statusReason: string): SAApplicationStatus => {
  const shortStatus = statusReason?.split('-')[0];
  const reason = statusReason?.split('-')[1];
  const statusMap = {
    R: 'Rejected',
  };
  return {
    status: statusMap[shortStatus] ?? statusReason,
    ...(shortStatus === 'R' && { rejectionReason: reason }),
  };
};
