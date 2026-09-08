import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { Plus, Trash2, Pencil, Tag, AlertCircle, CheckCircle2 } from "lucide-react";
import { getAllCoupons, deleteCoupon, updateCoupon } from "../../services/couponApi";

export default function GetCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [togglingId, setTogglingId] = useState(null);

  const navigate = useNavigate();

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const res = await getAllCoupons();
      setCoupons(res.data || []);
    } catch (error) {
      console.error("Error fetching coupons:", error);
      toast.error(error.response?.data?.error || "Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleDelete = async () => {
    try {
      await deleteCoupon(selectedId);
      toast.success("Coupon deleted");
      setShowDeleteModal(false);
      setSelectedId(null);
      fetchCoupons();
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to delete coupon");
    }
  };

  const handleToggle = async (coupon) => {
    try {
      setTogglingId(coupon._id);
      await updateCoupon(coupon._id, { isActive: !coupon.isActive });
      setCoupons((prev) =>
        prev.map((c) => (c._id === coupon._id ? { ...c, isActive: !c.isActive } : c))
      );
      toast.success(`Coupon ${!coupon.isActive ? "activated" : "deactivated"}`);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to update coupon");
    } finally {
      setTogglingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" />

      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Discount Coupons</h1>
          <p className="text-gray-600">
            Create percentage-discount codes to share privately with specific customers.
            A coupon cannot be combined with an active Offer.
          </p>
        </div>
        <button
          onClick={() => navigate("/admin/coupons/create")}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
        >
          <Plus size={20} />
          Create Coupon
        </button>
      </div>

      {coupons.length === 0 ? (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600 text-lg">No coupons yet</p>
          <button
            onClick={() => navigate("/admin/coupons/create")}
            className="mt-4 inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
          >
            <Plus size={18} />
            Create your first coupon
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-6 py-3 font-semibold">Code</th>
                <th className="px-6 py-3 font-semibold">Discount</th>
                <th className="px-6 py-3 font-semibold">Description</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map((coupon) => (
                <tr key={coupon._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-2 font-mono font-bold text-gray-800">
                      <Tag size={14} className="text-blue-600" />
                      {coupon.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-semibold text-green-600">
                    {coupon.discountPercent}% off
                  </td>
                  <td className="px-6 py-4 text-gray-600">{coupon.description || "—"}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleToggle(coupon)}
                      disabled={togglingId === coupon._id}
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        coupon.isActive
                          ? "bg-green-100 text-green-800 hover:bg-green-200"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {coupon.isActive ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                      {coupon.isActive ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => navigate(`/admin/coupons/edit/${coupon._id}`)}
                        className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-xs"
                      >
                        <Pencil size={14} />
                        Edit
                      </button>
                      <button
                        onClick={() => {
                          setSelectedId(coupon._id);
                          setShowDeleteModal(true);
                        }}
                        className="flex items-center gap-1 bg-red-600 text-white px-3 py-1.5 rounded-lg hover:bg-red-700 transition-colors font-semibold text-xs"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Delete Coupon?</h3>
            <p className="text-gray-600 mb-6">
              Existing bookings that already used this coupon keep their discount.
              This only removes the code for future use.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors font-semibold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
