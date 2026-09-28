import type { PublicSiteDto } from "@verdant/shared";

export const demoSite: PublicSiteDto = {
  property: {
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
    heroImageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1800&q=85",
  },
  rooms: [
    { id: "cm12345678901234567890123", slug: "courtyard-studio", name: "Courtyard Studio", description: "A private, sunlit room with an ensuite bath, writing desk, generous storage, and courtyard outlook.", monthlyPrice: 24000, deposit: 30000, capacity: 1, totalUnits: 4, availableUnits: 2, imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80", featured: true, active: true },
    { id: "cm22345678901234567890123", slug: "garden-twin", name: "Garden Twin", description: "A spacious twin-share room with two proper desks, individual wardrobes, an ensuite bath, and leafy morning light.", monthlyPrice: 15500, deposit: 20000, capacity: 2, totalUnits: 6, availableUnits: 3, imageUrl: "https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1200&q=80", featured: false, active: true },
    { id: "cm32345678901234567890123", slug: "terrace-single", name: "Terrace Single", description: "A quiet private room near the roof garden with a dedicated workspace and a shared bath maintained daily.", monthlyPrice: 19500, deposit: 25000, capacity: 1, totalUnits: 3, availableUnits: 0, imageUrl: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80", featured: false, active: true },
  ],
  amenities: [
    { id: "a1", name: "Fibre-fast Wi-Fi", description: "Dual connections and power backup for uninterrupted work.", icon: "wifi" },
    { id: "a2", name: "Breakfast & dinner", description: "Fresh vegetarian meals, six days a week.", icon: "utensils" },
    { id: "a3", name: "Laundry included", description: "Two machine loads per resident each week.", icon: "shirt" },
    { id: "a4", name: "Always secure", description: "Resident access, CCTV at entries, and an on-site steward.", icon: "shield" },
    { id: "a5", name: "Weekly housekeeping", description: "Rooms and shared spaces cared for on a predictable schedule.", icon: "sparkles" },
    { id: "a6", name: "Work-ready spaces", description: "Ergonomic desks in every room and quiet common areas.", icon: "laptop" },
  ],
  gallery: [
    { id: "g1", title: "The shared kitchen", imageUrl: "https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=1200&q=80", alt: "Bright shared kitchen with oak cabinets and a long preparation counter" },
    { id: "g2", title: "Courtyard Studio", imageUrl: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80", alt: "Sunlit private bedroom with a desk beside a large window" },
    { id: "g3", title: "Evening lounge", imageUrl: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1200&q=80", alt: "Comfortable residents' lounge arranged for conversation" },
    { id: "g4", title: "Garden Twin", imageUrl: "https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1200&q=80", alt: "Airy twin room with matching beds and individual reading lights" },
  ],
  mealPlans: [
    { id: "m1", name: "Monday", description: "Idli, sambar & fruit · phulka, dal tadka, beans palya", days: "Mon" },
    { id: "m2", name: "Tuesday", description: "Poha & bananas · lemon rice, chana masala, curd", days: "Tue" },
    { id: "m3", name: "Wednesday", description: "Dosa & chutney · chapati, paneer curry, salad", days: "Wed" },
    { id: "m4", name: "Thursday", description: "Upma & fruit · vegetable pulao, raita, dal", days: "Thu" },
    { id: "m5", name: "Friday", description: "Paratha & curd · roti, rajma, seasonal sabzi", days: "Fri" },
    { id: "m6", name: "Saturday", description: "Pongal & chutney · house biryani, raita, sweet", days: "Sat" },
  ],
  testimonials: [
    { id: "t1", quote: "I moved to Bengaluru knowing no one. Verdant felt settled from the first week—and the internet is genuinely reliable.", author: "Nisha K.", role: "Product designer" },
    { id: "t2", quote: "The terms were exactly as explained, the room looked like the photos, and I could focus on a new job instead of setting up a flat.", author: "Arjun M.", role: "Data analyst" },
  ],
  faqs: [
    { id: "f1", question: "Is an enquiry a confirmed booking?", answer: "No. We first check the room, dates, and fit with you. Your stay is confirmed only after our team contacts you and records the confirmation." },
    { id: "f2", question: "What is included in the monthly rent?", answer: "Wi-Fi, breakfast and dinner six days a week, weekly housekeeping, two laundry loads, utilities within a fair-use allowance, and access to all shared areas." },
    { id: "f3", question: "Can I visit before deciding?", answer: "Absolutely. Submit an enquiry or contact us directly and we will arrange an in-person or video tour." },
    { id: "f4", question: "What is the minimum stay?", answer: "Our usual minimum is three months. Shorter stays may be available between longer residencies—ask and we will check." },
  ],
};
