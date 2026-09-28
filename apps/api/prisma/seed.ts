import "dotenv/config";
import { pathToFileURL } from "node:url";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const images = {
  hero: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=85",
  studio: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80",
  twin: "https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1200&q=80",
  kitchen: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=1200&q=80",
  lounge: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80",
};

export async function seed(prisma: PrismaClient) {
  const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set before seeding.");
  }
  if (password.length < 14 || /change-me|password|verdant/i.test(password)) {
    throw new Error("ADMIN_PASSWORD must be at least 14 characters and must not be a known placeholder.");
  }
  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.admin.upsert({
    where: { email },
    update: { passwordHash, active: true },
    create: { email, passwordHash, name: "House Owner", role: "OWNER" },
  });

  const property = {
    name: "Verdant House",
    tagline: "A calmer way to live in Bengaluru.",
    description: "Considered rooms, nourishing meals, and a courtyard-minded community for people building their next chapter.",
    story: "We converted a family home in Indiranagar into a small shared residence with the things renters told us they missed most: honest terms, real workspaces, daily food, and people who know their name.",
    address: "18, 12th Cross, Indiranagar",
    city: "Bengaluru, Karnataka 560038",
    phone: "+91 80471 29820",
    email: "hello@verdanthouse.in",
    whatsapp: "918047129820",
    mapUrl: "https://maps.google.com/?q=Indiranagar+Bengaluru",
    heroImageUrl: images.hero,
  };
  const existingProperty = await prisma.property.findFirst();
  if (existingProperty) await prisma.property.update({ where: { id: existingProperty.id }, data: property });
  else await prisma.property.create({ data: property });

  const rooms = [
    { slug: "courtyard-studio", name: "Courtyard Studio", description: "A private, sunlit room with an ensuite bath, writing desk, generous storage, and courtyard outlook.", monthlyPrice: 24000, deposit: 30000, capacity: 1, totalUnits: 4, availableUnits: 2, imageUrl: images.studio, featured: true, sortOrder: 1 },
    { slug: "garden-twin", name: "Garden Twin", description: "A spacious twin-share room with two proper desks, individual wardrobes, an ensuite bath, and leafy morning light.", monthlyPrice: 15500, deposit: 20000, capacity: 2, totalUnits: 6, availableUnits: 3, imageUrl: images.twin, featured: false, sortOrder: 2 },
    { slug: "terrace-single", name: "Terrace Single", description: "A quiet private room near the roof garden with a dedicated workspace and a shared bath maintained daily.", monthlyPrice: 19500, deposit: 25000, capacity: 1, totalUnits: 3, availableUnits: 0, imageUrl: images.lounge, featured: false, sortOrder: 3 },
  ];
  for (const room of rooms) {
    await prisma.roomType.upsert({ where: { slug: room.slug }, update: room, create: room });
  }

  await prisma.amenity.deleteMany();
  await prisma.amenity.createMany({ data: [
    { name: "Fibre-fast Wi-Fi", description: "Dual connections and power backup for uninterrupted work.", icon: "wifi", sortOrder: 1 },
    { name: "Breakfast & dinner", description: "Fresh vegetarian meals, six days a week.", icon: "utensils", sortOrder: 2 },
    { name: "Laundry included", description: "Two machine loads per resident each week.", icon: "shirt", sortOrder: 3 },
    { name: "Always secure", description: "Resident access, CCTV at entries, and an on-site steward.", icon: "shield", sortOrder: 4 },
    { name: "Weekly housekeeping", description: "Rooms and shared spaces cared for on a predictable schedule.", icon: "sparkles", sortOrder: 5 },
    { name: "Work-ready spaces", description: "Ergonomic desks in every room and quiet common areas.", icon: "laptop", sortOrder: 6 },
  ]});
  await prisma.galleryItem.deleteMany();
  await prisma.galleryItem.createMany({ data: [
    { title: "The shared kitchen", imageUrl: images.kitchen, alt: "Bright shared kitchen with oak cabinets and a long preparation counter", sortOrder: 1 },
    { title: "Courtyard Studio", imageUrl: images.studio, alt: "Sunlit private bedroom with a desk beside a large window", sortOrder: 2 },
    { title: "Evening lounge", imageUrl: images.lounge, alt: "Comfortable residents' lounge arranged for conversation", sortOrder: 3 },
    { title: "Garden Twin", imageUrl: images.twin, alt: "Airy twin room with matching beds and individual reading lights", sortOrder: 4 },
  ]});
  await prisma.mealPlan.deleteMany();
  await prisma.mealPlan.createMany({ data: [
    { name: "Monday", description: "Idli, sambar & fruit · phulka, dal tadka, beans palya", days: "Mon", sortOrder: 1 },
    { name: "Tuesday", description: "Poha & bananas · lemon rice, chana masala, curd", days: "Tue", sortOrder: 2 },
    { name: "Wednesday", description: "Dosa & chutney · chapati, paneer curry, salad", days: "Wed", sortOrder: 3 },
    { name: "Thursday", description: "Upma & fruit · vegetable pulao, raita, dal", days: "Thu", sortOrder: 4 },
    { name: "Friday", description: "Paratha & curd · roti, rajma, seasonal sabzi", days: "Fri", sortOrder: 5 },
    { name: "Saturday", description: "Pongal & chutney · house biryani, raita, sweet", days: "Sat", sortOrder: 6 },
  ]});
  await prisma.testimonial.deleteMany();
  await prisma.testimonial.createMany({ data: [
    { quote: "I moved to Bengaluru knowing no one. Verdant felt settled from the first week—and the internet is genuinely reliable.", author: "Nisha K.", role: "Product designer", sortOrder: 1 },
    { quote: "The terms were exactly as explained, the room looked like the photos, and I could focus on a new job instead of setting up a flat.", author: "Arjun M.", role: "Data analyst", sortOrder: 2 },
  ]});
  await prisma.faq.deleteMany();
  await prisma.faq.createMany({ data: [
    { question: "Is an enquiry a confirmed booking?", answer: "No. We first check the room, dates, and fit with you. Your stay is confirmed only after our team contacts you and records the confirmation.", sortOrder: 1 },
    { question: "What is included in the monthly rent?", answer: "Wi-Fi, breakfast and dinner six days a week, weekly housekeeping, two laundry loads, utilities within a fair-use allowance, and access to all shared areas.", sortOrder: 2 },
    { question: "Can I visit before deciding?", answer: "Absolutely. Submit an enquiry or contact us directly and we will arrange an in-person or video tour.", sortOrder: 3 },
    { question: "What is the minimum stay?", answer: "Our usual minimum is three months. Shorter stays may be available between longer residencies—ask and we will check.", sortOrder: 4 },
  ]});
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const prisma = new PrismaClient();
  seed(prisma)
    .then(() => console.log("Seed complete"))
    .catch((error: unknown) => {
      console.error(error);
      process.exitCode = 1;
    })
    .finally(() => prisma.$disconnect());
}
