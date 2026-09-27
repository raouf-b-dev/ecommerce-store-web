import { slugify } from '@/lib/mock/lib/slugify';
import type {
  CategoryResponseDto,
  ProductDetailResponseDto,
  SeedInventoryRow,
} from '@/lib/mock/data/types';

const SEED_TIMESTAMP = '2026-03-01T12:00:00.000Z';

/** Mirrors API `DEMO_SEED_PRODUCTS` / admin mock catalog (see API SEEDING.md). */
const productDefs: Array<{
  id: number;
  name: string;
  sku: string;
  price: number;
  categoryId: number;
  description: string;
  initialStock: number;
}> = [
  {
    id: 1,
    name: 'Wireless Noise-Canceling Headphones',
    sku: 'ELEC-ANC-001',
    price: 199.99,
    categoryId: 1,
    description:
      'High-fidelity over-ear headphones with active noise cancellation and 30-hour battery life.',
    initialStock: 150,
  },
  {
    id: 2,
    name: 'Smart Fitness Watch v2',
    sku: 'ELEC-SFW-002',
    price: 129.5,
    categoryId: 1,
    description:
      'Waterproof smart watch with heart rate monitor, sleep tracking, and built-in GPS.',
    initialStock: 45,
  },
  {
    id: 3,
    name: '4K Ultra HD Portable Projector',
    sku: 'ELEC-PRJ-003',
    price: 349,
    categoryId: 1,
    description:
      'Mini LED projector with built-in speakers, HDMI, and screen mirroring capability.',
    initialStock: 8,
  },
  {
    id: 4,
    name: 'Mechanical Backlit Keyboard',
    sku: 'ELEC-MBK-004',
    price: 79.99,
    categoryId: 1,
    description:
      'Wired gaming keyboard with customizable RGB backlighting and tactile blue switches.',
    initialStock: 120,
  },
  {
    id: 5,
    name: 'Ergonomic Wireless Mouse',
    sku: 'ELEC-EWM-005',
    price: 24.95,
    categoryId: 1,
    description:
      '2.4GHz wireless mouse with adjustable DPI and comfortable contoured grip.',
    initialStock: 0,
  },
  {
    id: 6,
    name: 'Unisex Organic Cotton Hoodie',
    sku: 'CLOT-OCH-001',
    price: 55,
    categoryId: 2,
    description:
      'Ultra-soft fleece hoodie made from 100% certified organic cotton. Pre-shrunk.',
    initialStock: 250,
  },
  {
    id: 7,
    name: 'Classic Denim Jacket',
    sku: 'CLOT-CDJ-002',
    price: 68,
    categoryId: 2,
    description:
      'Timeless button-front jean jacket with a regular fit and four functional pockets.',
    initialStock: 35,
  },
  {
    id: 8,
    name: 'Breathable Running Socks (3-Pack)',
    sku: 'CLOT-BRS-003',
    price: 14.99,
    categoryId: 2,
    description:
      'Moisture-wicking athletic ankle socks with arch support and cushioned soles.',
    initialStock: 3,
  },
  {
    id: 9,
    name: 'Self-Watering Ceramic Planter',
    sku: 'HOME-SCP-001',
    price: 32.5,
    categoryId: 3,
    description:
      'Stylish terracotta-lined planter with a built-in reservoir to keep plants hydrated.',
    initialStock: 80,
  },
  {
    id: 10,
    name: 'Stainless Steel French Press',
    sku: 'HOME-SFP-002',
    price: 39.99,
    categoryId: 3,
    description:
      'Double-walled insulated coffee maker with a 4-level filtration system.',
    initialStock: 25,
  },
  {
    id: 11,
    name: 'Ultrasonic Cool Mist Humidifier',
    sku: 'HOME-UCH-003',
    price: 45.9,
    categoryId: 3,
    description:
      'Whisper-quiet air humidifier with automatic shut-off and nightlight function.',
    initialStock: 0,
  },
  {
    id: 12,
    name: 'Eco-Friendly TPE Yoga Mat',
    sku: 'SPOR-EYM-001',
    price: 29.99,
    categoryId: 4,
    description:
      'Non-slip 6mm thick workout mat with alignment lines, carrying strap included.',
    initialStock: 110,
  },
  {
    id: 13,
    name: 'Insulated Sports Water Bottle',
    sku: 'SPOR-IWB-002',
    price: 19.99,
    categoryId: 4,
    description:
      'Vacuum-insulated stainless steel bottle that keeps drinks cold for 24 hours.',
    initialStock: 40,
  },
  {
    id: 14,
    name: 'The Art of Clean Code',
    sku: 'BOOK-ACC-001',
    price: 28.5,
    categoryId: 5,
    description:
      'A comprehensive guide to software design principles, refactoring, and craftsmanship.',
    initialStock: 30,
  },
  {
    id: 15,
    name: 'Designing Data-Intensive Systems',
    sku: 'BOOK-DDS-002',
    price: 42,
    categoryId: 5,
    description:
      'Explore the principles, algorithms, and trade-offs of modern backend architectures.',
    initialStock: 4,
  },
];

const seedCategories: CategoryResponseDto[] = [
  {
    id: 1,
    name: 'Electronics',
    slug: 'electronics',
    description: 'Consumer electronics and gadgets',
    isActive: true,
    productCount: 0,
  },
  {
    id: 2,
    name: 'Clothing',
    slug: 'clothing',
    description: 'Apparel and accessories',
    isActive: true,
    productCount: 0,
  },
  {
    id: 3,
    name: 'Home & Garden',
    slug: 'home-garden',
    description: 'Home goods and outdoor living',
    isActive: true,
    productCount: 0,
  },
  {
    id: 4,
    name: 'Sports',
    slug: 'sports',
    description: 'Fitness and outdoor gear',
    isActive: true,
    productCount: 0,
  },
  {
    id: 5,
    name: 'Books',
    slug: 'books',
    description: 'Technical and general reading',
    isActive: true,
    productCount: 0,
  },
];

function categoryNameForId(categoryId: number): string | null {
  return seedCategories.find((category) => category.id === categoryId)?.name ?? null;
}

export function createSeedCategories(): CategoryResponseDto[] {
  return seedCategories.map((category) => ({ ...category }));
}

export function createSeedProducts(): ProductDetailResponseDto[] {
  return productDefs.map((product) => ({
    id: product.id,
    name: product.name,
    slug: slugify(product.name),
    sku: product.sku,
    price: product.price,
    currency: 'USD',
    imageUrl: null,
    categoryId: product.categoryId,
    categoryName: categoryNameForId(product.categoryId),
    isActive: true,
    createdAt: SEED_TIMESTAMP,
    updatedAt: SEED_TIMESTAMP,
    description: product.description,
  }));
}

export function createSeedInventory(): SeedInventoryRow[] {
  return productDefs.map((product) => ({
    productId: product.id,
    availableQuantity: product.initialStock,
  }));
}
