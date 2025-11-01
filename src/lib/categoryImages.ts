// Category-specific image mappings
export const categoryImages: Record<string, string> = {
  "Wellness": "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&auto=format&fit=crop",
  "Art & Culture": "https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800&auto=format&fit=crop",
  "Food & Drink": "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop",
  "Outdoor & Adventure": "https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&auto=format&fit=crop",
  "Music & Nightlife": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=800&auto=format&fit=crop",
  "Community & Volunteering": "https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=800&auto=format&fit=crop",
  "Creative Workshops": "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=800&auto=format&fit=crop",
  "Photography": "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=800&auto=format&fit=crop",
};

export const getCategoryImage = (category: string): string => {
  return categoryImages[category] || "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop";
};
