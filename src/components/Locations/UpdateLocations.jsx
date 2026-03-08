// src/pages/UpdateLocation.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

export default function UpdateLocation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLocation = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/locations/${id}`);
      if (!res.ok) throw new Error("Failed to fetch location details");
      const data = await res.json();
      setFormData(data);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("address.")) {
      const key = name.split(".")[1];
      setFormData({
        ...formData,
        address: { ...formData.address, [key]: value },
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`http://localhost:5000/api/locations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("Failed to update location");
      toast.success("Location updated successfully!");
      setTimeout(() => navigate("/locations"), 1500);
    } catch (err) {
      toast.error(err.message);
    }
  };

  useEffect(() => {
    fetchLocation();
  }, [id]);

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-600">Loading location data...</p>
      </div>
    );

  if (!formData)
    return (
      <div className="text-center text-gray-600 mt-10">
        No location data found.
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white shadow-lg rounded-xl mt-10 border">
      <Toaster position="top-right" />
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        ✏️ Update Location
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-600">
            Name
          </label>
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Address Line 1
          </label>
          <input
            name="address.line1"
            value={formData.address?.line1 || ""}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            City
          </label>
          <input
            name="address.city"
            value={formData.address?.city || ""}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="4"
            className="w-full border rounded-lg px-3 py-2"
          />
        </div>

        <button
          type="submit"
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg mt-4"
        >
          Update Location
        </button>
      </form>
    </div>
  );
}
