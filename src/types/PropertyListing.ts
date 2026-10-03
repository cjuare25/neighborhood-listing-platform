export interface PropertyListing {
  id: number;
  address: string;
  city: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  imageUrl: string;
  amenities: string[];
  contact: {
    email: string;
    phone: string;
  };
  listedAt: string;
}
