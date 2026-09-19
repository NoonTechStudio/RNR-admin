import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, CheckCircle, Loader2, CalendarX2 } from 'lucide-react';
import { bookingAPI } from '../../services/bookingApi';
import { CANCELLATION_TIERS } from '../../utils/cancellationPolicy';

const inr = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const formatDate = (iso) => {
  const d = new Date(iso);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()).toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
};

const formatTimeLeft = (hours) => {
  if (hours <= 0) return 'Check-in time has already passed';
  const days = Math.floor(hours / 24);
  const rem = Math.floor(hours % 24);
  if (days === 0) return `${rem} hour${rem !== 1 ? 's' : ''} before check-in`;
  return `${days} day${days !== 1 ? 's' : ''} ${rem} hr${rem !== 1 ? 's' : ''} before check-in`;
};

/**
 * Admin dialog: shows exactly what the cancellation policy refunds right now,
 * then cancels the booking (and refunds through Razorpay when possible).
 */
const CancelBookingModal = ({ booking, onClose, onCancelled }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [processOnlineRefund, setProcessOnlineRefund] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await bookingAPI.getCancellationPreview(booking._id);
        if (active) setPreview(res.data.data);
      } catch (err) {
        if (active) setError(err.response?.data?.error || 'Could not load the cancellation details');
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [booking._id]);

  const handleCancel = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await bookingAPI.cancelBooking(booking._id, { reason, processOnlineRefund });
      setResult(res.data);
      onCancelled?.(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel the booking');
    } finally {
      setSubmitting(false);
    }
  };

  const onlineWillRefund = processOnlineRefund ? preview?.onlineRefundable || 0 : 0;
  const manualDue = preview ? preview.refundAmount - onlineWillRefund : 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <CalendarX2 className="w-5 h-5 text-red-600" /> Cancel Booking
          </h3>
          <button onClick={onClose} disabled={submitting} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {loading && (
            <div className="flex justify-center py-10">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            </div>
          )}

          {!loading && error && !preview && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>
          )}

          {/* ---------- Result ---------- */}
          {result && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-green-700 font-semibold">
                <CheckCircle className="w-5 h-5" /> Booking cancelled
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
                <div className="flex justify-between"><span>Refund as per policy ({result.refund.refundPercent}%)</span><strong>{inr(result.refund.refundAmount)}</strong></div>
                <div className="flex justify-between"><span>Refunded online (Razorpay)</span><strong className="text-green-700">{inr(result.refund.refundedOnline)}</strong></div>
                {result.refund.manualRefundDue > 0 && (
                  <div className="flex justify-between text-orange-700"><span>To be refunded manually</span><strong>{inr(result.refund.manualRefundDue)}</strong></div>
                )}
                <div className="flex justify-between text-gray-500"><span>Amount retained</span><span>{inr(result.refund.retainedAmount)}</span></div>
              </div>
              {result.refund.warning && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">{result.refund.warning}</div>
              )}
              <p className="text-xs text-gray-500">The dates are released and the guest has been emailed (if an email was on file).</p>
              <button onClick={onClose} className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-700">Done</button>
            </div>
          )}

          {/* ---------- Preview ---------- */}
          {preview && !result && (
            <>
              <div className="bg-gray-50 rounded-lg p-4 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-600">Guest</span><strong>{preview.guestName}</strong></div>
                <div className="flex justify-between"><span className="text-gray-600">Location</span><strong>{preview.locationName}</strong></div>
                <div className="flex justify-between"><span className="text-gray-600">Check-in</span><strong>{formatDate(preview.checkInDate)} · {preview.checkInTime}</strong></div>
                <div className="flex justify-between"><span className="text-gray-600">Time left</span><strong>{formatTimeLeft(preview.hoursBeforeCheckIn)}</strong></div>
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2">Refund policy</p>
                <ul className="rounded-lg border border-gray-200 divide-y divide-gray-200 text-sm overflow-hidden">
                  {CANCELLATION_TIERS.map((tier) => {
                    const current = tier.refundPercent === preview.refundPercent;
                    return (
                      <li key={tier.label} className={`flex items-center justify-between px-3 py-2 ${current ? 'bg-blue-50 font-semibold' : ''}`}>
                        <span>{tier.label}{current && <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">applies now</span>}</span>
                        <span className={tier.refundPercent > 0 ? 'text-green-700' : 'text-red-700'}>{tier.refundPercent > 0 ? `${tier.refundPercent}%` : 'No refund'}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div className="rounded-lg border border-gray-200 p-4 text-sm space-y-1">
                <div className="flex justify-between"><span className="text-gray-600">Amount paid by guest</span><strong>{inr(preview.paidAmount)}</strong></div>
                <div className="flex justify-between"><span className="text-gray-600">Refund ({preview.refundPercent}%)</span><strong className="text-green-700 text-base">{inr(preview.refundAmount)}</strong></div>
                <div className="flex justify-between"><span className="text-gray-600">Amount retained</span><span>{inr(preview.retainedAmount)}</span></div>
              </div>

              {preview.paidAmount === 0 && (
                <p className="text-xs text-gray-500">No payment has been received for this booking, so there is nothing to refund.</p>
              )}

              {preview.onlineRefundable > 0 && (
                <label className="flex items-start gap-2 text-sm">
                  <input type="checkbox" checked={processOnlineRefund} onChange={(e) => setProcessOnlineRefund(e.target.checked)} className="mt-1" />
                  <span>Refund <strong>{inr(preview.onlineRefundable)}</strong> automatically to the guest's original payment method (Razorpay)</span>
                </label>
              )}
              {manualDue > 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-sm text-orange-800">
                  <strong>{inr(manualDue)}</strong> must be returned to the guest by your team (cash / manual payment / online refund skipped).
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
                <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} placeholder="e.g. Guest requested cancellation by phone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none" />
              </div>

              <label className="flex items-start gap-2 text-sm text-red-700">
                <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-1" />
                <span>I understand this cancels the booking, releases its dates and cannot be undone.</span>
              </label>

              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
                </div>
              )}

              <div className="flex gap-3 pt-1">
                <button onClick={onClose} disabled={submitting} className="flex-1 bg-gray-100 text-gray-700 font-medium py-2.5 rounded-xl hover:bg-gray-200">Keep booking</button>
                <button onClick={handleCancel} disabled={!confirmed || submitting}
                  className="flex-1 bg-red-600 text-white font-semibold py-2.5 rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Cancelling…</> : `Cancel & refund ${inr(preview.refundAmount)}`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CancelBookingModal;
