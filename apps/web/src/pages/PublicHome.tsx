import { useEffect, useRef, useState, type ComponentType } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  Check,
  ChevronRight,
  Clock3,
  Coffee,
  Instagram,
  Laptop,
  MapPin,
  Menu,
  MessageCircle,
  Moon,
  Phone,
  ShieldCheck,
  Shirt,
  Sparkles,
  Sun,
  Utensils,
  Wifi,
  X,
} from "lucide-react";
import type { PublicSiteDto, RoomDto } from "@verdant/shared";
import { getSite } from "../api/client";
import { ReservationDialog } from "../components/ReservationDialog";
import { ContactForm } from "../components/ContactForm";

const amenityIcons: Record<string, ComponentType<{ "aria-hidden"?: boolean }>> = {
  wifi: Wifi,
  utensils: Utensils,
  shirt: Shirt,
  shield: ShieldCheck,
  sparkles: Sparkles,
  laptop: Laptop,
};

const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

function ThemeToggle() {
  const [dark, setDark] = useState(() => window.localStorage?.getItem("verdant-theme") === "dark");
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    window.localStorage?.setItem("verdant-theme", dark ? "dark" : "light");
  }, [dark]);
  return (
    <button className="icon-button theme-toggle" onClick={() => setDark((value) => !value)} aria-label={`Switch to ${dark ? "light" : "dark"} theme`}>
      {dark ? <Sun aria-hidden="true" /> : <Moon aria-hidden="true" />}
    </button>
  );
}

function GalleryDialog({ item, onClose }: { item: PublicSiteDto["gallery"][number] | null; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (item) ref.current?.showModal();
    else if (ref.current?.open) ref.current.close();
  }, [item]);
  return (
    <dialog className="lightbox" ref={ref} onClose={onClose} onCancel={onClose}>
      {item && (
        <>
          <button className="icon-button" onClick={() => ref.current?.close()} aria-label="Close image"><X aria-hidden="true" /></button>
          <img src={item.imageUrl} alt={item.alt} />
          <p>{item.title}</p>
        </>
      )}
    </dialog>
  );
}

function Header({ onReserve }: { onReserve: () => void }) {
  const [open, setOpen] = useState(false);
  const links = [["Rooms", "#rooms"], ["Included", "#included"], ["Meals", "#meals"], ["Our house", "#story"], ["Contact", "#contact"]];
  return (
    <header className="site-header">
      <a className="brand" href="#" aria-label="Verdant House home"><span className="brand-mark">V</span><span>Verdant House</span></a>
      <nav className={open ? "site-nav open" : "site-nav"} aria-label="Main navigation">
        {links.map(([label, href]) => <a key={href} href={href} onClick={() => setOpen(false)}>{label}</a>)}
        <button className="button accent nav-reserve" onClick={() => { setOpen(false); onReserve(); }}>Check a room</button>
      </nav>
      <div className="header-actions">
        <ThemeToggle />
        <button className="icon-button menu-button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="mobile-navigation" aria-label={open ? "Close menu" : "Open menu"}>{open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button>
      </div>
    </header>
  );
}

function Rooms({ rooms, onReserve }: { rooms: RoomDto[]; onReserve: (id: string) => void }) {
  return (
    <section className="section rooms-section" id="rooms">
      <div className="section-heading split-heading">
        <h2>Rooms that work<br />as hard as you do.</h2>
        <p>Every room has a real desk, proper storage, and transparent monthly terms. The number shown is today’s indicative availability.</p>
      </div>
      <div className="room-list">
        {rooms.map((room, index) => (
          <article className="room-row" key={room.id}>
            <div className="room-image-wrap">
              <img src={room.imageUrl} alt={`${room.name} at Verdant House`} loading={index ? "lazy" : "eager"} />
              <span className={room.availableUnits ? "availability open" : "availability waitlist"}>
                <span aria-hidden="true" />{room.availableUnits ? `${room.availableUnits} ${room.availableUnits === 1 ? "room" : "rooms"} open` : "Join the waitlist"}
              </span>
            </div>
            <div className="room-copy">
              <div>
                <p className="room-kind">{room.capacity === 1 ? "Private room" : `${room.capacity}-person share`} · from</p>
                <h3>{room.name}</h3>
              </div>
              <p>{room.description}</p>
              <div className="room-facts">
                <span><BedDouble aria-hidden="true" /> {room.capacity === 1 ? "Single occupancy" : "Twin occupancy"}</span>
                <span><Check aria-hidden="true" /> Meals & housekeeping</span>
              </div>
              <div className="room-bottom">
                <p><strong>{money.format(room.monthlyPrice)}</strong><span>/ month</span><small>{money.format(room.deposit)} refundable deposit</small></p>
                <button className="text-button" onClick={() => onReserve(room.id)}>{room.availableUnits ? "Enquire for this room" : "Join its waitlist"} <ArrowRight aria-hidden="true" /></button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function PublicHome() {
  const { data, isLoading, isError } = useQuery({ queryKey: ["site"], queryFn: getSite });
  const [selectedRoom, setSelectedRoom] = useState<string>();
  const [reservationOpen, setReservationOpen] = useState(false);
  const [mealIndex, setMealIndex] = useState(0);
  const [galleryItem, setGalleryItem] = useState<PublicSiteDto["gallery"][number] | null>(null);

  if (isLoading) return <main className="page-loading" aria-busy="true"><div className="skeleton hero-skeleton" /><div className="skeleton line-skeleton" /></main>;
  if (isError || !data) return <main className="page-error"><h1>The courtyard is momentarily quiet.</h1><p>We couldn’t load the house details. Please refresh or contact us directly.</p><button className="button primary" onClick={() => location.reload()}>Try again</button></main>;

  const { property, rooms, amenities, gallery, mealPlans, testimonials, faqs } = data;
  function reserve(roomId?: string) {
    setSelectedRoom(roomId);
    setReservationOpen(true);
  }
  const meal = mealPlans[mealIndex];

  return (
    <>
      <div className="hero" style={{ "--hero-image": `url(${property.heroImageUrl})` } as React.CSSProperties}>
        <Header onReserve={() => reserve()} />
        <motion.div className="hero-copy" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <p className="hero-kicker"><MapPin aria-hidden="true" /> Indiranagar · Bengaluru</p>
          <h1>{property.tagline}</h1>
          <p>{property.description}</p>
          <div className="hero-actions">
            <button className="button accent" onClick={() => reserve()}>Find your room <ArrowRight aria-hidden="true" /></button>
            <a className="button hero-quiet" href="#rooms">See the rooms <ArrowDown aria-hidden="true" /></a>
          </div>
        </motion.div>
        <div className="hero-note"><Clock3 aria-hidden="true" /><span><strong>Visits available</strong>Every day, 9 am–7 pm</span></div>
      </div>

      <main id="main">
        <section className="trust-strip" aria-label="House highlights">
          <div><strong>12 min</strong><span>walk to Indiranagar Metro</span></div>
          <div><strong>2 daily</strong><span>freshly cooked meals</span></div>
          <div><strong>24/7</strong><span>power backup & security</span></div>
          <div><strong>One bill</strong><span>rent, Wi-Fi and care</span></div>
        </section>

        <Rooms rooms={rooms} onReserve={reserve} />

        <section className="included-section" id="included">
          <div className="included-title">
            <p>Not add-ons. Just how the house works.</p>
            <h2>Care is included.</h2>
          </div>
          <div className="amenity-list">
            {amenities.map((amenity, index) => {
              const Icon = amenityIcons[amenity.icon] ?? Sparkles;
              return <article key={amenity.id}><span className="amenity-number">{String(index + 1).padStart(2, "0")}</span><Icon aria-hidden /><div><h3>{amenity.name}</h3><p>{amenity.description}</p></div></article>;
            })}
          </div>
        </section>

        <section className="meals-section" id="meals">
          <div className="meal-photo"><img src={gallery[0]?.imageUrl} alt={gallery[0]?.alt ?? "Shared kitchen at Verdant House"} loading="lazy" /><p><Coffee aria-hidden="true" />Breakfast, dinner, and good chai in between.</p></div>
          <div className="meal-copy">
            <h2>Food you’ll look forward to coming home for.</h2>
            <p>Our vegetarian menu is cooked in-house, shaped by resident feedback, and changes with the season.</p>
            <div className="meal-tabs" role="tablist" aria-label="Weekly meal plan">
              {mealPlans.map((item, index) => <button key={item.id} role="tab" aria-selected={mealIndex === index} onClick={() => setMealIndex(index)}>{item.days}</button>)}
            </div>
            {meal && <div className="meal-detail" role="tabpanel"><strong>{meal.name}</strong><p>{meal.description}</p></div>}
            <p className="diet-note">Allergies or dietary needs? Tell us during your visit and we’ll explain what we can safely accommodate.</p>
          </div>
        </section>

        <section className="section gallery-section" id="gallery">
          <div className="section-heading"><h2>A house with room<br />to exhale.</h2><p>Tap any photograph for a closer look.</p></div>
          <div className="gallery-grid">
            {gallery.map((item, index) => <button key={item.id} className={`gallery-item item-${index + 1}`} onClick={() => setGalleryItem(item)}><img src={item.imageUrl} alt={item.alt} loading="lazy" /><span>{item.title}<ArrowUpRight aria-hidden="true" /></span></button>)}
          </div>
        </section>

        <section className="story-section" id="story">
          <div className="story-mark">VH</div>
          <div className="story-copy">
            <h2>Built like a home.<br />Run like a promise.</h2>
            <p>{property.story}</p>
            <blockquote>“No mystery charges, no staged photos, no disappearing after move-in.”</blockquote>
            <p className="signature">— Mira & Dev, house stewards</p>
          </div>
          <div className="story-facts"><span><strong>2021</strong>doors opened</span><span><strong>28</strong>residents at most</span><span><strong>2</strong>on-site stewards</span></div>
        </section>

        <section className="testimonials-section">
          <h2>Notes from people<br />who’ve lived here.</h2>
          <div className="testimonial-list">
            {testimonials.map((item) => <figure key={item.id}><blockquote>“{item.quote}”</blockquote><figcaption><span>{item.author}</span>{item.role}</figcaption></figure>)}
          </div>
        </section>

        <section className="section faq-section" id="faq">
          <div className="section-heading"><h2>Before you ask.</h2><p>And if it isn’t here, we’re a phone call away.</p></div>
          <div className="faq-list">
            {faqs.map((faq) => <details key={faq.id}><summary>{faq.question}<ChevronRight aria-hidden="true" /></summary><p>{faq.answer}</p></details>)}
          </div>
        </section>

        <section className="contact-section" id="contact">
          <div className="contact-details">
            <p className="contact-intro">Come see whether it feels like home.</p>
            <h2>Visit the courtyard.</h2>
            <address><span><MapPin aria-hidden="true" />{property.address}<br />{property.city}</span><a href={`tel:${property.phone.replace(/\s/g, "")}`}><Phone aria-hidden="true" />{property.phone}</a><a href={`https://wa.me/${property.whatsapp}`} target="_blank" rel="noreferrer"><MessageCircle aria-hidden="true" />Chat on WhatsApp</a></address>
            <a className="map-link" href={property.mapUrl} target="_blank" rel="noreferrer">Open in maps <ArrowUpRight aria-hidden="true" /></a>
          </div>
          <ContactForm />
        </section>
      </main>

      <footer>
        <div className="footer-brand"><span className="brand-mark">V</span><div><strong>{property.name}</strong><span>A calmer way to live.</span></div></div>
        <div><a href="#rooms">Rooms</a><a href="#included">Included</a><a href="#faq">FAQs</a><a href="/admin">House admin</a></div>
        <div><a href={`mailto:${property.email}`}>{property.email}</a><a href="https://instagram.com" target="_blank" rel="noreferrer"><Instagram aria-hidden="true" /> Instagram</a></div>
        <p>© {new Date().getFullYear()} Verdant House. Demo property content.</p>
      </footer>

      <ReservationDialog open={reservationOpen} rooms={rooms} initialRoomId={selectedRoom} onClose={() => setReservationOpen(false)} />
      <GalleryDialog item={galleryItem} onClose={() => setGalleryItem(null)} />
    </>
  );
}
