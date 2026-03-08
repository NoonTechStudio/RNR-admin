import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  Star,
  User,
  MapPin,
  Calendar,
  ThumbsUp,
  Trash2,
  Pencil,
  Plus,
  Filter,
  Search,
  Menu,
  X,
} from "lucide-react";

export default function GetReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState([]);
  const [filters, setFilters] = useState({
    location: "",
    rating: "",
    search: ""
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;

  const fetchReviews = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.location) queryParams.append('location', filters.location);
      if (filters.rating) queryParams.append('rating', filters.rating);
      
      const res = await fetch(`${API_BASE_URL}/reviews?${queryParams}`);
      if (!res.ok) throw new Error("Failed to fetch reviews");
      const data = await res.json();
      setReviews(data.reviews || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocations = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/locations`);
      if (!res.ok) throw new Error("Failed to fetch locations");
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      console.error("Error fetching locations:", err);
    }
  };

  const showDeleteConfirmation = (reviewId, reviewTitle) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex flex-col sm:flex-row ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Delete Review
              </p>
              <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                Are you sure you want to delete "{reviewTitle}"? This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-t sm:border-t-0 sm:border-l border-gray-200">
          <button
            onClick={() => {
              handleDelete(reviewId);
              toast.dismiss(t.id);
            }}
            className="flex-1 border border-transparent rounded-none p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Yes
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              toast.error("Deletion cancelled");
            }}
            className="flex-1 border border-transparent rounded-none p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            No
          </button>
        </div>
      </div>
    ));
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/reviews/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete");
      toast.success("Review deleted successfully!");
      setReviews((prev) => prev.filter((r) => r._id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDeleteClick = (reviewId, reviewTitle) => {
    showDeleteConfirmation(reviewId, reviewTitle);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    // Close mobile filters on change for better UX
    if (window.innerWidth < 768) {
      setShowMobileFilters(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      location: "",
      rating: "",
      search: ""
    });
  };

  useEffect(() => {
    fetchReviews();
    fetchLocations();
  }, [filters]);

  const filteredReviews = reviews.filter(review => {
    if (!filters.search) return true;
    
    const searchTerm = filters.search.toLowerCase();
    return (
      review.guestName.toLowerCase().includes(searchTerm) ||
      review.title.toLowerCase().includes(searchTerm) ||
      review.reviewText.toLowerCase().includes(searchTerm) ||
      (review.location?.name && review.location.name.toLowerCase().includes(searchTerm))
    );
  });

  const StarRating = ({ rating }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`${
              star <= rating
                ? "text-yellow-400 fill-current"
                : "text-gray-300"
            } w-3 h-3 sm:w-4 sm:h-4`}
          />
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <p className="text-gray-600 text-lg font-medium animate-pulse">
          Loading reviews...
        </p>
      </div>
    );

  return (
    <div className="bg-gray-50 min-h-screen font-inter">
      <Toaster position="top-center sm:top-right" />
      
      {/* Mobile Filter Toggle */}
      <div className="md:hidden flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Star className="w-5 h-5 text-[#008DDA]" />
            Guest Reviews
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage guest feedback
          </p>
        </div>
        <button
          onClick={() => setShowMobileFilters(!showMobileFilters)}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm"
        >
          {showMobileFilters ? <X size={18} /> : <Filter size={18} />}
          <span className="text-sm">Filters</span>
        </button>
      </div>

      {/* Header */}
      <div className="hidden md:flex justify-between items-center mb-6 lg:mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Star className="w-6 h-6 lg:w-7 lg:h-7 text-[#008DDA]" />
            Guest Reviews
          </h1>
          <p className="text-gray-600 mt-1 lg:mt-2">
            Manage and monitor guest feedback and ratings
          </p>
        </div>
        <button
          onClick={() => navigate("/reviews/new")}
          className="flex items-center gap-2 bg-[#008DDA] text-white px-4 py-2 rounded-lg shadow hover:bg-[#0074b8] transition text-sm lg:text-base"
        >
          <Plus size={18} /> <span className="hidden sm:inline">New Review</span>
        </button>
      </div>

      {/* Filters - Mobile Overlay */}
      {showMobileFilters && (
        <div className="md:hidden fixed inset-0 bg-gray-900 bg-opacity-50 z-50">
          <div className="absolute right-0 top-0 h-full w-4/5 max-w-sm bg-white shadow-xl">
            <div className="p-4">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
                <button
                  onClick={() => setShowMobileFilters(false)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Mobile Filter Content */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Reviews
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Resort
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                  >
                    <option value="">All Resorts</option>
                    {locations.map((loc) => (
                      <option key={loc._id} value={loc._id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Rating
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={filters.rating}
                    onChange={(e) => handleFilterChange('rating', e.target.value)}
                  >
                    <option value="">All Ratings</option>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <option key={rating} value={rating}>
                        {rating} Star{rating > 1 ? 's' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4 border-t">
                  <button
                    onClick={clearFilters}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowMobileFilters(false)}
                    className="flex-1 px-4 py-2 bg-[#008DDA] text-white rounded-lg hover:bg-[#0074b8] transition"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters - Desktop */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm p-4 lg:p-6 mb-6 lg:mb-8 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Reviews
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name, title, or content..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                />
              </div>
            </div>

            {/* Location Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Resort
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
              >
                <option value="">All Resorts</option>
                {locations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Rating Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Rating
              </label>
              <select
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
              >
                <option value="">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </div>

          {/* Clear Filters */}
          <button
            onClick={clearFilters}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
          >
            <Filter size={16} />
            Clear
          </button>
        </div>
      </div>

      {/* Mobile New Review Button */}
      <div className="md:hidden flex justify-between items-center mb-4">
        <div>
          <p className="text-sm text-gray-600">
            {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => navigate("/reviews/new")}
          className="flex items-center gap-1 bg-[#008DDA] text-white px-3 py-2 rounded-lg shadow hover:bg-[#0074b8] transition text-sm"
        >
          <Plus size={16} /> New
        </button>
      </div>

      {/* Reviews Count - Desktop */}
      <div className="hidden md:block mb-6">
        <p className="text-gray-600">
          Showing {filteredReviews.length} review{filteredReviews.length !== 1 ? 's' : ''}
        </p>
      </div>

      {filteredReviews.length === 0 ? (
        <div className="text-center py-8 sm:py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Star className="w-12 h-12 sm:w-16 sm:h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-base sm:text-lg mb-2">No reviews found</p>
          <p className="text-gray-400 text-sm sm:text-base mb-6 px-4">
            {reviews.length === 0 ? "No reviews have been submitted yet." : "No reviews match your filters."}
          </p>
          <button
            onClick={() => navigate("/reviews/new")}
            className="bg-[#008DDA] text-white px-6 py-2 rounded-lg hover:bg-[#0074b8] transition text-sm sm:text-base"
          >
            Add First Review
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {filteredReviews.map((review) => (
            <div
              key={review._id}
              className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all p-4 sm:p-6"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 line-clamp-2">
                    {review.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="truncate">{review.guestName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>{formatDate(review.stayDate)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-yellow-50 px-2 sm:px-3 py-1 rounded-full w-fit">
                  <StarRating rating={review.rating} />
                  <span className="text-xs sm:text-sm font-semibold text-yellow-700 ml-1">
                    {review.rating}.0
                  </span>
                </div>
              </div>

              {/* Location */}
              {review.location && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-3">
                  <MapPin className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="font-medium truncate">{review.location.name}</span>
                </div>
              )}

              {/* Review Text */}
              <p className="text-gray-700 text-sm sm:text-base mb-4 line-clamp-3">
                {review.reviewText}
              </p>

              {/* Recommendation */}
              <div className="flex items-center gap-2 mb-4">
                {review.wouldRecommend ? (
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                    <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="font-medium">Recommends</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600 bg-red-50 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                    <ThumbsUp className="w-3 h-3 sm:w-4 sm:h-4 rotate-180" />
                    <span className="font-medium">Doesn't recommend</span>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Submitted on {formatDate(review.createdAt)}
                </div>
                <div className="flex gap-2 self-end sm:self-auto">
                  <button
                    onClick={() => navigate(`/reviews/edit/${review._id}`)}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-[#008DDA] text-white rounded-lg hover:bg-[#0074b8] transition"
                  >
                    <Pencil className="w-3 h-3 sm:w-4 sm:h-4" /> 
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(review._id, review.title)}
                    className="flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                  >
                    <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" /> 
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}