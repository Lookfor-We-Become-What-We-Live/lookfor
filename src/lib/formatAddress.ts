// Format address to show only: street, postal code, city, country
export const formatAddress = (fullAddress: string): string => {
  // Parse OpenStreetMap address format
  const parts = fullAddress.split(", ");
  
  if (parts.length < 3) {
    return fullAddress; // Return as-is if format is unexpected
  }
  
  // Try to extract: street, postal code, city, country
  // OpenStreetMap format varies, but typically: street, city, state, postal code, country
  const country = parts[parts.length - 1];
  const city = parts[parts.length - 3] || parts[parts.length - 2];
  const street = parts[0];
  
  // Look for postal code (contains numbers)
  const postalCodePart = parts.find(p => /\d/.test(p));
  
  if (postalCodePart) {
    return `${street}, ${postalCodePart}, ${city}, ${country}`;
  }
  
  return `${street}, ${city}, ${country}`;
};
