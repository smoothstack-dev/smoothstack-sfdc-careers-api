export const sendOffer = async (consultantId: string, offerType: 'RELO' | 'NO-RELO') => {
  return `Successfully sent ${offerType} offer to consultant with id: ${consultantId}`;
};
