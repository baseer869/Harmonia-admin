import type { PriceMode, ServiceType } from '../validation';

/** Services · domain types (a tenant-OWNED catalog item — full catalog shape). */

export interface ServiceIncluded {
  title: string;
  description: string;
}
export interface ServiceInfo {
  label: string;
  value: string;
}
export interface ServiceOptionItem {
  name: string;
  priceDeltaCents: number;
}
export interface ServiceExtraItem {
  name: string;
  priceCents: number;
}
export interface ServiceMediaItem {
  url: string;
  type: 'IMAGE' | 'VIDEO';
  alt: string | null;
}

export interface Service {
  id: string;
  tenantId: string;
  categoryId: string | null;
  type: ServiceType;
  slug: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  tags: string[];

  coverUrl: string | null;
  thumbUrl: string | null;

  priceMode: PriceMode;
  priceCents: number;
  currency: string;
  acceptedCurrencies: string[];
  priceUnit: string | null;
  requiresDate: boolean;
  minPeople: number | null;
  maxPeople: number | null;
  durationMinutes: number | null;
  languages: string[];
  active: boolean;
  featured: boolean;
  ratingCached: number;
  reviewCount: number;

  included: ServiceIncluded[];
  info: ServiceInfo[];
  options: ServiceOptionItem[];
  extras: ServiceExtraItem[];
  media: ServiceMediaItem[];

  createdAt: string;
  updatedAt: string;
}
