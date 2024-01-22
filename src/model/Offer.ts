export interface OfferParams {
  consultantId: string;
  offerType: 'RELO' | 'NO-RELO';
  startDate: string;
  reportsTo: string;
  expirationDate: string;
  year1Salary: number;
  year2Salary: number;
  minWage: number;
}

export const isSPOffer = (consulantState: string): boolean => {
  return ['CA', 'CO', 'MN', 'OK', 'ND'].includes(consulantState);
};
