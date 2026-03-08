export const loadRazorpay = () => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => {
      resolve(true);
    };
    script.onerror = () => {
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export const initializeRazorpay = (options) => {
  return new window.Razorpay({
    key: process.env.VITE_RAZORPAY_KEY_ID || options.key,
    amount: options.amount,
    currency: options.currency,
    name: options.name || 'Resort Booking',
    description: options.description || 'Booking Payment',
    order_id: options.order_id,
    handler: options.handler,
    prefill: {
      name: options.prefill?.name || '',
      email: options.prefill?.email || '',
      contact: options.prefill?.contact || ''
    },
    notes: options.notes || {},
    theme: {
      color: '#2563eb'
    },
    modal: {
      ondismiss: options.onDismiss || (() => console.log('Payment modal closed')),
      escape: true,
      handleback: true
    }
  });
};