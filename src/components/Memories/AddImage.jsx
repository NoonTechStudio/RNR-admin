import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast, Toaster } from "react-hot-toast";
import { Loader2, Upload, X, ArrowRight, Image as ImageIcon, Video, Film, Trash2, Edit3 } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_CONNECTION_HOST;

const AddImage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [locations, setLocations] = useState([]);
  const [existingLocationImage, setExistingLocationImage] = useState(null);
  const [form, setForm] = useState({
    locationId: "",
    images: [],
  });
  const [previews, setPreviews] = useState([]);
  const [imageDetails, setImageDetails] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const isEditMode = Boolean(id);

  // Constants for validation
  const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB for images
  const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB for videos
  const MAX_FILES = 10;

  // Media type options for dropdown
  const mediaTypeOptions = [
    { value: 'main-image', label: 'Main Image' },
    { value: 'bedroom', label: 'Bedroom' },
    { value: 'bathroom', label: 'Bathroom' },
    { value: 'balcony', label: 'Balcony' },
    { value: 'livingroom', label: 'Living Room' },
    { value: 'hall', label: 'Hall' },
    { value: 'privateroom', label: 'Private Room' },
    { value: 'garden', label: 'Garden' },
    { value: 'swimmingpool', label: 'Swimming Pool' },
    { value: 'video-tour', label: 'Video Tour' },
    { value: 'others', label: 'Others' }
  ];

  // Allowed file types
  const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  const allowedVideoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/mkv'];
  const allowedFileTypes = [...allowedImageTypes, ...allowedVideoTypes];

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

  // Fetch existing location media for editing
  useEffect(() => {
    if (isEditMode) {
      fetchExistingImages();
    }
  }, [id]);

  const fetchExistingImages = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/location-images/${id}`);
      const locationImageData = res.data;
      
      setExistingLocationImage(locationImageData);
      setForm({ 
        locationId: locationImageData.location._id,
        images: [] 
      });
      
      // Convert existing media to imageDetails format
      const details = locationImageData.images.map((media, index) => ({
        _id: media._id,
        url: media.url,
        alt: media.alt || (media.mediaType === 'video' ? `Video ${index + 1}` : `Image ${index + 1}`),
        title: media.title || (media.mediaType === 'video' ? `Video ${index + 1}` : `Image ${index + 1}`),
        imageType: media.imageType || (media.mediaType === 'video' ? 'video-tour' : 'others'),
        isMainImage: media.isMainImage || false,
        order: media.order || index,
        fileName: media.title || (media.mediaType === 'video' ? `video-${index + 1}` : `image-${index + 1}`),
        isExisting: true,
        format: media.format || (media.mediaType === 'video' ? 'mp4' : 'webp'),
        fileSize: media.fileSize,
        mediaType: media.mediaType || 'image',
        duration: media.duration || null,
        thumbnail: media.thumbnail || null,
        cloudinaryId: media.cloudinaryId
      }));
      
      setImageDetails(details);
      setPreviews(details.map(media => media.thumbnail || media.url));
      toast.success("Existing media loaded successfully");
    } catch (err) {
      console.error("Error fetching existing media:", err);
      toast.error("Failed to load existing media");
    }
  };

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    switch (name) {
      case "locationId":
        if (!value) newErrors.locationId = "Please select a resort location";
        else delete newErrors.locationId;
        break;
      
      case "images":
        if ((!value || value.length === 0) && imageDetails.filter(detail => !detail.markedForDeletion).length === 0) {
          newErrors.images = "Please select at least one file";
        } else {
          delete newErrors.images;
        }
        break;
      
      default:
        delete newErrors[name];
    }
    
    setErrors(newErrors);
  };

  const validateFiles = (files) => {
    const errors = [];
    const validFiles = [];

    // Check if adding these files would exceed maximum file count
    const currentNewFiles = imageDetails.filter(detail => !detail.isExisting && !detail.markedForDeletion).length;
    const totalFilesAfterAdd = currentNewFiles + files.length;
    if (totalFilesAfterAdd > MAX_FILES) {
      errors.push(`Maximum ${MAX_FILES} new files allowed. You have ${currentNewFiles} and trying to add ${files.length} more.`);
      return { validFiles: [], errors };
    }

    // Check each file
    files.forEach((file) => {
      // Check file type
      if (!allowedFileTypes.includes(file.type)) {
        errors.push(`Invalid file type: ${file.name}. Please select image or video files only.`);
        return;
      }

      // Check file size based on type
      const isVideo = file.type.startsWith('video/');
      const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
      
      if (file.size > maxSize) {
        const maxSizeMB = maxSize / (1024 * 1024);
        errors.push(`File too large: ${file.name} (${(file.size / (1024 * 1024)).toFixed(2)}MB). Maximum size is ${maxSizeMB}MB for ${isVideo ? 'videos' : 'images'}.`);
        return;
      }

      // Check if file is empty
      if (file.size === 0) {
        errors.push(`Empty file: ${file.name}`);
        return;
      }

      validFiles.push(file);
    });

    return { validFiles, errors };
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;

    // Validate files
    const { validFiles, errors: validationErrors } = validateFiles(files);

    // Show validation errors
    validationErrors.forEach(error => {
      toast.error(error);
    });

    if (validFiles.length === 0) return;

    setForm(prev => ({ 
      ...prev, 
      images: [...prev.images, ...validFiles] 
    }));
    
    // Create preview URLs and thumbnails
    const newPreviews = validFiles.map((file) => {
      if (file.type.startsWith('video/')) {
        // For videos, create object URL for preview
        return URL.createObjectURL(file);
      } else {
        // For images, create object URL
        return URL.createObjectURL(file);
      }
    });
    
    setPreviews(prev => [...prev, ...newPreviews]);
    
    // Initialize media details for each new file
    const newDetails = validFiles.map((file, index) => {
      const isVideo = file.type.startsWith('video/');
      const isImage = file.type.startsWith('image/');
      const currentTotalFiles = imageDetails.length;
      
      return {
        url: "", // Will be set by backend after upload
        alt: isVideo ? `Video ${currentTotalFiles + index + 1}` : `Image ${currentTotalFiles + index + 1}`,
        title: isVideo ? `Video ${currentTotalFiles + index + 1}` : `Image ${currentTotalFiles + index + 1}`,
        imageType: isVideo ? 'video-tour' : 'others',
        isMainImage: false, // Don't auto-set as main for new files in edit mode
        order: currentTotalFiles + index,
        fileName: file.name,
        isExisting: false,
        format: isVideo ? file.type.split('/')[1] : 'webp',
        fileSize: file.size,
        mediaType: isVideo ? 'video' : 'image',
        duration: null, // Will be set by backend for videos
        thumbnail: null // Will be set by backend for videos
      };
    });
    
    setImageDetails(prev => [...prev, ...newDetails]);
    setActiveImageIndex(imageDetails.length);

    if (touched.images) {
      validateField("images", validFiles);
    }

    // Show file info
    const imageCount = validFiles.filter(f => f.type.startsWith('image/')).length;
    const videoCount = validFiles.filter(f => f.type.startsWith('video/')).length;
    
    let message = `Added ${validFiles.length} file(s)`;
    if (imageCount > 0 && videoCount > 0) {
      message += ` (${imageCount} images, ${videoCount} videos)`;
    } else if (imageCount > 0) {
      message += ` (${imageCount} images)`;
    } else if (videoCount > 0) {
      message += ` (${videoCount} videos)`;
    }
    
    toast.success(message);

    // Reset file input
    e.target.value = '';
  };

  const removeImage = (index) => {
    const mediaToRemove = imageDetails[index];
    
    if (mediaToRemove.isExisting) {
      // For existing media, mark for deletion
      const updatedDetails = [...imageDetails];
      updatedDetails[index] = { ...updatedDetails[index], markedForDeletion: true };
      setImageDetails(updatedDetails);
      toast.success("Media marked for deletion. It will be removed from Cloudinary when you save.");
    } else {
      // For new media, remove completely
      const updatedFiles = [...form.images];
      const updatedPreviews = [...previews];
      const updatedDetails = [...imageDetails];
      
      // Calculate the index in the form.images array
      const existingMediaCount = imageDetails.filter(detail => detail.isExisting && !detail.markedForDeletion).length;
      const newMediaBeforeIndex = imageDetails.slice(0, index).filter(detail => !detail.isExisting && !detail.markedForDeletion).length;
      
      // Remove from form.images array
      if (newMediaBeforeIndex < updatedFiles.length) {
        updatedFiles.splice(newMediaBeforeIndex, 1);
      }
      
      // Clean up object URL
      URL.revokeObjectURL(updatedPreviews[index]);
      
      // Remove from arrays
      updatedPreviews.splice(index, 1);
      updatedDetails.splice(index, 1);
      
      // Update active index if needed
      if (activeImageIndex >= index && activeImageIndex > 0) {
        setActiveImageIndex(activeImageIndex - 1);
      }
      
      // Update order for remaining media
      const reorderedDetails = updatedDetails.map((detail, idx) => ({
        ...detail,
        order: idx
      }));
      
      setForm({ ...form, images: updatedFiles });
      setPreviews(updatedPreviews);
      setImageDetails(reorderedDetails);
      toast.success("Media removed");
    }
  };

  const restoreImage = (index) => {
    const updatedDetails = [...imageDetails];
    updatedDetails[index] = { ...updatedDetails[index], markedForDeletion: false };
    setImageDetails(updatedDetails);
    toast.success("Media restored");
  };

  const updateImageDetail = (index, field, value) => {
    const updatedDetails = [...imageDetails];
    
    // If setting main image to true, set all others to false
    if (field === 'isMainImage' && value === true) {
      updatedDetails.forEach((detail, idx) => {
        if (idx === index) {
          updatedDetails[idx] = { ...detail, [field]: value };
        } else {
          updatedDetails[idx] = { ...detail, isMainImage: false };
        }
      });
    } else {
      updatedDetails[index] = {
        ...updatedDetails[index],
        [field]: value
      };
    }
    
    setImageDetails(updatedDetails);
  };

  const handleBlur = (fieldName) => {
    setTouched({ ...touched, [fieldName]: true });
    validateField(fieldName, form[fieldName]);
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!form.locationId) newErrors.locationId = "Please select a resort location";
    if (form.images.length === 0 && imageDetails.filter(detail => !detail.markedForDeletion).length === 0) {
      newErrors.images = "Please select at least one file";
    }
    
    setErrors(newErrors);
    setTouched({
      locationId: true,
      images: true,
    });
    
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!validateForm()) {
    toast.error("Please fix the errors before submitting");
    return;
  }

  setIsUploading(true);
  
  try {
    const formData = new FormData();
    formData.append("locationId", form.locationId);
    
    // Prepare media details for backend - ensure all required fields are included
    const mediaDetails = imageDetails.map((detail, index) => {
      const mediaDetail = {
        alt: detail.alt,
        title: detail.title,
        imageType: detail.imageType,
        isMainImage: detail.isMainImage,
        order: index,
        mediaType: detail.mediaType,
      };

      // Include ID for existing media
      if (detail.isExisting) {
        mediaDetail._id = detail._id;
      }

      // Include deletion flag
      if (detail.markedForDeletion) {
        mediaDetail.markedForDeletion = true;
      }

      return mediaDetail;
    });

    console.log('Sending media details:', mediaDetails);
    formData.append("imageDetails", JSON.stringify(mediaDetails));

    // Add only new files to formData (not existing ones)
    form.images.forEach((file) => {
      formData.append("images", file);
    });

    let response;
    
    if (isEditMode) {
      console.log('Sending update request with:', {
        locationId: form.locationId,
        mediaDetails: mediaDetails.length,
        files: form.images.length,
        markedForDeletion: mediaDetails.filter(d => d.markedForDeletion).length
      });
      
      response = await axios.put(`${API_BASE_URL}/location-images/${id}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      console.log('Update response:', response.data);
    } else {
      // Create new media
      response = await axios.post(`${API_BASE_URL}/location-images`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
    }

    toast.success(
      isEditMode 
        ? "Media updated successfully!" 
        : "Media uploaded successfully!"
    );
    
    // Clear form and navigate
    setTimeout(() => {
      navigate("/images");
    }, 1500);
    
  } catch (err) {
    console.error("Error uploading media:", err);
    const errorMessage = err.response?.data?.error || err.message || "Upload failed";
    toast.error(errorMessage);
  } finally {
    setIsUploading(false);
  }
};

  const getCurrentImage = () => {
    return imageDetails[activeImageIndex];
  };

  const currentMedia = getCurrentImage();

  // Calculate file statistics
  const getFileStats = () => {
    const existingImages = imageDetails.filter(detail => 
      detail.isExisting && !detail.markedForDeletion && detail.mediaType === 'image'
    ).length;
    const existingVideos = imageDetails.filter(detail => 
      detail.isExisting && !detail.markedForDeletion && detail.mediaType === 'video'
    ).length;
    const newImages = imageDetails.filter(detail => 
      !detail.isExisting && !detail.markedForDeletion && detail.mediaType === 'image'
    ).length;
    const newVideos = imageDetails.filter(detail => 
      !detail.isExisting && !detail.markedForDeletion && detail.mediaType === 'video'
    ).length;
    const markedForDeletion = imageDetails.filter(detail => detail.markedForDeletion).length;

    const totalFiles = existingImages + existingVideos + newImages + newVideos;
    const remainingFiles = MAX_FILES - (newImages + newVideos);

    return { 
      existingImages, 
      existingVideos, 
      newImages, 
      newVideos, 
      markedForDeletion,
      totalFiles, 
      remainingFiles 
    };
  };

  const fileStats = getFileStats();

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
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
      
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            {isEditMode ? <Edit3 className="w-8 h-8 text-[#008DDA]" /> : <ImageIcon className="w-8 h-8 text-[#008DDA]" />}
            {isEditMode ? "Edit Location Media" : "Add Location Media"}
          </h1>
          <p className="text-gray-600 mt-2">
            {isEditMode 
              ? "Manage images and videos for this resort location" 
              : "Upload and organize images and videos for resort locations"
            }
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Location Selection */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Resort Location
            </h2>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Resort Location *
              </label>
              <select
                value={form.locationId}
                onChange={(e) => {
                  setForm({ ...form, locationId: e.target.value });
                  validateField("locationId", e.target.value);
                }}
                onBlur={() => handleBlur("locationId")}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition ${
                  errors.locationId && touched.locationId
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                disabled={isEditMode}
              >
                <option value="">Select a resort location</option>
                {locations.map((loc) => (
                  <option key={loc._id} value={loc._id}>
                    {loc.name}
                  </option>
                ))}
              </select>
              {errors.locationId && touched.locationId && (
                <p className="text-red-500 text-sm mt-2">{errors.locationId}</p>
              )}
            </div>
          </div>

          {/* Edit Mode Warning */}
          {isEditMode && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-yellow-800 font-medium">Edit Mode - Cloudinary Operations</span>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                • Deleting existing media will permanently remove files from Cloudinary<br/>
                • Adding new media will upload files to Cloudinary<br/>
                • Editing metadata updates only the database<br/>
                • Changes are saved when you click "Update Media"
              </p>
            </div>
          )}

          {/* Media Upload Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              {isEditMode ? "Manage Media Files" : "Upload Media Files"}
            </h2>
            
            {/* File Statistics */}
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Total Files:</span> {fileStats.totalFiles}
                </div>
                <div>
                  <span className="font-medium">Images:</span> {fileStats.existingImages + fileStats.newImages}
                  {isEditMode && ` (${fileStats.existingImages} existing, ${fileStats.newImages} new)`}
                </div>
                <div>
                  <span className="font-medium">Videos:</span> {fileStats.existingVideos + fileStats.newVideos}
                  {isEditMode && ` (${fileStats.existingVideos} existing, ${fileStats.newVideos} new)`}
                </div>
                <div>
                  <span className="font-medium">Remaining:</span> {fileStats.remainingFiles}
                </div>
                {isEditMode && fileStats.markedForDeletion > 0 && (
                  <div className="col-span-2 md:col-span-4">
                    <span className="font-medium text-red-600">Marked for deletion:</span> {fileStats.markedForDeletion} files
                  </div>
                )}
              </div>
            </div>
            
            {/* File Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isEditMode ? "Add New Media Files" : "Select Media Files"} *
              </label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-8 h-8 mb-3 text-gray-400" />
                    <p className="mb-2 text-sm text-gray-500">
                      <span className="font-semibold">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      Images (JPG, JPEG, PNG, WebP) up to 10MB • Videos (MP4, MOV, AVI, WebM, MKV) up to 50MB
                    </p>
                    <p className="text-xs text-blue-600 mt-1">
                      {fileStats.remainingFiles} files remaining
                    </p>
                  </div>
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/mov,video/avi,video/webm,video/mkv"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              {errors.images && touched.images && (
                <p className="text-red-500 text-sm mt-2">{errors.images}</p>
              )}
            </div>

            {/* Media Previews and Details */}
            {imageDetails.length > 0 && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-800">
                  Media Details ({fileStats.totalFiles} files)
                </h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Media Thumbnails */}
                  <div className="lg:col-span-1">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Media Thumbnails</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                      {imageDetails.map((detail, index) => (
                        <div
                          key={index}
                          className={`relative group cursor-pointer border-2 rounded-lg overflow-hidden ${
                            activeImageIndex === index 
                              ? 'border-[#008DDA]' 
                              : detail.markedForDeletion 
                                ? 'border-red-300 opacity-60'
                                : 'border-gray-200'
                          }`}
                          onClick={() => setActiveImageIndex(index)}
                        >
                          {detail.mediaType === 'video' ? (
                            <div className="w-full h-20 bg-gray-800 flex items-center justify-center relative">
                              {detail.thumbnail ? (
                                <img
                                  src={detail.thumbnail}
                                  alt={detail.alt}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                  <Film className="w-6 h-6 text-white" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                <Film className="w-4 h-4 text-white" />
                              </div>
                            </div>
                          ) : (
                            <img
                              src={previews[index]}
                              alt={detail.alt}
                              className="w-full h-20 object-cover"
                            />
                          )}
                          
                          {/* Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all">
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (detail.markedForDeletion) {
                                    restoreImage(index);
                                  } else {
                                    removeImage(index);
                                  }
                                }}
                                className={`p-1 rounded-full ${
                                  detail.markedForDeletion 
                                    ? 'bg-green-500 text-white hover:bg-green-600'
                                    : 'bg-red-500 text-white hover:bg-red-600'
                                }`}
                              >
                                {detail.markedForDeletion ? (
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                ) : (
                                  <Trash2 className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            
                            {/* Status Badges */}
                            <div className="absolute bottom-1 left-1 flex gap-1">
                              {detail.mediaType === 'video' && (
                                <span className="bg-purple-500 text-white px-1 py-0.5 rounded text-xs font-medium">
                                  Video
                                </span>
                              )}
                              {detail.isMainImage && (
                                <span className="bg-yellow-500 text-white px-1 py-0.5 rounded text-xs font-medium">
                                  Main
                                </span>
                              )}
                              {detail.markedForDeletion && (
                                <span className="bg-red-500 text-white px-1 py-0.5 rounded text-xs font-medium">
                                  Delete
                                </span>
                              )}
                              {detail.isExisting && !detail.markedForDeletion && (
                                <span className="bg-green-500 text-white px-1 py-0.5 rounded text-xs font-medium">
                                  Existing
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Order Badge */}
                          <div className="absolute top-1 left-1 bg-black bg-opacity-70 text-white px-1 py-0.5 rounded text-xs">
                            #{index + 1}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Media Details Form */}
                  {currentMedia && !currentMedia.markedForDeletion && (
                    <div className="lg:col-span-2">
                      <h4 className="text-sm font-medium text-gray-700 mb-4 flex items-center gap-2">
                        {currentMedia.mediaType === 'video' ? (
                          <Video className="w-4 h-4 text-purple-500" />
                        ) : (
                          <ImageIcon className="w-4 h-4 text-blue-500" />
                        )}
                        Edit {currentMedia.mediaType === 'video' ? 'Video' : 'Image'} Details: {currentMedia.fileName}
                        {currentMedia.isExisting && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                            Existing on Cloudinary
                          </span>
                        )}
                      </h4>
                      
                      <div className="space-y-4">
                        {/* Media Type */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Media Type *
                          </label>
                          <select
                            value={currentMedia.imageType}
                            onChange={(e) => updateImageDetail(activeImageIndex, 'imageType', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {mediaTypeOptions.map(option => (
                              <option key={option.value} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Title */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            {currentMedia.mediaType === 'video' ? 'Video' : 'Image'} Title *
                          </label>
                          <input
                            type="text"
                            value={currentMedia.title}
                            onChange={(e) => updateImageDetail(activeImageIndex, 'title', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder={`Enter ${currentMedia.mediaType === 'video' ? 'video' : 'image'} title`}
                          />
                        </div>

                        {/* Alt Text */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description {currentMedia.mediaType === 'image' && '(Alt Text)'}
                          </label>
                          <textarea
                            value={currentMedia.alt}
                            onChange={(e) => updateImageDetail(activeImageIndex, 'alt', e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="3"
                            placeholder={`Enter ${currentMedia.mediaType === 'video' ? 'video' : 'image'} description`}
                          />
                        </div>

                        {/* Main Media Toggle - Only for images */}
                        {currentMedia.mediaType === 'image' && (
                          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Set as Main Image
                              </label>
                              <p className="text-sm text-gray-600">
                                This image will be featured as the primary image for the location
                              </p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={currentMedia.isMainImage}
                                onChange={(e) => updateImageDetail(activeImageIndex, 'isMainImage', e.target.checked)}
                                className="sr-only peer"
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        )}

                        {/* Media Info */}
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                          <div>
                            <span className="font-medium">Order:</span> {currentMedia.order + 1}
                          </div>
                          <div>
                            <span className="font-medium">Type:</span> {currentMedia.mediaType === 'video' ? 'Video' : 'Image'}
                          </div>
                          <div>
                            <span className="font-medium">Format:</span> {currentMedia.format?.toUpperCase() || (currentMedia.mediaType === 'video' ? 'MP4' : 'WEBP')}
                          </div>
                          {currentMedia.duration && (
                            <div>
                              <span className="font-medium">Duration:</span> {Math.round(currentMedia.duration)}s
                            </div>
                          )}
                          {currentMedia.fileSize && (
                            <div className="col-span-2">
                              <span className="font-medium">File Size:</span>{" "}
                              {currentMedia.fileSize > 1024 * 1024 
                                ? `${(currentMedia.fileSize / (1024 * 1024)).toFixed(2)} MB`
                                : `${Math.round(currentMedia.fileSize / 1024)} KB`
                              }
                            </div>
                          )}
                          {currentMedia.cloudinaryId && (
                            <div className="col-span-2">
                              <span className="font-medium">Cloudinary ID:</span> {currentMedia.cloudinaryId}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              type="button"
              onClick={() => navigate("/images")}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isUploading}
              className="flex items-center gap-2 px-6 py-3 bg-[#008DDA] text-white rounded-lg hover:bg-[#0074b8] transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isEditMode ? "Updating Media..." : "Uploading Media..."}
                </>
              ) : (
                <>
                  {isEditMode ? <Edit3 className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                  {isEditMode ? "Update Media" : "Upload Media"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddImage;