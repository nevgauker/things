export type Coordinates = [number, number]; // [lng, lat]

export interface Position {
  type: 'Point';
  coordinates: Coordinates;
}

export interface Thing {
  id?: string;
  name?: string;
  type?: 'thing' | 'store' | 'event' | string;
  category?: string;
  ownerId?: string;
  ownerImageUrl?: string;
  imageUrl?: string;
  price?: number;
  currencyCode?: string;
  country?: string;
  city?: string;
  status?: string;
  start?: string;
  end?: string;
  priceRange?: number;
  position?: Position;
  fromGoogle?: boolean;
  googleData?: Record<string, unknown> & {
    rating?: number;
    user_ratings_total?: number;
    types?: string[];
  };
}

export interface User {
  id?: string;
  email: string;
  name?: string;
  userAvatar?: string;
  isAdmin?: boolean;
  pushToken?: string;
  phoneNumber?: string;
  dialCode?: string;
  isoCode?: string;
  sms?: boolean;
  whatsapp?: boolean;
  telegram?: boolean;
  preferredCurrency?: string;
}

export interface Bounds {
  northeast: { lat: number; lng: number };
  southwest: { lat: number; lng: number };
}

export interface FetchThingsResponse {
  things: Thing[];
  message?: string;
}

export const categories = [
  { id: 0, name: 'gadgets', displayName: 'gadgets & gifts' },
  { id: 1, name: 'fashion', displayName: 'fashion' },
  { id: 2, name: 'art', displayName: 'art & craft' },
  { id: 3, name: 'travel', displayName: 'travel' },
  { id: 4, name: 'food', displayName: 'food & drinks' },
  { id: 5, name: 'entertainment', displayName: 'entertainment' },
  { id: 6, name: 'garden', displayName: 'garden' },
  { id: 7, name: 'household', displayName: 'household' },
  { id: 8, name: 'pets', displayName: 'for pets' },
  { id: 9, name: 'hobbies', displayName: 'hobbies' },
  { id: 10, name: 'office', displayName: 'office supplies' },
  { id: 11, name: 'cars', displayName: 'cars' },
  { id: 12, name: 'other', displayName: 'other' },
];
