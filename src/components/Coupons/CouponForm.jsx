import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createCoupon, updateCoupon, getCouponById } from "../../services/couponApi";

const PRESET_PERCENTS = [10, 20, 25];

export default function CouponForm() {
  const navigate = useNavigate();
  const { couponId } = useParams();
  const isEditMode = !!couponId;

  const [loading, setLoading] = useState(isEditMode);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discountPercent: 10,
    description: "",
    isActive: true,
  });

  useEffect(() => {
    if (!isEditMode) return;
    (async () => {
      try {
        const res = await getCouponById(couponId);
        const c = res.data;
        setForm({
          code: c.code || "",
          discountPercent: c.discountPercent || 10,
          description: c.description || "",
          isActive: c.isActive !== false,
        });
      } catch (error) {
        toast.error(error.response?.data?.error || "Failed to load coupon");
        navigate("/admin/coupons");
      } finally {
        setLoading(false);
      }
    })();
  }, [couponId, isEditMode, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const code = form.code.trim().toUpperCase();
    const pct = Number(form.discountPercent);

    if (!code) return toast.error("Coupon code is required");
    if (Number.isNaN(pct) || pct < 1 || pct > 100)
      return toast.error("Discount must be between 1 and 100");

    setSubmitting(true);
    try {
      const payload = {
        code,
        discountPercent: pct,
        description: form.description.trim(),
        isActive: form.isActive,
      };
      if (isEditMode) {
        await updateCoupon(couponId, payload);
        toast.success("Coupon updated");
      } else {
        await createCoupon(payload);
        toast.success("Coupon created");
      }
      navigate("/admin/coupons");
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to save coupon");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <Toaster position="top-right" />

      <div className="mb-4 flex items-center gap-4">
        <button
          onClick={() => navigate("/admin/coupons")}
          className="p-2 hover:bg-gray-200 rounded-full"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">
          {isEditMode ? "Edit Coupon" : "Create Coupon"}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-md p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code *</label>
          <input
            type="text"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="e.g. FAMILY10"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg font-mono uppercase tracking-wide"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Customers type this code in the booking screen to get the discount.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Discount Percentage *</label>
          <div className="flex gap-2 mb-2">
            {PRESET_PERCENTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setForm({ ...form, discountPercent: p })}
                className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                  Number(form.discountPercent) === p
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                }`}
              >
                {p}% off
              </button>
            ))}
          </div>
          <input
            type="number"
            min="1"
            max="100"
            value={form.discountPercent}
            onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
            placeholder="Internal note, e.g. 'For relatives / referrals'"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
          />
        </div>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            className="rounded"
          />
          <span className="text-sm text-gray-700">Active (can be used right now)</span>
        </label>

        <div className="pt-2 flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {isEditMode ? "Save Changes" : "Create Coupon"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/coupons")}
            className="px-6 bg-gray-100 text-gray-700 font-medium py-3 rounded-xl hover:bg-gray-200"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
