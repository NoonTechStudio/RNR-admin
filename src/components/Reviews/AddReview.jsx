import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const AddReview = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState({
    location: "",
    guestName: "",
    email: "",
    rating: 0,
    title: "",
    reviewText: "",
    stayDate: "",
    wouldRecommend: true
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;

  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [imageFiles, setImageFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [existingVideo, setExistingVideo] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const isEditMode = Boolean(id);

  // Fetch locations on component mount
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/locations`);
        setLocations(res.data);
      } catch (err) {
        console.error("Error fetching locations:", err);
        toast.error("Failed to load locations");
      }
    };
    fetchLocations();
  }, []);

  // Fetch review data for editing
  useEffect(() => {
    if (isEditMode) {
      fetchReviewData();
    }
  }, [id]);

  const fetchReviewData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE_URL}/reviews/${id}`);
      const reviewData = res.data;
      
      // Transform the API data to match our form structure
      setForm({
        location: reviewData.location?._id || reviewData.location || "",
        guestName: reviewData.guestName || "",
        email: reviewData.email || "",
        rating: reviewData.rating || 0,
        title: reviewData.title || "",
        reviewText: reviewData.reviewText || "",
        stayDate: reviewData.stayDate ? new Date(reviewData.stayDate).toISOString().split('T')[0] : "",
        wouldRecommend: reviewData.wouldRecommend !== undefined ? reviewData.wouldRecommend : true
      });
      setYoutubeUrl(reviewData.youtubeUrl || "");
      setExistingImages(reviewData.images || []);
      setExistingVideo(reviewData.video || null);
      toast.success("Review data loaded successfully!");
    } catch (err) {
      toast.error("Error fetching review data: " + (err.response?.data?.error || "Please try again"));
      navigate("/reviews");
    } finally {
      setLoading(false);
    }
  };

  // Validation rules
  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case "guestName":
        if (!value.trim()) newErrors.guestName = "Guest name is required";
        else if (value.trim().length < 2) newErrors.guestName = "Name must be at least 2 characters";
        else delete newErrors.guestName;
        break;
      
      case "location":
        if (!value.trim()) newErrors.location = "Please select a resort";
        else delete newErrors.location;
        break;
      
      case "title":
        if (!value.trim()) newErrors.title = "Review title is required";
        else if (value.trim().length < 5) newErrors.title = "Title must be at least 5 characters";
        else delete newErrors.title;
        break;
      
      case "reviewText":
        if (!value.trim()) newErrors.reviewText = "Review text is required";
        else if (value.trim().length < 20) newErrors.reviewText = "Review must be at least 20 characters";
        else delete newErrors.reviewText;
        break;
      
      case "stayDate":
        if (!value) newErrors.stayDate = "Stay date is required";
        else {
          const stayDate = new Date(value);
          const today = new Date();
          if (stayDate > today) newErrors.stayDate = "Stay date cannot be in the future";
          else delete newErrors.stayDate;
        }
        break;
      
      case "rating":
        if (value < 1) newErrors.rating = "Please select a rating";
        else delete newErrors.rating;
        break;
      
      case "email":
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = "Please enter a valid email";
        } else {
          delete newErrors.email;
        }
        break;
      
      default:
        delete newErrors[name];
    }
    
    setErrors(newErrors);
  };

  // Update form fields
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === "checkbox" ? checked : value;
    
    setForm({ ...form, [name]: fieldValue });
    
    if (touched[name]) {
      validateField(name, fieldValue);
    }
  };

  // Handle rating with stars
  const handleRatingChange = (rating) => {
    setForm({ ...form, rating });
    if (touched.rating) {
      validateField("rating", rating);
    }
  };

  // Handle field blur
  const handleBlur = (fieldName) => {
    setTouched({ ...touched, [fieldName]: true });
    validateField(fieldName, form[fieldName]);
  };

  // Validate entire form before submission
  const validateForm = () => {
    const newErrors = {};
    
    // Required fields validation
    if (!form.guestName.trim()) newErrors.guestName = "Guest name is required";
    if (!form.location.trim()) newErrors.location = "Please select a resort";
    if (!form.title.trim()) newErrors.title = "Review title is required";
    if (!form.reviewText.trim()) newErrors.reviewText = "Review text is required";
    if (!form.stayDate) newErrors.stayDate = "Stay date is required";
    if (form.rating < 1) newErrors.rating = "Please select a rating";
    
    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (form.email && !emailRegex.test(form.email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    // Date validation
    if (form.stayDate) {
      const stayDate = new Date(form.stayDate);
      const today = new Date();
      if (stayDate > today) newErrors.stayDate = "Stay date cannot be in the future";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit with validation - handles both create and update
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Mark all fields as touched
    const allTouched = {};
    Object.keys(form).forEach(key => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    
    if (!validateForm()) {
      toast.error("Please fix the errors before submitting your review");
      return;
    }
    
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append("location", form.location);
      formData.append("guestName", form.guestName);
      formData.append("email", form.email || "");
      formData.append("rating", form.rating);
      formData.append("title", form.title);
      formData.append("reviewText", form.reviewText);
      formData.append("stayDate", form.stayDate);
      formData.append("wouldRecommend", form.wouldRecommend);
      formData.append("youtubeUrl", youtubeUrl);

      if (imageFiles && imageFiles.length > 0) {
        for (let i = 0; i < imageFiles.length; i++) {
          formData.append("images", imageFiles[i]);
        }
      }

      if (videoFile) {
        formData.append("video", videoFile);
      }

      if (isEditMode) {
        // Update existing review
        const res = await axios.put(`${API_BASE_URL}/reviews/${id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Review updated successfully!");
        console.log(res.data);
        navigate("/reviews");
      } else {
        // Create new review
        const res = await axios.post(`${API_BASE_URL}/reviews`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        toast.success("Review submitted successfully!");
        console.log(res.data);
        
        // Reset form after successful submission
        setForm({
          location: "",
          guestName: "",
          email: "",
          rating: 0,
          title: "",
          reviewText: "",
          stayDate: "",
          wouldRecommend: true
        });
        setYoutubeUrl("");
        setImageFiles([]);
        setVideoFile(null);
        setErrors({});
        setTouched({});
      }
      
    } catch (err) {
      toast.error("Error: " + (err.response?.data?.error || "Failed to submit review"));
    } finally {
      setSubmitting(false);
    }
  };

  // Helper to get error message
  const getError = (fieldName) => {
    return errors[fieldName];
  };

  // Star rating component
  const StarRating = ({ rating, onRatingChange, onHoverChange }) => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            className={`text-2xl transition-all duration-200 transform hover:scale-110 ${
              star <= (hoverRating || rating)
                ? "text-yellow-400 fill-current"
                : "text-gray-300"
            }`}
            onClick={() => onRatingChange(star)}
            onMouseEnter={() => onHoverChange(star)}
            onMouseLeave={() => onHoverChange(0)}
          >
            ★
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white lg:px-1 flex items-center justify-center">
        <Toaster position="top-right" />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading review data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-white lg:px-1">
      <Toaster position="top-right" />
      <div className="lg:px-2 mx-auto">
        <div className="text-left mb-6 mt-5 p-6 ">
          <div className="border-l-4 border-green-500 pl-6 py-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {isEditMode ? "Update Review" : "Share Your Experience"}
            </h1>
            <p className="text-gray-600 text-[14px]">
              {isEditMode ? "Update your review details" : "Help other travelers by sharing your resort experience"}
            </p>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8">
          <div className="grid md:grid-cols-2 gap-12 mb-8">
            {/* ================= LEFT COLUMN ================= */}
            <div className="space-y-8">
              {/* GUEST INFORMATION */}
              <section className="group">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-8 bg-linear-to-b from-green-500 to-emerald-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-800">Guest Information</h2>
                </div>
                <div className="space-y-5">
                  <div className="transform transition-all duration-200 hover:translate-x-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="guestName"
                      placeholder="Enter your full name"
                      className={`w-full border-2 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/20 hover:border-gray-300 transition-all duration-200 bg-white/50 shadow-sm ${
                        getError("guestName") ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-green-500"
                      }`}
                      value={form.guestName}
                      onChange={handleChange}
                      onBlur={() => handleBlur("guestName")}
                    />
                    {getError("guestName") && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <span>⚠</span> {getError("guestName")}
                      </p>
                    )}
                  </div>

                  <div className="transform transition-all duration-200 hover:translate-x-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Email Address
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email (optional)"
                      className={`w-full border-2 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/20 hover:border-gray-300 transition-all duration-200 bg-white/50 shadow-sm ${
                        getError("email") ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-green-500"
                      }`}
                      value={form.email}
                      onChange={handleChange}
                      onBlur={() => handleBlur("email")}
                    />
                    {getError("email") && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <span>⚠</span> {getError("email")}
                      </p>
                    )}
                  </div>

                  <div className="transform transition-all duration-200 hover:translate-x-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Resort Name *
                    </label>
                    <select
                      name="location"
                      className={`w-full border-2 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/20 hover:border-gray-300 transition-all duration-200 bg-white/50 shadow-sm ${
                        getError("location") ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-green-500"
                      }`}
                      value={form.location}
                      onChange={handleChange}
                      onBlur={() => handleBlur("location")}
                    >
                      <option value="">-- Choose a Resort --</option>
                      {locations.map((loc) => (
                        <option key={loc._id} value={loc._id}>
                          {loc.name}
                        </option>
                      ))}
                    </select>
                    {getError("location") && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <span>⚠</span> {getError("location")}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              {/* STAY DETAILS */}
              <section className="group">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-8 bg-linear-to-b from-green-500 to-emerald-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-800">Stay Details</h2>
                </div>
                <div className="space-y-5">
                  <div className="transform transition-all duration-200 hover:translate-x-1">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Date of Stay *
                    </label>
                    <input
                      type="date"
                      name="stayDate"
                      className={`w-full border-2 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/20 hover:border-gray-300 transition-all duration-200 bg-white/50 shadow-sm ${
                        getError("stayDate") ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-green-500"
                      }`}
                      value={form.stayDate}
                      onChange={handleChange}
                      onBlur={() => handleBlur("stayDate")}
                      max={new Date().toISOString().split('T')[0]}
                    />
                    {getError("stayDate") && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <span>⚠</span> {getError("stayDate")}
                      </p>
                    )}
                  </div>
                </div>
              </section>
            </div>

            {/* ================= RIGHT COLUMN ================= */}
            <div className="space-y-8">
              {/* RATING & REVIEW */}
              <section className="group">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-8 bg-linear-to-b from-green-500 to-emerald-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-800">Your Review</h2>
                </div>
                <div className="space-y-5">
                  <div className="transform transition-all duration-200 hover:translate-y-[-2px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Overall Rating *
                    </label>
                    <div className="flex items-center gap-4">
                      <StarRating
                        rating={form.rating}
                        onRatingChange={handleRatingChange}
                        onHoverChange={setHoverRating}
                      />
                      <span className="text-lg font-semibold text-gray-700">
                        {form.rating > 0 ? `${form.rating}.0` : "Select rating"}
                      </span>
                    </div>
                    {getError("rating") && (
                      <p className="text-red-500 text-xs mt-2 flex items-center gap-1">
                        <span>⚠</span> {getError("rating")}
                      </p>
                    )}
                  </div>

                  <div className="transform transition-all duration-200 hover:translate-y-[-2px]">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Review Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      placeholder="Summarize your experience in a few words"
                      className={`w-full border-2 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/20 hover:border-gray-300 transition-all duration-200 bg-white/50 shadow-sm ${
                        getError("title") ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-green-500"
                      }`}
                      value={form.title}
                      onChange={handleChange}
                      onBlur={() => handleBlur("title")}
                    />
                    {getError("title") && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <span>⚠</span> {getError("title")}
                      </p>
                    )}
                  </div>

                  <div className="transform transition-all duration-200 hover:translate-y-0.5">
                    <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                      Detailed Review *
                    </label>
                    <textarea
                      name="reviewText"
                      placeholder="Share your experience in detail - what you loved, what could be improved, and any memorable moments..."
                      className={`w-full border-2 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500/20 hover:border-gray-300 transition-all duration-200 bg-white/50 shadow-sm resize-none min-h-[120px] ${
                        getError("reviewText") ? "border-red-300 focus:border-red-500" : "border-gray-200 focus:border-green-500"
                      }`}
                      value={form.reviewText}
                      onChange={handleChange}
                      onBlur={() => handleBlur("reviewText")}
                    />
                    {getError("reviewText") && (
                      <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                        <span>⚠</span> {getError("reviewText")}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 mt-2">
                      {form.reviewText.length} characters (minimum 20 required)
                    </p>
                  </div>
                </div>
              </section>

              {/* MEDIA ATTACHMENTS (OPTIONAL) */}
              <section className="group">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1.5 h-8 bg-linear-to-b from-green-500 to-emerald-600 rounded-full"></div>
                  <h2 className="text-xl font-bold text-gray-800">Media Attachments (Optional)</h2>
                </div>
                <div className="space-y-5">
                  {/* Upload Images */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Upload Photos (JPG, PNG, WebP)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(e) => setImageFiles(Array.from(e.target.files))}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100 cursor-pointer"
                    />
                    {existingImages.length > 0 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto">
                        {existingImages.map((img, index) => (
                          <img key={index} src={img.url} alt="Review attachment" className="w-16 h-16 object-cover rounded-lg border" />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Upload Video */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Upload Video File (MP4, MOV, WebM)
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) => setVideoFile(e.target.files[0] || null)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 bg-white shadow-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                    />
                    {existingVideo?.url && (
                      <div className="mt-2 text-xs text-green-600 font-medium">
                        ✓ Existing Video Attached
                      </div>
                    )}
                  </div>

                  {/* YouTube Video Link */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      YouTube Video URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={youtubeUrl}
                      onChange={(e) => setYoutubeUrl(e.target.value)}
                      className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-green-500 bg-white shadow-sm"
                    />
                  </div>
                </div>
              </section>
            </div>
          </div>

          {/* ================= SUBMIT BUTTON ================= */}
          <div className="flex justify-end pt-8 border-t border-gray-100">
            <button
              type="submit"
              className="group relative bg-linear-to-r from-green-600 to-emerald-700 text-white px-12 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 hover:from-green-700 hover:to-emerald-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={submitting || Object.keys(errors).length > 0}
            >
              <span className="flex items-center gap-3">
                {submitting ? "Uploading & Saving..." : isEditMode ? "Update Review" : "Submit Review"}
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
    </>
  );
};

export default AddReview;