import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  Image,
  MapPin,
  Star,
  Trash2,
  Pencil,
  Plus,
  Filter,
  Search,
  Eye,
  Loader2,
  Play,
  AlertCircle
} from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;

export default function GetImages() {
  const [images, setImages] = useState([]);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [filters, setFilters] = useState({
    location: "",
    search: ""
  });
  const [selectedMedia, setSelectedMedia] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmConfig, setConfirmConfig] = useState({ 
    message: '', 
    onConfirm: null, 
    locationImageId: null,
    imageId: null,
    imageTitle: null
  });
  const navigate = useNavigate();

  // Function to check if media is a video
  const isVideo = (media) => {
    const path = media.url || media.path || media.src || '';
    return path.match(/\.(mp4|mov|avi|wmv|flv|webm|mkv)$/i) !== null;
  };

  const fetchImages = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/location-images`);
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();
      
      // Add video detection to each image
      const dataWithVideoInfo = data.map(locationImage => ({
        ...locationImage,
        images: locationImage.images?.map(img => ({
          ...img,
          isVideo: isVideo(img)
        })) || []
      }));
      
      setImages(dataWithVideoInfo);
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

  const showConfirmation = (message, onConfirm, locationImageId = null, imageId = null, imageTitle = null) => {
    setConfirmConfig({
      message,
      onConfirm,
      locationImageId,
      imageId,
      imageTitle
    });
    setShowConfirmModal(true);
  };

  const handleDelete = async (locationImageId, imageId, imageTitle) => {
    showConfirmation(
      `Are you sure you want to delete "${imageTitle}"? This action cannot be undone.`,
      async () => {
        try {
          setDeletingId(imageId);
          const res = await fetch(`${API_BASE_URL}/location-images/${locationImageId}/images/${imageId}`, {
            method: "DELETE",
          });
          
          if (!res.ok) throw new Error("Failed to delete media");
          
          const result = await res.json();
          toast.success("Media deleted successfully!");
          
          // Update local state
          setImages(prev => prev.map(locImage => 
            locImage._id === locationImageId 
              ? result.locationImage 
              : locImage
          ));
          
        } catch (err) {
          toast.error(err.message || "Failed to delete media");
        } finally {
          setDeletingId(null);
        }
      },
      locationImageId,
      imageId,
      imageTitle
    );
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      location: "",
      search: ""
    });
  };

  useEffect(() => {
    fetchImages();
    fetchLocations();
  }, []);

  const filteredImages = images.filter(locationImage => {
    if (!filters.search && !filters.location) return true;
    
    const searchTerm = filters.search.toLowerCase();
    const matchesSearch = !filters.search || (
      locationImage.location?.name?.toLowerCase().includes(searchTerm) ||
      locationImage.images?.some(img => 
        img.title?.toLowerCase().includes(searchTerm) ||
        img.alt?.toLowerCase().includes(searchTerm)
      )
    );
    
    const matchesLocation = !filters.location || locationImage.location?._id === filters.location;
    
    return matchesSearch && matchesLocation;
  });

  const getMainImage = (locationImage) => {
    return locationImage.images?.find(img => img.isMainImage) || locationImage.images?.[0];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const openMediaModal = (locationImage, mediaIndex) => {
    setSelectedMedia({
      locationImage,
      mediaIndex,
      currentMedia: locationImage.images[mediaIndex]
    });
  };

  const closeMediaModal = () => {
    setSelectedMedia(null);
  };

  const navigateMedia = (direction) => {
    if (!selectedMedia) return;
    
    const { locationImage, mediaIndex } = selectedMedia;
    const newIndex = direction === 'next' 
      ? (mediaIndex + 1) % locationImage.images.length
      : (mediaIndex - 1 + locationImage.images.length) % locationImage.images.length;
    
    setSelectedMedia({
      ...selectedMedia,
      mediaIndex: newIndex,
      currentMedia: locationImage.images[newIndex]
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return 'N/A';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#008DDA] mx-auto mb-4" />
          <p className="text-gray-600 text-lg font-medium">Loading media...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen font-inter">
      <Toaster 
        position="top-right" 
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-6 h-6 text-yellow-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
              </div>
              <p className="text-gray-600 mb-6">{confirmConfig.message}</p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    confirmConfig.onConfirm(confirmConfig.locationImageId, confirmConfig.imageId, confirmConfig.imageTitle);
                    setShowConfirmModal(false);
                  }}
                  className="px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Media Modal */}
      {selectedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-6xl max-h-full">
            <button
              onClick={closeMediaModal}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 transition-colors z-10"
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <div className="flex gap-4">
              <button
                onClick={() => navigateMedia('prev')}
                className="text-white hover:text-gray-300 transition-colors self-center"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <div className="text-center">
                {selectedMedia.currentMedia.isVideo ? (
                  <div className="max-w-full max-h-[80vh]">
                    <video
                      controls
                      autoPlay
                      className="max-w-full max-h-[80vh] object-contain rounded-lg"
                    >
                      <source src={selectedMedia.currentMedia.url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                ) : (
                  <img
                    src={selectedMedia.currentMedia.url}
                    alt={selectedMedia.currentMedia.alt}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg"
                  />
                )}
                <div className="mt-4 text-white">
                  <h3 className="text-xl font-semibold">{selectedMedia.currentMedia.title}</h3>
                  <p className="text-sm text-gray-300 mt-2">
                    {selectedMedia.mediaIndex + 1} of {selectedMedia.locationImage.images.length} • 
                    {selectedMedia.currentMedia.isMainImage && " ★ Main Image"}
                    {selectedMedia.currentMedia.isVideo && " 🎥 Video"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {selectedMedia.currentMedia.isVideo ? 'Video' : `Format: ${selectedMedia.currentMedia.format?.toUpperCase()}`} • 
                    Size: {formatFileSize(selectedMedia.currentMedia.fileSize)}
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => navigateMedia('next')}
                className="text-white hover:text-gray-300 transition-colors self-center"
              >
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Image className="w-7 h-7 text-[#008DDA]" />
            Resort Media
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and view all resort images and videos stored in Cloudinary
          </p>
        </div>
        <button
          onClick={() => navigate("/images/new")}
          className="mt-4 sm:mt-0 flex items-center gap-2 bg-[#008DDA] text-white px-4 py-2 rounded-lg shadow hover:bg-[#0074b8] transition"
        >
          <Plus size={18} /> Add Media
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
        <div className="flex flex-col lg:flex-row gap-4 items-end">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Media
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by title, alt text, or location..."
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

      {/* Media Count */}
      <div className="mb-6">
        <p className="text-gray-600">
          Showing {filteredImages.length} location{filteredImages.length !== 1 ? 's' : ''} with media
        </p>
      </div>

      {filteredImages.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border border-gray-200">
          <Image className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-2">No media found</p>
          <p className="text-gray-400 mb-6">
            {images.length === 0 ? "No media has been uploaded yet." : "No media matches your filters."}
          </p>
          <button
            onClick={() => navigate("/images/new")}
            className="bg-[#008DDA] text-white px-6 py-2 rounded-lg hover:bg-[#0074b8] transition"
          >
            Upload First Media
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-8">
          {filteredImages.map((locationImage) => (
            <div key={locationImage._id} className="bg-white rounded-xl border border-gray-200 shadow-sm">
              {/* Location Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <MapPin className="w-5 h-5 text-[#008DDA]" />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">
                        {locationImage.location?.name || "Unknown Location"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {locationImage.images?.length || 0} item{locationImage.images?.length !== 1 ? 's' : ''}
                        {locationImage.images?.some(img => img.isVideo) && (
                          <span className="ml-2">
                            ({locationImage.images.filter(img => img.isVideo).length} video{locationImage.images.filter(img => img.isVideo).length !== 1 ? 's' : ''})
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Updated {formatDate(locationImage.createdAt)}
                  </div>
                </div>
              </div>

              {/* Media Grid */}
              <div className="p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {locationImage.images?.map((media, index) => (
                    <div key={media._id} className="group relative bg-gray-50 rounded-lg overflow-hidden border border-gray-200">
                      {/* Media */}
                      <div 
                        className="aspect-square cursor-pointer"
                        onClick={() => openMediaModal(locationImage, index)}
                      >
                        {media.isVideo ? (
                          <div className="relative w-full h-full bg-black flex items-center justify-center">
                            <video
                              className="w-full h-full object-cover"
                              preload="metadata"
                              muted
                            >
                              <source src={media.url} type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center transform group-hover:scale-110 transition-transform duration-300">
                                <Play className="w-6 h-6 text-black ml-1" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={media.url}
                            alt={media.alt}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                        
                        {/* Overlay on hover */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300">
                          <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                            <button 
                              className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
                              onClick={(e) => {
                                e.stopPropagation();
                                openMediaModal(locationImage, index);
                              }}
                            >
                              <Eye size={16} />
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/images/edit/${locationImage._id}`);
                              }}
                              className="bg-white bg-opacity-90 p-2 rounded-full hover:bg-opacity-100 transition-all"
                            >
                              <Pencil size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Main Media Badge */}
                        {media.isMainImage && (
                          <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                            <Star size={12} />
                            Main
                          </div>
                        )}

                        {/* Video Badge */}
                        {media.isVideo && (
                          <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded-full text-xs font-semibold">
                            VIDEO
                          </div>
                        )}

                        {/* Order Badge */}
                        {!media.isVideo && (
                          <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs">
                            #{media.order + 1}
                          </div>
                        )}

                        {/* Format Badge */}
                        {!media.isVideo && (
                          <div className="absolute bottom-2 left-2 bg-blue-500 text-white px-2 py-1 rounded-full text-xs">
                            {media.format?.toUpperCase() || 'WEBP'}
                          </div>
                        )}
                      </div>

                      {/* Media Info */}
                      <div className="p-3">
                        <h4 className="font-medium text-gray-800 text-sm mb-1 truncate">
                          {media.title}
                        </h4>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                          {media.alt || "No description"}
                        </p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-gray-500">
                            {media.isVideo ? 'Video' : `Order: ${media.order + 1}`}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(locationImage._id, media._id, media.title);
                            }}
                            disabled={deletingId === media._id}
                            className="text-red-500 hover:text-red-700 transition-colors p-1 disabled:opacity-50"
                            title={`Delete ${media.isVideo ? 'video' : 'image'}`}
                          >
                            {deletingId === media._id ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Location Actions */}
              <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-xl">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Main media: {getMainImage(locationImage)?.title || 'Not set'}
                    {getMainImage(locationImage)?.isVideo && ' 🎥'}
                  </div>
                  <button
                    onClick={() => navigate(`/images/edit/${locationImage._id}`)}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-[#008DDA] text-white rounded-lg hover:bg-[#0074b8] transition"
                  >
                    <Pencil size={16} /> Manage Media
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