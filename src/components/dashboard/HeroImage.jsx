// import React, { useState, useEffect } from 'react';
// import { motion } from 'framer-motion';
// import { Swiper, SwiperSlide } from 'swiper/react';
// import { Autoplay, Pagination } from 'swiper/modules';
// import axios from 'axios';
// import { useNavigate } from 'react-router-dom';
// import 'swiper/css';
// import 'swiper/css/pagination';

// const Hero = () => {
//   const [heroImages, setHeroImages] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const navigate = useNavigate();

//   // Fetch active hero images from backend
//   const fetchHeroImages = async () => {
//     try {
//       setLoading(true);
//       const response = await axios.get('http://localhost:5000/api/homepage-hero/active');
      
//       if (response.data.data && response.data.data.images) {
//         // Map the database images to the format needed for the slider
//         const images = response.data.data.images.map(img => ({
//           src: `${img.webpPath}`,
//           alt: `Hero image ${img.order + 1}`,
//           originalName: img.originalName
//         }));
//         setHeroImages(images);
//       } else {
//         setHeroImages([]);
//       }
//     } catch (err) {
//       console.error('Error fetching hero images:', err);
//       setError('Failed to load hero images');
//       // Fallback to empty array
//       setHeroImages([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchHeroImages();
//   }, []);

//   const handleManageHero = () => {
//     navigate('/hero-image-management');
//   };

//   // Show loading state
//   if (loading) {
//     return (
//       <section className="relative h-auto pt-20 pb-10 md:min-h-screen md:pt-24 flex flex-col items-center justify-center bg-white overflow-hidden">
//         <div className="w-full text-center py-4">
//           <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-serif text-black tracking-tight leading-snug">
//             Discover Peace
//           </h1>
//         </div>
//         <div className="w-[95%] sm:w-[90%] md:w-[80%] lg:w-[70%] max-w-6xl rounded-xl sm:rounded-2xl shadow-4xl overflow-hidden mt-4 h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] xl:h-[700px] bg-gray-200 flex items-center justify-center">
//           <div className="text-center">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
//             <p className="text-gray-600">Loading hero images...</p>
//           </div>
//         </div>
        
//         {/* Manage Button - Still shown during loading */}
//         <motion.div
//           className="mt-8 flex justify-center"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8, delay: 1.2 }}
//         >
//           <button
//             onClick={handleManageHero}
//             className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//             </svg>
//             Manage Hero Images
//           </button>
//         </motion.div>
//       </section>
//     );
//   }

//   // Show error state
//   if (error && heroImages.length === 0) {
//     return (
//       <section className="relative h-auto pt-20 pb-10 md:min-h-screen md:pt-24 flex flex-col items-center justify-center bg-white overflow-hidden">
//         <div className="w-full text-center py-4">
//           <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-serif text-black tracking-tight leading-snug">
//             Discover Peace
//           </h1>
//         </div>
//         <div className="w-[95%] sm:w-[90%] md:w-[80%] lg:w-[70%] max-w-6xl rounded-xl sm:rounded-2xl shadow-4xl overflow-hidden mt-4 h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] xl:h-[700px] bg-gray-100 flex items-center justify-center">
//           <div className="text-center text-gray-500">
//             <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//             </svg>
//             <p>No hero images available</p>
//             <p className="text-sm mt-2">Please upload images in the admin panel</p>
//           </div>
//         </div>
        
//         {/* Manage Button - Emphasized when no images */}
//         <motion.div
//           className="mt-8 flex justify-center"
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8, delay: 0.5 }}
//         >
//           <button
//             onClick={handleManageHero}
//             className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-2"
//           >
//             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//             </svg>
//             Add Hero Images Now
//           </button>
//         </motion.div>
//       </section>
//     );
//   }

//   return (
//     <section className="relative h-auto pt-20 pb-10 md:min-h-screen md:pt-24 flex flex-col items-center justify-center bg-white overflow-hidden">
//       {/* Title section with animation */}
//       <motion.div
//         className="w-full text-center py-4"
//         initial={{ opacity: 0, y: -50 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 1.2, delay: 0.3 }}
//       >
//         <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl font-serif text-black tracking-tight leading-snug"> 
//           Discover Peace
//         </h1>
//       </motion.div>

//       {/* Image Swiper section with refined animation */}
//       <motion.div
//         className="w-[95%] sm:w-[90%] md:w-[80%] lg:w-[70%] max-w-6xl rounded-xl sm:rounded-2xl shadow-4xl overflow-hidden mt-4"
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 1.5, delay: 0.8 }}
//       >
//         <Swiper
//           modules={[Autoplay, Pagination]}
//           spaceBetween={0}
//           slidesPerView={1}
//           autoplay={{ delay: 5000, disableOnInteraction: false }}
//           pagination={{
//             clickable: true,
//             bulletActiveClass: 'swiper-pagination-bullet-active bg-white',
//             bulletClass: 'swiper-pagination-bullet bg-gray-400'
//           }}
//           className="w-full h-[300px] sm:h-[400px] md:h-[500px] lg:h-[600px] xl:h-[700px]"
//         >
//           {heroImages.map((image, index) => (
//             <SwiperSlide key={index}>
//               <div className="flex justify-center bg-[#03A791] w-full h-full">
//                 <img
//                   src={image.src}
//                   alt={image.alt}
//                   className="w-full h-full object-cover"
//                   onError={(e) => {
//                     // Fallback if image fails to load
//                     console.error(`Failed to load image: ${image.src}`);
//                     e.target.src = '/api/placeholder/800/600';
//                   }}
//                   loading="lazy"
//                 />
//               </div>
//             </SwiperSlide>
//           ))}
//         </Swiper>
//       </motion.div>

//       {/* Manage Hero Images Button - Centered below the images */}
//       <motion.div
//         className="mt-8 flex justify-center"
//         initial={{ opacity: 0, y: 20 }}
//         animate={{ opacity: 1, y: 0 }}
//         transition={{ duration: 0.8, delay: 1.2 }}
//       >
//         <button
//           onClick={handleManageHero}
//           className="bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl flex items-center gap-3 group"
//         >
//           <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
//           </svg>
//           <span className="text-lg">Manage Hero Images</span>
//           <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
//           </svg>
//         </button>
//       </motion.div>

//       {/* Additional Info Text */}
//       <motion.div
//         className="mt-4 text-center max-w-2xl"
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ duration: 0.6, delay: 1.5 }}
//       >
//         <p className="text-gray-600 text-sm">
//           Customize your homepage hero section with stunning images
//         </p>
//         <p className="text-gray-500 text-xs mt-1">
//           Upload, manage, and activate different sets of hero images
//         </p>
//       </motion.div>
//     </section>
//   );
// };

// export default Hero;