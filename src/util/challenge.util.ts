export const CHALLENGE_APP_STATUS = {
  Pass: 'Challenge Passed',
  Fail: 'R-Challenge Failed',
};

export const deriveChallengeResult = (score: any, passingScore: number) => {
  const numberScore = parseInt(score);
  if (!isNaN(numberScore)) {
    return numberScore >= passingScore ? 'Pass' : 'Fail';
  }
  return undefined;
};
