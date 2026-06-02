/**
 * Seed: a demo tenant, a platform Super Admin, a tenant admin, a couple of
 * categories + services, and a demo customer. Safe to run repeatedly (upserts).
 *
 *   npm run db:seed
 *
 * Default credentials (CHANGE in any real environment):
 *   Super Admin : super@harmonia.test  / Passw0rd!
 *   Tenant Admin: admin@marrakech.test / Passw0rd!
 *   Customer    : guest@marrakech.test / Passw0rd!
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PASSWORD = 'Passw0rd!';

async function main() {
  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // Platform super admin (no tenant).
  await prisma.user.upsert({
    where: { email: 'super@harmonia.test' },
    update: {},
    create: {
      email: 'super@harmonia.test',
      name: 'Harmonia Super Admin',
      role: 'SUPER_ADMIN',
      passwordHash,
    },
  });

  // Demo tenant.
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'marrakech-luxury' },
    update: {},
    create: {
      slug: 'marrakech-luxury',
      name: 'Marrakech Luxury Concierge',
      status: 'ACTIVE',
      description: 'Bespoke concierge & experiences in Marrakech.',
      contactEmail: 'hello@marrakech.test',
      defaultCurrency: 'MAD',
      defaultLocale: 'fr',
    },
  });

  // Tenant admin.
  await prisma.user.upsert({
    where: { email: 'admin@marrakech.test' },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@marrakech.test',
      name: 'Marrakech Admin',
      role: 'TENANT_ADMIN',
      passwordHash,
    },
  });

  // Categories.
  const adventure = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'adventure' } },
    update: {},
    create: { tenantId: tenant.id, slug: 'adventure', name: 'Adventure', sortOrder: 1 },
  });
  const wellness = await prisma.category.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'wellness' } },
    update: {},
    create: { tenantId: tenant.id, slug: 'wellness', name: 'Wellness', sortOrder: 2 },
  });

  // Services.
  await prisma.service.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'desert-excursion' } },
    update: {},
    create: {
      tenantId: tenant.id,
      categoryId: adventure.id,
      slug: 'desert-excursion',
      title: 'Agafay Desert Excursion',
      subtitle: 'Sunset, dunes & a Berber dinner',
      description: 'A guided half-day excursion into the Agafay desert.',
      priceCents: 25000,
      currency: 'MAD',
      priceMode: 'PER_PERSON',
      durationMinutes: 240,
      capacity: 8,
      maxPeople: 8,
      featured: true,
      tags: ['Désert', 'Coucher de soleil', 'Dîner berbère'],
      coverUrl:
        'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1200&q=80',
      thumbUrl:
        'https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=600&q=70',
    },
  });
  await prisma.service.upsert({
    where: { tenantId_slug: { tenantId: tenant.id, slug: 'hammam-ritual' } },
    update: {},
    create: {
      tenantId: tenant.id,
      categoryId: wellness.id,
      slug: 'hammam-ritual',
      title: 'Traditional Hammam Ritual',
      subtitle: 'Argan oil & black soap',
      description: 'An authentic hammam & massage ritual.',
      priceCents: 20000,
      currency: 'MAD',
      priceMode: 'PER_PERSON',
      durationMinutes: 90,
      capacity: 4,
      maxPeople: 4,
      tags: ['Bien-être', 'Argan', 'Spa'],
      coverUrl:
        'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=1200&q=80',
      thumbUrl:
        'https://images.unsplash.com/photo-1610348725531-843dff563e2c?w=600&q=70',
    },
  });

  // Demo customer.
  await prisma.customer.upsert({
    where: { tenantId_email: { tenantId: tenant.id, email: 'guest@marrakech.test' } },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'guest@marrakech.test',
      name: 'Demo Guest',
      passwordHash,
      emailVerifiedAt: new Date(),
    },
  });

  console.log('✓ Seed complete.');
  console.log('  Super Admin : super@harmonia.test  / Passw0rd!');
  console.log('  Tenant Admin: admin@marrakech.test / Passw0rd!');
  console.log('  Customer    : guest@marrakech.test / Passw0rd!');
  console.log(`  Tenant slug : ${tenant.slug}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
