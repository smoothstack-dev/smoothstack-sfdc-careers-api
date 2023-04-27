export const toTitleCase = (str: string) => {
  return str.toLowerCase().replace(/\b(\w)/g, (s) => s.toUpperCase());
};

export const salaryFormatter = () => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};
