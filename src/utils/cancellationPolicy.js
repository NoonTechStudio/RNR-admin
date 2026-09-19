// Cancellation & refund policy for LOCATION bookings.
// Keep in sync with RNR-backend/utils/cancellationPolicy.js (the backend is the
// source of truth for the actual refund calculation).

export const CANCELLATION_TIERS = [
  { label: '7 days or more before check-in', refundPercent: 100 },
  { label: '3 days to less than 7 days before check-in', refundPercent: 50 },
  { label: '48 hours to less than 3 days before check-in', refundPercent: 25 },
  { label: 'Less than 48 hours before check-in', refundPercent: 0 },
];
