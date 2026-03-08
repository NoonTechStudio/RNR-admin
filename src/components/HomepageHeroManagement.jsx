import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";

const HomepageHeroManagement = () => {
  const [heroSets, setHeroSets] = useState([]);
  const [activeSet, setActiveSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;

  // Fetch all hero sets and active set
  const fetchHeroData = async () => {
    try {
      setLoading(true);
      const [setsResponse, activeResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}/homepage-hero`),
        axios.get(`${API_BASE_URL}/homepage-hero/active`)
      ]);
      
      setHeroSets(setsResponse.data.data || []);
      setActiveSet(activeResponse.data.data || null);
    } catch (error) {
      console.error("Error fetching hero data:", error);
      // If active set not found, it's okay
      if (error.response?.status !== 404) {
        toast.error("Error loading hero images");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeroData();
  }, []);

  const showDeleteConfirmation = (setId) => {
    toast.custom((t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-md w-full bg-white shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
      >
        <div className="flex-1 w-0 p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-gray-900">
                Delete Hero Set
              </p>
              <p className="mt-1 text-sm text-gray-500">
                Are you sure you want to delete this hero set? This action cannot be undone.
              </p>
            </div>
          </div>
        </div>
        <div className="flex border-l border-gray-200">
          <button
            onClick={() => {
              deleteSet(setId);
              toast.dismiss(t.id);
            }}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-red-600 hover:text-red-500 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Yes
          </button>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              toast.error("Deletion cancelled");
            }}
            className="w-full border border-transparent rounded-none rounded-r-lg p-4 flex items-center justify-center text-sm font-medium text-gray-600 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            No
          </button>
        </div>
      </div>
    ));
  };

  const activateSet = async (setId) => {
    try {
      await axios.put(`${API_BASE_URL}/homepage-hero/activate/${setId}`);
      await fetchHeroData(); // Refresh data
      toast.success("Hero set activated successfully!");
    } catch (error) {
      console.error("Error activating set:", error);
      toast.error("Error activating hero set");
    }
  };

  const deleteSet = async (setId) => {
    try {
      await axios.delete(`${API_BASE_URL}/homepage-hero/${setId}`);
      await fetchHeroData(); // Refresh data
      toast.success("Hero set deleted successfully!");
    } catch (error) {
      console.error("Error deleting set:", error);
      toast.error("Error deleting hero set");
    }
  };

  const handleDeleteClick = (setId) => {
    showDeleteConfirmation(setId);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Toaster position="top-right" />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading hero images...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Homepage Hero Images Management
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Manage the hero section images that appear on your homepage
          </p>
          
          <button
            onClick={() => setShowUploadForm(true)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload New Hero Set
          </button>
        </div>

        {/* Active Set Display */}
        {activeSet && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Currently Active Hero Set
            </h2>
            <div className="bg-white rounded-xl shadow-sm border border-green-200 p-6">
              <HeroSetPreview 
                heroSet={activeSet} 
                isActive={true}
                onActivate={activateSet}
                onDelete={handleDeleteClick}
                showActions={false}
              />
            </div>
          </div>
        )}

        {/* All Hero Sets */}
        <div>
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            All Hero Sets ({heroSets.length})
          </h2>
          
          {heroSets.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 text-lg mb-4">No hero sets found</p>
              <button
                onClick={() => setShowUploadForm(true)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upload First Hero Set
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {heroSets.map((heroSet) => (
                <HeroSetPreview
                  key={heroSet._id}
                  heroSet={heroSet}
                  isActive={activeSet?._id === heroSet._id}
                  onActivate={activateSet}
                  onDelete={handleDeleteClick}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </div>

        {/* Upload Form Modal */}
        {showUploadForm && (
          <UploadHeroForm
            onClose={() => setShowUploadForm(false)}
            onSuccess={() => {
              setShowUploadForm(false);
              fetchHeroData();
            }}
          />
        )}
      </div>
    </div>
  );
};

// Hero Set Preview Component
const HeroSetPreview = ({ heroSet, isActive, onActivate, onDelete, showActions }) => {
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle image loading errors
  const handleImageError = (e, imageUrl) => {
    console.error('Failed to load image:', imageUrl);
    e.target.onerror = null; // Prevent infinite loop
    e.target.style.display = 'none'; // Hide broken image
  };

  return (
    <motion.div
      className={`bg-white rounded-xl shadow-sm border overflow-hidden transition-all duration-200 hover:shadow-md ${
        isActive ? 'border-green-300 ring-2 ring-green-100' : 'border-gray-200'
      }`}
      whileHover={{ y: -2 }}
    >
      {/* Status Badge */}
      {isActive && (
        <div className="bg-green-500 text-white px-3 py-1 text-sm font-semibold text-center">
          ✅ Currently Active
        </div>
      )}

      {/* Images Preview */}
      <div className="p-4">
        <div className="grid grid-cols-3 gap-2 mb-4">
          {heroSet.images.slice(0, 3).map((image, index) => (
            <div key={image._id || index} className="aspect-4/3 rounded-lg overflow-hidden bg-gray-100">
              <img
                src={image.url} 
                alt={image.alt || `Hero image ${index + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => handleImageError(e, image.url)}
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {/* Set Info */}
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>Uploaded:</span>
            <span className="font-medium">{formatDate(heroSet.createdAt)}</span>
          </div>
          <div className="flex justify-between">
            <span>Images:</span>
            <span className="font-medium">{heroSet.images.length}</span>
          </div>
          <div className="flex justify-between">
            <span>Format:</span>
            <span className="font-medium text-blue-600">
              {heroSet.images[0]?.format?.toUpperCase() || 'WEBP'}
            </span>
          </div>
          <div className="flex justify-between">
            <span>Total Size:</span>
            <span className="font-medium">
              {formatFileSize(heroSet.images.reduce((total, img) => total + (img.fileSize || 0), 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="border-t border-gray-100 p-4 bg-gray-50">
          <div className="flex gap-2">
            {!isActive && (
              <button
                onClick={() => onActivate(heroSet._id)}
                className="flex-1 bg-green-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Activate
              </button>
            )}
            <button
              onClick={() => onDelete(heroSet._id)}
              className="flex-1 bg-red-600 text-white py-2 px-3 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

// Upload Form Component
const UploadHeroForm = ({ onClose, onSuccess }) => {
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});

  const validateImage = (file, index) => {
    return new Promise((resolve) => {
      const newErrors = { ...errors };
      delete newErrors[`image_${index}`];

      const img = new Image();
      img.onload = () => {
        // Check if image is landscape (width > height)
        if (img.width <= img.height) {
          newErrors[`image_${index}`] = `Image must be landscape orientation (width > height). Current: ${img.width}×${img.height}px`;
        }
        
        setErrors(newErrors);
        resolve(newErrors);
      };
      img.onerror = () => {
        newErrors[`image_${index}`] = "Failed to load image";
        setErrors(newErrors);
        resolve(newErrors);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileChange = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    const validationErrors = await validateImage(file, index);
    
    if (validationErrors[`image_${index}`]) {
      e.target.value = '';
      return;
    }

    const newImages = [...images];
    newImages[index] = file;
    setImages(newImages);

    const newPreviews = [...previews];
    newPreviews[index] = URL.createObjectURL(file);
    setPreviews(newPreviews);
  };

  const removeImage = (index) => {
    const newImages = [...images];
    const newPreviews = [...previews];
    const newErrors = { ...errors };

    if (newPreviews[index]) {
      URL.revokeObjectURL(newPreviews[index]);
    }

    newImages.splice(index, 1);
    newPreviews.splice(index, 1);
    delete newErrors[`image_${index}`];

    setImages(newImages);
    setPreviews(newPreviews);
    setErrors(newErrors);

    const fileInput = document.getElementById(`file-${index}`);
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (images.filter(img => img).length !== 3) {
      toast.error("Please upload exactly 3 images");
      return;
    }

    if (Object.keys(errors).length > 0) {
      toast.error("Please fix validation errors before uploading");
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      images.forEach((image) => {
        if (image) {
          formData.append("heroImages", image);
        }
      });

      await axios.post(`${import.meta.env.VITE_API_CONNECTION_HOST}/homepage-hero`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Hero images uploaded successfully!");
      onSuccess();
      
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(`Upload failed: ${error.response?.data?.error || error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const hasAllImages = images.filter(img => img).length === 3;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <motion.div
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-gray-900">Upload New Hero Set</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <p className="text-gray-600 mt-2">Upload exactly 3 landscape images (width greater than height) for the homepage hero section</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[0, 1, 2].map((index) => (
              <div key={index} className="space-y-3">
                <div className={`border-2 border-dashed rounded-lg p-4 text-center transition-colors ${
                  images[index] 
                    ? 'border-green-300 bg-green-50' 
                    : errors[`image_${index}`] 
                    ? 'border-red-300 bg-red-50' 
                    : 'border-gray-300 bg-gray-50 hover:border-blue-400'
                }`}>
                  <input
                    type="file"
                    id={`file-${index}`}
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={(e) => handleFileChange(e, index)}
                    className="hidden"
                    disabled={isUploading}
                  />
                  <label htmlFor={`file-${index}`} className="cursor-pointer block">
                    {previews[index] ? (
                      <div className="space-y-2">
                        <div className="aspect-4/3 rounded bg-gray-100 overflow-hidden">
                          <img
                            src={previews[index]}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <p className="text-sm font-medium text-green-700">Ready</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="aspect-4/3 rounded bg-gray-200 flex items-center justify-center">
                          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <p className="text-sm text-gray-600">Image {index + 1}</p>
                        <p className="text-xs text-gray-500">Landscape required</p>
                      </div>
                    )}
                  </label>
                  
                  {images[index] && (
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="mt-2 px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>

                {errors[`image_${index}`] && (
                  <p className="text-red-600 text-xs">{errors[`image_${index}`]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!hasAllImages || isUploading || Object.keys(errors).length > 0}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isUploading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v4m0 12v4m8-10h-4M6 12H2m16.364-6.364l-2.828 2.828M7.757 16.243l-2.828 2.828M16.364 16.364l2.828 2.828M7.757 7.757l2.828 2.828" />
                  </svg>
                  Uploading...
                </>
              ) : (
                'Upload Hero Set'
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default HomepageHeroManagement;