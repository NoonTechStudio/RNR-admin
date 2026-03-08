// Utility functions for location details
import { 
  Dumbbell, ShowerHead, Gamepad2, Trees, Music, Castle, Rabbit, 
  PartyPopper, DoorOpen, Palette, Sprout, Utensils, Car, Tv, 
  Wifi, Snowflake, Waves, Coffee, Shield 
} from 'lucide-react';


export const amenityIcons = {
  "Yoga Health Center": Dumbbell,
  "Health Center": Dumbbell,
  "Yoga": Dumbbell,
  "Rain Shower": ShowerHead,
  "Shower": ShowerHead,
  "Outdoor Games": Gamepad2,
  "Indoor Games": Gamepad2,
  "Games": Gamepad2,
  "Horse Riding": Rabbit,
  "Mini Zoo": Rabbit,
  "Treehouse": Trees,
  "Garden Area": Sprout,
  "Garden": Sprout,
  "Music": Music,
  "Banquet Hall": Castle,
  "Party Hall": Castle,
  "Pool Party": Waves,
  "Swimming Pool": Waves,
  "Rooms": DoorOpen,
  "Private Rooms": DoorOpen,
  "Food": Utensils,
  "With Food": Utensils,
  "Kitchen": Utensils,
  "Parking": Car,
  "Car Parking": Car,
  "TV": Tv,
  "Television": Tv,
  "WiFi": Wifi,
  "Internet": Wifi,
  "AC": Snowflake,
  "Air Conditioning": Snowflake,
  "Coffee": Coffee,
  "Security": Shield
};

export const DefaultIcon = DoorOpen;

export const generateMonths = (numMonths = 6) => {
  const months = [];
  const currentDate = new Date();
  
  for (let i = 0; i < numMonths; i++) {
    const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    
    months.push({
      name: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
      year,
      month,
      days: daysInMonth,
      startDay
    });
  }
  
  return months;
};

export const sanitizeHTML = (text) => {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

export const formatDate = (date) => {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    year: 'numeric' 
  });
};

export const formatReviewDate = (dateString) => {
  if (!dateString) return 'Recently';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 1) return '1 day ago';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.ceil(diffDays / 7)} week${Math.ceil(diffDays / 7) > 1 ? 's' : ''} ago`;
  if (diffDays < 365) return `${Math.ceil(diffDays / 30)} month${Math.ceil(diffDays / 30) > 1 ? 's' : ''} ago`;
  return `${Math.ceil(diffDays / 365)} year${Math.ceil(diffDays / 365) > 1 ? 's' : ''} ago`;
};

export const getOrganizedImages = (location) => {
  if (!location?.images || location.images.length === 0) {
    return {
      mainImage: 'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800',
      otherImages: [
        'https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/2029670/pexels-photo-2029670.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=800',
      ],
      allImages: [
        'https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1648776/pexels-photo-1648776.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/271624/pexels-photo-271624.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/2029670/pexels-photo-2029670.jpeg?auto=compress&cs=tinysrgb&w=800',
        'https://images.pexels.com/photos/1743229/pexels-photo-1743229.jpeg?auto=compress&cs=tinysrgb&w=800',
      ]
    };
  }

  const mainImageData = location.images.find(img => img.isMainImage === true);
  const otherImagesData = location.images.filter(img => !img.isMainImage);
  
  const mainImage = mainImageData ? `http://localhost:5000${mainImageData.url}` : `http://localhost:5000${location.images[0].url}`;
  const otherImages = otherImagesData.map(img => `http://localhost:5000${img.url}`);
  const allImages = location.images.map(img => `http://localhost:5000${img.url}`);

  return { mainImage, otherImages, allImages };
};

export const processAmenities = (amenities) => {
  return amenities?.map((amenityName) => {
    const matchedKey = Object.keys(amenityIcons).find(key => 
      amenityName.toLowerCase().includes(key.toLowerCase())
    );
    
    const IconComponent = matchedKey ? amenityIcons[matchedKey] : DefaultIcon;
    
    return {
      icon: IconComponent,
      name: amenityName,
    };
  }) || [];
};