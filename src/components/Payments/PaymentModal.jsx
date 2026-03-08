import React, { useState, useEffect } from 'react';
import { X, CreditCard, CheckCircle, XCircle, Loader } from 'lucide-react';
import { paymentAPI } from '../../services/paymentApi';
import { loadRazorpay, initializeRazorpay } from '../../utils/razorpayUtils';
import LoadingSpinner from '../ui/LoadingSpinner';
import Toast from '../ui/Toast';

const PaymentModal = ({ 
  isOpen, 
  onClose, 
  booking, 
  amount, 
  onPaymentSuccess,
  onPaymentFailure 
}) => {
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  

  useEffect(() => {
    if (isOpen) {
      loadRazorpay();
    }
  }, [isOpen]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 5000);
  };

  const handlePayment = async () => {
    if (!booking || !amount) {
      showToast('Invalid booking details', 'error');
      return;
    }

    setLoading(true);

    try {
      // Create Razorpay order
      const orderResponse = await paymentAPI.createOrder({
        bookingId: booking._id,
        amount: amount,
        userEmail: booking.email,
        userPhone: booking.phone
      });

      if (!orderResponse.data.success) {
        throw new Error(orderResponse.data.error);
      }

      const { order, key, payment } = orderResponse.data;

      // Initialize Razorpay checkout
      const razorpayOptions = {
        key,
        amount: order.amount,
        currency: order.currency,
        order_id: order.id,
        name: 'Resort Booking System',
        description: `Payment for booking at ${booking.location?.name}`,
        prefill: {
          name: booking.name,
          email: booking.email || '',
          contact: booking.phone
        },
        notes: {
          bookingId: booking._id,
          guestName: booking.name
        },
        handler: async (response) => {
          setProcessing(true);
          
          try {
            // Verify payment
            const verifyResponse = await paymentAPI.verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              bookingId: booking._id
            });

            if (verifyResponse.data.success) {
              showToast('Payment completed successfully!', 'success');
              onPaymentSuccess(verifyResponse.data);
            } else {
              throw new Error(verifyResponse.data.error);
            }
          } catch (error) {
            console.error('Payment verification failed:', error);
            showToast('Payment verification failed', 'error');
            onPaymentFailure(error.message);
          } finally {
            setProcessing(false);
          }
        },
        onDismiss: () => {
          console.log('Payment modal dismissed');
          setLoading(false);
        }
      };

      const razorpay = initializeRazorpay(razorpayOptions);
      razorpay.open();

    } catch (error) {
      console.error('Payment initialization failed:', error);
      showToast('Failed to initialize payment', 'error');
      onPaymentFailure(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualClose = () => {
    if (!processing) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, show: false })} 
        />
      )}
      
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={handleManualClose} />
        
        <div className="relative inline-block w-full max-w-md p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <CreditCard className="w-6 h-6 text-blue-600 mr-2" />
              <h3 className="text-lg font-semibold text-gray-900">
                Complete Payment
              </h3>
            </div>
            <button
              onClick={handleManualClose}
              disabled={processing}
              className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Booking Summary */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Booking Summary</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Guest:</span>
                <span className="font-medium">{booking.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Location:</span>
                <span className="font-medium">{booking.location?.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Dates:</span>
                <span className="font-medium">
                  {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="font-medium">Total Amount:</span>
                <span className="text-lg font-bold text-blue-600">
                  ₹{amount?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="mb-6">
            <h4 className="font-medium text-gray-900 mb-3">Payment Method</h4>
            <div className="p-4 border-2 border-blue-500 rounded-lg bg-blue-50">
              <div className="flex items-center">
                <CreditCard className="w-5 h-5 text-blue-600 mr-3" />
                <div>
                  <p className="font-medium text-gray-900">Razorpay</p>
                  <p className="text-sm text-gray-600">
                    Credit/Debit Cards, UPI, Net Banking, Wallets
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Notice */}
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg mb-6">
            <div className="flex items-start">
              <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 shrink-0" />
              <p className="text-xs text-green-800">
                <strong>Secure Payment:</strong> Your payment information is encrypted and secure. 
                We do not store your card details.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={handleManualClose}
              disabled={processing}
              className="flex-1 py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={loading || processing}
              className="flex-1 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {loading || processing ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  {processing ? 'Processing...' : 'Preparing...'}
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 mr-2" />
                  Pay ₹{amount?.toLocaleString()}
                </>
              )}
            </button>
          </div>

          {/* Processing Overlay */}
          {processing && (
            <div className="absolute inset-0 bg-white bg-opacity-90 rounded-2xl flex items-center justify-center">
              <div className="text-center">
                <LoadingSpinner size="lg" className="mb-3" />
                <p className="text-sm text-gray-600">Processing your payment...</p>
                <p className="text-xs text-gray-500 mt-1">Please don't close this window</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;