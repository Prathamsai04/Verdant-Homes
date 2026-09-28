import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import {
  BedDouble,
  BookOpenText,
  Check,
  ChevronDown,
  CircleGauge,
  ClipboardList,
  ExternalLink,
  Home,
  Image,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquareQuote,
  Plus,
  RefreshCw,
  Save,
  Settings2,
  Trash2,
  Utensils,
  X,
} from "lucide-react";
import type { ContactMessageDto, ContentType, ReservationDto, ReservationStatus, RoomDto } from "@verdant/shared";
import { adminRequest, ApiError, currentAdmin, logout, type AdminUser } from "../api/client";

const statusLabels: Record<ReservationStatus, string> = {
  NEW: "New",
  CONTACTED: "Contacted",
  CONFIRMED: "Confirmed",
  WAITLISTED: "Waitlisted",
  CANCELLED: "Cancelled",
  CLOSED: "Closed",
};

function QueryState({ error }: { error?: Error | null }) {
  return error ? <div className="admin-empty"><RefreshCw aria-hidden="true" /><h2>Couldn’t load this view</h2><p>{error.message}</p></div> : <div className="admin-skeleton" aria-busy="true"><span /><span /><span /></div>;
}

function Dashboard() {
  const query = useQuery({ queryKey: ["admin", "dashboard"], queryFn: () => adminRequest<any>("/admin/dashboard") });
  if (!query.data) return <QueryState error={query.error} />;
  const data = query.data;
  const occupied = data.inventory.units - data.inventory.available;
  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><h1>Today at the house</h1><p>Inventory and enquiry activity at a glance.</p></div><a className="button quiet" href="/" target="_blank">View public site <ExternalLink aria-hidden="true" /></a></div>
      <div className="metrics">
        <article><span><ClipboardList aria-hidden="true" /> New enquiries</span><strong>{data.counts.NEW ?? 0}</strong><p>waiting for first contact</p></article>
        <article><span><Check aria-hidden="true" /> Confirmed stays</span><strong>{data.counts.CONFIRMED ?? 0}</strong><p>active in this pipeline</p></article>
        <article><span><BedDouble aria-hidden="true" /> Occupancy</span><strong>{occupied}<small> / {data.inventory.units}</small></strong><p>{data.inventory.available} rooms currently open</p></article>
      </div>
      <section className="admin-section">
        <div className="admin-section-title"><h2>Recent enquiries</h2><NavLink to="/admin/reservations">See all <ExternalLink aria-hidden="true" /></NavLink></div>
        <div className="admin-table">
          <div className="table-head"><span>Reference</span><span>Guest</span><span>Room</span><span>Status</span><span>Received</span></div>
          {data.recent.map((item: any) => <div className="table-row" key={item.id}><span data-label="Reference">{item.reference}</span><span data-label="Guest"><strong>{item.fullName}</strong><small>{item.email}</small></span><span data-label="Room">{item.roomType.name}</span><span data-label="Status"><i className={`status status-${item.status.toLowerCase()}`}>{statusLabels[item.status as ReservationStatus]}</i></span><span data-label="Received">{new Date(item.createdAt).toLocaleDateString("en-IN")}</span></div>)}
        </div>
      </section>
    </div>
  );
}

function Reservations() {
  const client = useQueryClient();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [notice, setNotice] = useState("");
  const query = useQuery({
    queryKey: ["admin", "reservations", q, status, page],
    queryFn: () => adminRequest<{ items: ReservationDto[]; total: number; page: number }>(`/admin/reservations?q=${encodeURIComponent(q)}&page=${page}${status ? `&status=${status}` : ""}`),
  });
  const mutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: ReservationStatus; note?: string }) => adminRequest(`/admin/reservations/${id}/status`, { method: "PATCH", body: JSON.stringify({ status, note }) }),
    onSuccess: () => { setNotice("Reservation updated."); void client.invalidateQueries({ queryKey: ["admin"] }); },
    onError: (error: ApiError) => setNotice(error.message),
  });

  function update(item: ReservationDto, value: ReservationStatus) {
    if (value === "CONFIRMED" && !window.confirm(`Confirm ${item.fullName}? This will claim one ${item.roomType.name} from inventory.`)) return;
    mutation.mutate({ id: item.id, status: value });
  }

  return (
    <div className="admin-page">
      <div className="admin-page-heading"><div><h1>Reservations</h1><p>Qualify enquiries and confirm stays without overselling rooms.</p></div></div>
      <div className="admin-toolbar">
        <label className="search-field"><span className="sr-only">Search reservations</span><input value={q} onChange={(event) => { setQ(event.target.value); setPage(1); }} placeholder="Search name, email or reference" /></label>
        <label><span className="sr-only">Filter by status</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}><option value="">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
        {query.data && <span className="result-count">{query.data.total} enquiries</span>}
      </div>
      {notice && <div className="admin-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss"><X aria-hidden="true" /></button></div>}
      {!query.data ? <QueryState error={query.error} /> : query.data.items.length === 0 ? <div className="admin-empty"><ClipboardList aria-hidden="true" /><h2>No enquiries match</h2><p>Try a different search or status filter.</p></div> : (
        <div className="reservation-list">
          {query.data.items.map((item) => <article key={item.id} className="reservation-record">
            <div className="record-person"><span className="avatar">{item.fullName.slice(0, 1)}</span><div><strong>{item.fullName}</strong><a href={`mailto:${item.email}`}>{item.email}</a><a href={`tel:${item.phone}`}>{item.phone}</a></div></div>
            <div><span className="record-label">Room & move-in</span><strong>{item.roomType.name}</strong><p>{new Date(item.moveInDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {item.stayMonths} months</p></div>
            <div><span className="record-label">Reference</span><strong>{item.reference}</strong><p>{new Date(item.createdAt).toLocaleString("en-IN")}</p></div>
            <label className="status-select"><span className="record-label">Status</span><select value={item.status} disabled={mutation.isPending} onChange={(event) => update(item, event.target.value as ReservationStatus)}>{Object.entries(statusLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            {(item.message || item.occupation) && <details><summary>Guest details <ChevronDown aria-hidden="true" /></summary>{item.occupation && <p><strong>Occupation:</strong> {item.occupation}</p>}{item.message && <p>{item.message}</p>}</details>}
          </article>)}
        </div>
      )}
      {query.data && query.data.total > 25 && <div className="admin-toolbar" aria-label="Reservation pages">
        <button className="button quiet" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button>
        <span className="result-count">Page {page} of {Math.ceil(query.data.total / 25)}</span>
        <button className="button quiet" disabled={page >= Math.ceil(query.data.total / 25)} onClick={() => setPage((value) => value + 1)}>Next</button>
      </div>}
    </div>
  );
}

function ContactMessages() {
  const client = useQueryClient();
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["admin", "messages", page],
    queryFn: () => adminRequest<{ items: ContactMessageDto[]; total: number; page: number }>(`/admin/messages?page=${page}`),
  });
  const mutation = useMutation({
    mutationFn: ({ id, handled }: { id: string; handled: boolean }) => adminRequest(`/admin/messages/${id}`, { method: "PATCH", body: JSON.stringify({ handled }) }),
    onSuccess: () => void client.invalidateQueries({ queryKey: ["admin", "messages"] }),
  });
  return <div className="admin-page">
    <div className="admin-page-heading"><div><h1>Contact messages</h1><p>Track direct questions that arrive outside the reservation flow.</p></div></div>
    {!query.data ? <QueryState error={query.error} /> : query.data.items.length === 0 ? <div className="admin-empty"><MessageSquareQuote aria-hidden="true" /><h2>No contact messages yet</h2></div> : <div className="reservation-list">
      {query.data.items.map((item) => <article key={item.id} className="reservation-record">
        <div className="record-person"><span className="avatar">{item.fullName.slice(0, 1)}</span><div><strong>{item.fullName}</strong><a href={`mailto:${item.email}`}>{item.email}</a>{item.phone && <a href={`tel:${item.phone}`}>{item.phone}</a>}</div></div>
        <div><span className="record-label">Received</span><strong>{new Date(item.createdAt).toLocaleDateString("en-IN")}</strong><p>{new Date(item.createdAt).toLocaleTimeString("en-IN")}</p></div>
        <div><span className="record-label">Message</span><p>{item.message}</p></div>
        <button className={item.handledAt ? "button quiet" : "button primary"} disabled={mutation.isPending} onClick={() => mutation.mutate({ id: item.id, handled: !item.handledAt })}>{item.handledAt ? "Mark open" : "Mark handled"}</button>
      </article>)}
    </div>}
    {query.data && query.data.total > 25 && <div className="admin-toolbar" aria-label="Contact message pages"><button className="button quiet" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>Previous</button><span className="result-count">Page {page} of {Math.ceil(query.data.total / 25)}</span><button className="button quiet" disabled={page >= Math.ceil(query.data.total / 25)} onClick={() => setPage((value) => value + 1)}>Next</button></div>}
  </div>;
}

function RoomsAdmin() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "rooms"], queryFn: () => adminRequest<RoomDto[]>("/admin/rooms") });
  const mutation = useMutation({ mutationFn: ({ id, data }: { id: string; data: Partial<RoomDto> }) => adminRequest(`/admin/rooms/${id}`, { method: "PATCH", body: JSON.stringify(data) }), onSuccess: () => void client.invalidateQueries({ queryKey: ["admin"] }) });
  const [creating, setCreating] = useState(false);

  function saveRoom(event: FormEvent<HTMLFormElement>, room: RoomDto) {
    const data = new FormData(event.currentTarget);
    mutation.mutate({ id: room.id, data: { monthlyPrice: Number(data.get("monthlyPrice")), totalUnits: Number(data.get("totalUnits")), availableUnits: Number(data.get("availableUnits")), active: data.get("active") === "on" } });
  }
  async function createRoom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const d = new FormData(form);
    await adminRequest("/admin/rooms", { method: "POST", body: JSON.stringify({ name: d.get("name"), slug: d.get("slug"), description: d.get("description"), monthlyPrice: Number(d.get("monthlyPrice")), deposit: Number(d.get("deposit")), totalUnits: Number(d.get("totalUnits")), availableUnits: Number(d.get("availableUnits")), capacity: Number(d.get("capacity")), imageUrl: d.get("imageUrl"), active: true, featured: false }) });
    form.reset(); setCreating(false); await client.invalidateQueries({ queryKey: ["admin"] });
  }

  return <div className="admin-page">
    <div className="admin-page-heading"><div><h1>Rooms & inventory</h1><p>Public availability changes immediately. Confirmations claim inventory automatically.</p></div><button className="button primary" onClick={() => setCreating((value) => !value)}><Plus aria-hidden="true" /> Add room</button></div>
    {creating && <form className="admin-editor create-room" onSubmit={(event) => void createRoom(event)}>
      <div className="admin-section-title"><h2>New room type</h2><button type="button" className="icon-button" onClick={() => setCreating(false)} aria-label="Close"><X aria-hidden="true" /></button></div>
      <label className="field"><span>Name</span><input name="name" required /></label><label className="field"><span>Slug</span><input name="slug" pattern="[a-z0-9-]+" required /></label>
      <label className="field full"><span>Description</span><textarea name="description" minLength={20} required /></label>
      <label className="field"><span>Monthly price</span><input name="monthlyPrice" type="number" min="1" required /></label><label className="field"><span>Deposit</span><input name="deposit" type="number" min="0" required /></label>
      <label className="field"><span>Total units</span><input name="totalUnits" type="number" min="0" required /></label><label className="field"><span>Available now</span><input name="availableUnits" type="number" min="0" required /></label>
      <label className="field"><span>Capacity</span><input name="capacity" type="number" min="1" max="4" required /></label><label className="field full"><span>Image URL</span><input name="imageUrl" type="url" required /></label>
      <button className="button primary"><Save aria-hidden="true" /> Create room</button>
    </form>}
    {!query.data ? <QueryState error={query.error} /> : <div className="inventory-list">{query.data.map((room) => <form className="inventory-row" key={room.id} onSubmit={(event) => { event.preventDefault(); saveRoom(event, room); }}>
      <img src={room.imageUrl} alt="" /><div className="inventory-name"><strong>{room.name}</strong><span>{room.capacity === 1 ? "Private" : `${room.capacity}-share`}</span></div>
      <label><span>Monthly ₹</span><input name="monthlyPrice" type="number" defaultValue={room.monthlyPrice} min="1" /></label><label><span>Total</span><input name="totalUnits" type="number" defaultValue={room.totalUnits} min="0" /></label><label><span>Available</span><input name="availableUnits" type="number" defaultValue={room.availableUnits} min="0" /></label>
      <label className="switch"><input name="active" type="checkbox" defaultChecked={room.active} /><span>Public</span></label><button className="button quiet" disabled={mutation.isPending}><Save aria-hidden="true" /> Save</button>
    </form>)}</div>}
  </div>;
}

const contentMeta: Record<ContentType, { label: string; icon: typeof Home; fields: Array<[string, string, "text" | "url" | "textarea"]> }> = {
  amenities: { label: "Amenities", icon: Settings2, fields: [["name", "Name", "text"], ["description", "Description", "textarea"], ["icon", "Icon key", "text"]] },
  gallery: { label: "Gallery", icon: Image, fields: [["title", "Title", "text"], ["imageUrl", "Image URL", "url"], ["alt", "Image description", "textarea"]] },
  "meal-plans": { label: "Meal plans", icon: Utensils, fields: [["name", "Day name", "text"], ["days", "Short day", "text"], ["description", "Menu", "textarea"]] },
  testimonials: { label: "Testimonials", icon: MessageSquareQuote, fields: [["author", "Author", "text"], ["role", "Role", "text"], ["quote", "Quote", "textarea"]] },
  faqs: { label: "FAQs", icon: BookOpenText, fields: [["question", "Question", "text"], ["answer", "Answer", "textarea"]] },
};

function ContentAdmin() {
  const client = useQueryClient();
  const [type, setType] = useState<ContentType>("amenities");
  const [creating, setCreating] = useState(false);
  const meta = contentMeta[type]!;
  const query = useQuery({ queryKey: ["admin", "content", type], queryFn: () => adminRequest<any[]>(`/admin/content/${type}`) });
  const save = useMutation({ mutationFn: ({ id, data }: any) => adminRequest(`/admin/content/${type}/${id}`, { method: "PATCH", body: JSON.stringify(data) }), onSuccess: () => void client.invalidateQueries({ queryKey: ["admin", "content", type] }) });

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = Object.fromEntries(new FormData(form));
    await adminRequest(`/admin/content/${type}`, { method: "POST", body: JSON.stringify({ ...values, sortOrder: query.data?.length ?? 0, active: true }) });
    form.reset(); setCreating(false); await client.invalidateQueries({ queryKey: ["admin", "content", type] });
  }
  function update(event: FormEvent<HTMLFormElement>, item: any) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget));
    save.mutate({ id: item.id, data: { ...data, sortOrder: Number(data.sortOrder), active: data.active === "on" } });
  }

  return <div className="admin-page">
    <div className="admin-page-heading"><div><h1>Public content</h1><p>Keep the story accurate, ordered, and visible.</p></div><button className="button primary" onClick={() => setCreating((value) => !value)}><Plus aria-hidden="true" /> Add {meta.label.toLowerCase()}</button></div>
    <div className="content-tabs" role="tablist">{(Object.keys(contentMeta) as ContentType[]).map((key) => { const itemMeta = contentMeta[key]!; const Icon = itemMeta.icon; return <button key={key} role="tab" aria-selected={type === key} onClick={() => { setType(key); setCreating(false); }}><Icon aria-hidden="true" />{itemMeta.label}</button>; })}</div>
    {creating && <form className="admin-editor" onSubmit={(event) => void create(event)}><h2>New {meta.label.toLowerCase()}</h2>{meta.fields.map(([name, label, kind]) => <label className="field" key={name}><span>{label}</span>{kind === "textarea" ? <textarea name={name} required /> : <input name={name} type={kind} required />}</label>)}<button className="button primary"><Save aria-hidden="true" /> Add</button></form>}
    {!query.data ? <QueryState error={query.error} /> : <div className="content-list">{query.data.map((item, index) => <form key={item.id} className="content-row" onSubmit={(event) => update(event, item)}>
      <span className="drag-order">{index + 1}</span>{meta.fields.map(([name, label, kind], fieldIndex) => <label className={fieldIndex === 1 ? "content-wide" : ""} key={name}><span>{label}</span>{kind === "textarea" ? <textarea name={name} defaultValue={item[name]} rows={2} /> : <input name={name} type={kind} defaultValue={item[name]} />}</label>)}
      <label><span>Order</span><input name="sortOrder" type="number" defaultValue={item.sortOrder} /></label><label className="switch"><input name="active" type="checkbox" defaultChecked={item.active} /><span>Visible</span></label>
      <button className="icon-button save-icon" aria-label="Save item"><Save aria-hidden="true" /></button><button type="button" className="icon-button danger-icon" aria-label="Hide item" onClick={() => save.mutate({ id: item.id, data: { active: false } })}><Trash2 aria-hidden="true" /></button>
    </form>)}</div>}
  </div>;
}

function PropertyAdmin() {
  const client = useQueryClient();
  const query = useQuery({ queryKey: ["admin", "property"], queryFn: () => adminRequest<any>("/admin/property") });
  const mutation = useMutation({ mutationFn: (data: any) => adminRequest("/admin/property", { method: "PATCH", body: JSON.stringify(data) }), onSuccess: () => void client.invalidateQueries({ queryKey: ["admin"] }) });
  if (!query.data) return <QueryState error={query.error} />;
  const fields: Array<[string, string]> = [["name", "House name"], ["tagline", "Tagline"], ["description", "Short description"], ["story", "House story"], ["address", "Street address"], ["city", "City & postcode"], ["phone", "Phone"], ["email", "Email"], ["whatsapp", "WhatsApp number"], ["mapUrl", "Map URL"], ["heroImageUrl", "Hero image URL"]];
  return <div className="admin-page"><div className="admin-page-heading"><div><h1>Property profile</h1><p>Identity and contact details shown across the public site.</p></div></div><form className="property-form" onSubmit={(event) => { event.preventDefault(); mutation.mutate(Object.fromEntries(new FormData(event.currentTarget))); }}>{fields.map(([name, label]) => <label className={`field ${name === "description" || name === "story" ? "full" : ""}`} key={name}><span>{label}</span>{name === "description" || name === "story" ? <textarea name={name} rows={name === "story" ? 5 : 3} defaultValue={query.data[name]} /> : <input name={name} type={name.includes("Url") ? "url" : name === "email" ? "email" : "text"} defaultValue={query.data[name]} />}</label>)}<button className="button primary" disabled={mutation.isPending}><Save aria-hidden="true" />{mutation.isPending ? "Saving…" : "Save profile"}</button>{mutation.isSuccess && <span className="saved-message"><Check aria-hidden="true" /> Saved</span>}</form></div>;
}

function AdminShell({ user }: { user: AdminUser }) {
  const navigate = useNavigate();
  const [mobileNav, setMobileNav] = useState(false);
  useEffect(() => {
    const handleExpiredSession = () => navigate("/admin/login", { replace: true });
    window.addEventListener("verdant:session-expired", handleExpiredSession);
    return () => window.removeEventListener("verdant:session-expired", handleExpiredSession);
  }, [navigate]);
  const links = [
    { href: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
    { href: "/admin/reservations", label: "Reservations", icon: ClipboardList, end: false },
    { href: "/admin/messages", label: "Contact messages", icon: MessageSquareQuote, end: false },
    { href: "/admin/rooms", label: "Rooms & inventory", icon: BedDouble, end: false },
    { href: "/admin/content", label: "Public content", icon: BookOpenText, end: false },
    { href: "/admin/property", label: "Property profile", icon: Home, end: false },
  ];
  async function signOut() { await logout(); navigate("/admin/login", { replace: true }); }
  return <div className="admin-shell">
    <aside className={mobileNav ? "admin-sidebar open" : "admin-sidebar"}>
      <div className="admin-brand"><span className="brand-mark">V</span><div><strong>Verdant House</strong><span>House operations</span></div><button className="icon-button admin-nav-close" onClick={() => setMobileNav(false)}><X aria-hidden="true" /></button></div>
      <nav>{links.map(({ href, label, icon: Icon, end }) => <NavLink key={href} to={href} end={end} onClick={() => setMobileNav(false)}><Icon aria-hidden="true" />{label}</NavLink>)}</nav>
      <div className="admin-user"><span className="avatar">{user.name.slice(0, 1)}</span><div><strong>{user.name}</strong><span>{user.role.toLowerCase()}</span></div><button className="icon-button" onClick={() => void signOut()} aria-label="Sign out"><LogOut aria-hidden="true" /></button></div>
    </aside>
    <div className="admin-main"><header className="admin-mobile-header"><button className="icon-button" onClick={() => setMobileNav(true)}><Menu aria-hidden="true" /></button><strong>Verdant House</strong><span className="avatar">{user.name.slice(0, 1)}</span></header><main id="main"><Routes><Route index element={<Dashboard />} /><Route path="reservations" element={<Reservations />} /><Route path="messages" element={<ContactMessages />} /><Route path="rooms" element={<RoomsAdmin />} /><Route path="content" element={<ContentAdmin />} /><Route path="property" element={<PropertyAdmin />} /><Route path="*" element={<Navigate to="/admin" replace />} /></Routes></main></div>
  </div>;
}

export function AdminApp() {
  const query = useQuery({ queryKey: ["admin", "me"], queryFn: currentAdmin, retry: false });
  if (query.isLoading) return <main className="admin-auth-loading" aria-busy="true"><CircleGauge aria-hidden="true" /><span>Restoring secure session…</span></main>;
  if (query.error) {
    if (query.error instanceof ApiError && query.error.status === 401) return <Navigate to="/admin/login" replace />;
    return <main className="admin-auth-loading"><QueryState error={query.error} /></main>;
  }
  if (!query.data) return <Navigate to="/admin/login" replace />;
  return <AdminShell user={query.data} />;
}
