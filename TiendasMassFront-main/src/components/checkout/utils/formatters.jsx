// utils/formatters.js
export const formatCurrency = (amount, currency = 'PEN') => {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(amount);
};

export const formatPrice = (price) => {
  return formatCurrency(price);
};

export const formatCardNumber = (cardNumber) => {
  const cleaned = cardNumber.replace(/\s+/g, '');
  const match = cleaned.match(/.{1,4}/g);
  return match ? match.join(' ') : cleaned;
};

export const formatExpiryDate = (expiry) => {
  if (!expiry) return '';
  const [month, year] = expiry.split('/');
  return `${month}/${year}`;
};