// components/Admin/AdminPaymentModal.jsx
import React, { useState } from 'react';
import { X, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../ui/LoadingSpinner';
import Toast from '../ui/Toast';
import { paymentAPI } from '../../services/paymentApi';

const AdminPaymentModal = ({
  isOpen,
  onClose,
  booking,
  amount,
  onPaymentSuccess,
  onPaymentFailure,
  isAuthenticated
}) => {
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('manual');
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 5000);
  };

  const handleProcessPayment = async () => {
    if (!isAuthenticated) {
      showToast('Please login to process payments', 'error');
      return;
    }

    if (!booking?._id) {
      showToast('No booking selected', 'error');
      return;
    }

    setLoading(true);

    try {
      console.log('🔄 Processing admin payment...');
      
      let result;
      if (paymentMethod === 'manual') {
        result = await paymentAPI.markAsPaid({
          bookingId: booking._id,
          notes: notes || 'Marked as paid by admin'
        });
      } else {
        result = await paymentAPI.processAdminPayment({
          bookingId: booking._id,
          amount: amount,
          paymentMethod: paymentMethod,
          notes: notes
        });
      }

      if (result.data.success) {
        showToast('Payment processed successfully!', 'success');
        onPaymentSuccess(result.data);
        onClose();
      } else {
        throw new Error(result.data.error || 'Payment failed');
      }
    } catch (error) {
      console.error('❌ Admin payment error:', error);
      
      if (error.response?.status === 401) {
        showToast('Session expired. Please login again.', 'error');
        onPaymentFailure('Authentication failed');
      } else {
        showToast(error.response?.data?.error || error.message, 'error');
        onPaymentFailure(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      {toast.show && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast({ ...toast, show: false })} 
        />
      )}
      
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <CreditCard className="w-6 h-6 text-blue-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900">
              Process Payment
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Auth Warning */}
          {!isAuthenticated && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center">
                <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
                <span className="text-red-800 text-sm">
                  Please login to process payments
                </span>
              </div>
            </div>
          )}

          {/* Booking Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Booking Details</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <p><strong>Guest:</strong> {booking?.name}</p>
              <p><strong>Phone:</strong> {booking?.phone}</p>
              <p><strong>Location:</strong> {booking?.location?.name}</p>
              <div className="flex items-center justify-between pt-2 border-t border-gray-200 mt-2">
                <span className="font-semibold">Amount:</span>
                <span className="text-lg font-bold text-blue-600">
                  ₹{amount?.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="manual"
                  checked={paymentMethod === 'manual'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                  disabled={!isAuthenticated}
                />
                <span className="ml-2 text-sm text-gray-700">Mark as Paid (Manual)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                  disabled={!isAuthenticated}
                />
                <span className="ml-2 text-sm text-gray-700">Cash Payment</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="bank_transfer"
                  checked={paymentMethod === 'bank_transfer'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-blue-600 focus:ring-blue-500"
                  disabled={!isAuthenticated}
                />
                <span className="ml-2 text-sm text-gray-700">Bank Transfer</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Add any payment notes..."
              disabled={!isAuthenticated}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleProcessPayment}
            disabled={loading || !isAuthenticated}
            className="flex-1 py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {loading ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                {isAuthenticated ? 'Process Payment' : 'Login Required'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPaymentModal;