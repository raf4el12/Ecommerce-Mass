// utils/paymentStatus.js
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
  EXPIRED: 'expired'
};

export const determinePaymentStatus = (mpStatus) => {
  switch (mpStatus) {
    case 'approved':
      return PAYMENT_STATUS.APPROVED;
    case 'rejected':
    case 'cancelled':
      return PAYMENT_STATUS.REJECTED;
    case 'pending':
    case 'in_process':
      return PAYMENT_STATUS.PENDING;
    case 'expired':
      return PAYMENT_STATUS.EXPIRED;
    default:
      return PAYMENT_STATUS.PENDING;
  }
};

export const isPaymentSuccessful = (status) => {
  return status === PAYMENT_STATUS.APPROVED;
};

export const isPaymentFailed = (status) => {
  return [PAYMENT_STATUS.REJECTED, PAYMENT_STATUS.CANCELLED, PAYMENT_STATUS.EXPIRED].includes(status);
};