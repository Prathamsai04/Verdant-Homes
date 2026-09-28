# Beginner Developer Guide

This guide teaches the language, browser, server, database, and tooling concepts used by Verdant House. Read it beside the source files. The goal is not to memorize syntax; it is to understand how data travels through the application.

## 1. A useful mental model

The application has three kinds of code:

1. **Browser code** runs on the visitor's computer. It renders React components and sends HTTP requests.
2. **Server code** runs in Node.js. It validates requests, enforces security and business rules, and returns JSON.
3. **Database code** runs in PostgreSQL. It stores durable data and protects relationships and constraints.

TypeScript is used in both browser and server source code. TypeScript is converted to JavaScript before production execution.

## 2. JavaScript essentials

### Values and variables

```ts
const roomName = "Garden Twin";
let availableUnits = 3;
```

- `const` means the variable cannot be assigned a different value.
- `let` means the variable can be reassigned.
- Prefer `const` unless reassignment is required.

Objects group named values:

```ts
const room = {
  name: "Garden Twin",
  monthlyPrice: 15500,
  active: true,
};
```

Arrays hold ordered values:

```ts
const statuses = ["NEW", "CONTACTED", "CONFIRMED"];
```

### Functions

A function packages reusable behavior:

```ts
function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
```

Arrow functions are a shorter form:

```ts
const submitContact = (input: ContactInput) =>
  request("/public/contact", {
    method: "POST",
    body: JSON.stringify(input),
  });
```

The value before `=>` is the input. The expression after it is returned.

### Array methods

`map` transforms every item:

```tsx
rooms.map((room) => <article key={room.id}>{room.name}</article>);
```

`filter` keeps matching items. `find` returns the first match. `reduce` combines many values into one:

```ts
const totals = rooms.reduce(
  (acc, room) => ({
    units: acc.units + room.totalUnits,
    available: acc.available + room.availableUnits,
  }),
  { units: 0, available: 0 },
);
```

### Destructuring

Destructuring extracts properties:

```ts
const { property, rooms, amenities } = data;
```

It is shorter than writing `data.property`, `data.rooms`, and `data.amenities` repeatedly.

### Spread syntax

Spread copies values into a new object:

```ts
const updated = { ...currentRoom, availableUnits: 2 };
```

In `routes.ts`, conditional spreads build a Prisma filter:

```ts
const where = {
  ...(query.status ? { status: query.status } : {}),
};
```

### Optional chaining and nullish coalescing

```ts
const phone = input.phone ?? null;
const userAgent = request.get("user-agent")?.slice(0, 300) ?? null;
```

- `?.` stops safely when the value is `null` or `undefined`.
- `??` uses the right side only when the left side is `null` or `undefined`.

This differs from `||`, which also treats `0`, `false`, and an empty string as missing.

### Template strings

Backticks insert values into text:

```ts
const reference = `VH-${new Date().getFullYear()}-${randomPart}`;
```

### Async work, promises, and `await`

Database and network operations take time. They return a `Promise`.

```ts
const response = await fetch(`${API_URL}${path}`);
const reservation = await prisma.reservation.create({ data });
```

`await` pauses the current async function until the promise finishes. It does not freeze the entire server.

Multiple independent operations can run together:

```ts
const [items, total] = await Promise.all([
  prisma.reservation.findMany(...),
  prisma.reservation.count(...),
]);
```

### Errors and `try`/`catch`

```ts
try {
  setResult(await submitReservation(values));
} catch (error) {
  setSubmitError(error instanceof ApiError ? error.message : "Unable to submit");
}
```

Code in `try` may fail. `catch` receives the thrown value. The API forwards async route errors to one centralized error handler.

### Modules

Each source file is a module:

```ts
export function createApp() {}
import { createApp } from "./app.js";
```

`export` makes a value available to other files. `import` uses it.

The API uses Node's ESM rules, so compiled server imports include `.js` even though source files are `.ts`.

## 3. TypeScript essentials

JavaScript checks values only while running. TypeScript checks source code before it runs.

### Basic annotations

```ts
function canTransition(from: ReservationStatus, to: ReservationStatus) {
  return from === to || allowedTransitions[from].includes(to);
}
```

Both parameters must be valid reservation statuses.

### Interfaces

An interface describes an object:

```ts
export interface RoomDto {
  id: string;
  name: string;
  monthlyPrice: number;
  active: boolean;
}
```

`RoomDto` is a data-transfer shape shared between the API and browser. It is not a database query by itself.

### Union types

```ts
role: "OWNER" | "MANAGER";
```

The value must be exactly one of those strings.

### Optional and nullable values

```ts
phone?: string;
handledAt: string | null;
```

- `?` means a property may be absent.
- `| null` means the property exists but may intentionally contain `null`.

The repository enables `exactOptionalPropertyTypes`, so absent and explicitly `undefined` are treated carefully.

### Type inference

TypeScript often discovers a type automatically:

```ts
const dark = window.localStorage.getItem("verdant-theme") === "dark";
```

TypeScript infers `dark` is a boolean.

### Generics

Generics let one function preserve different result types:

```ts
async function request<T>(path: string): Promise<T> {
  // ...
}
```

Calling `request<PublicSiteDto>("/public/site")` tells TypeScript what the parsed JSON should look like.

Generics do not validate network data at runtime. Zod handles runtime validation for incoming request bodies.

### `type` imports

```ts
import type { PublicSiteDto } from "@verdant/shared";
```

This import exists only for TypeScript and disappears from JavaScript output.

### Narrowing

```ts
if (error instanceof ApiError && error.status === 401) {
  return <Navigate to="/admin/login" replace />;
}
```

`instanceof` narrows the broad error value to `ApiError`, making `.status` safe to read.

### Strict compiler options

`tsconfig.base.json` enables:

- `strict`: broad strict checking;
- `noUncheckedIndexedAccess`: indexed items may be missing;
- `exactOptionalPropertyTypes`: absent properties are distinct from `undefined`;
- `isolatedModules`: every file must compile independently;
- `verbatimModuleSyntax`: imports and exports are treated precisely.

These checks make mistakes visible before deployment.

## 4. React concepts

### Components

A React component is a function that returns JSX:

```tsx
function ThemeToggle() {
  return <button>Change theme</button>;
}
```

Component names begin with an uppercase letter.

### JSX

JSX looks like HTML but is JavaScript syntax:

```tsx
<button onClick={() => reserve(room.id)}>
  Enquire for this room
</button>
```

Use `className`, not `class`. JavaScript expressions go inside `{}`.

### Props

Props are component inputs:

```tsx
function Rooms({
  rooms,
  onReserve,
}: {
  rooms: RoomDto[];
  onReserve: (id: string) => void;
}) {}
```

The parent passes data and callbacks to the child.

### State with `useState`

State is data that can change and trigger a re-render:

```ts
const [step, setStep] = useState(1);
```

- `step` is the current value.
- `setStep` changes it.
- React calls the component again after the change.

Verdant House uses state for theme, mobile menus, active meal tabs, open dialogs, notices, pagination, and form results.

### Effects with `useEffect`

Effects synchronize React with systems outside rendering:

```ts
useEffect(() => {
  document.documentElement.dataset.theme = dark ? "dark" : "light";
  localStorage.setItem("verdant-theme", dark ? "dark" : "light");
}, [dark]);
```

The dependency array `[dark]` means the effect runs when `dark` changes.

Another effect subscribes to session-expiry events and returns a cleanup function to remove the listener.

### Refs with `useRef`

A ref holds a value without causing a re-render and can point to a DOM element:

```ts
const dialogRef = useRef<HTMLDialogElement>(null);
dialogRef.current?.showModal();
```

The reservation and gallery components use refs to control native dialogs.

### Conditional rendering

```tsx
{result ? <Success /> : <ReservationForm />}
```

The condition chooses which JSX appears.

### Rendering lists and keys

```tsx
faqs.map((faq) => <details key={faq.id}>...</details>);
```

The `key` helps React match list items between renders. Use stable IDs, not random values.

### Providers

Providers make shared services available below them:

```tsx
<QueryClientProvider client={queryClient}>
  <BrowserRouter>
    <App />
  </BrowserRouter>
</QueryClientProvider>
```

TanStack Query and React Router can then be used by any child component.

### Client-side routing

`BrowserRouter` lets the SPA show different components without requesting a new HTML document for every navigation. Nginx must therefore return `index.html` for unknown browser paths.

### Lazy loading and Suspense

```ts
const AdminApp = lazy(() => import("./pages/AdminApp"));
```

This creates a separate JavaScript chunk. `Suspense` displays fallback UI while that chunk loads.

## 5. Server-state concepts with TanStack Query

React state is best for local UI values. **Server state** comes from an API and can become stale.

### Queries

```ts
const query = useQuery({
  queryKey: ["admin", "reservations", q, status, page],
  queryFn: () => adminRequest(...),
});
```

- `queryKey` identifies the cached value.
- `queryFn` fetches it.
- `query.data`, `query.error`, and `query.isLoading` describe the request state.

Changing `q`, `status`, or `page` changes the key and fetches the correct page.

### Mutations

```ts
const mutation = useMutation({
  mutationFn: updateReservation,
  onSuccess: () => client.invalidateQueries({ queryKey: ["admin"] }),
});
```

A mutation changes server data. Invalidating a query tells TanStack Query to fetch fresh data.

## 6. Form concepts

React Hook Form tracks inputs without manually creating state for every field.

```tsx
const {
  register,
  handleSubmit,
  formState: { errors, isSubmitting },
} = useForm({ resolver: zodResolver(schema) });
```

- `register("email")` connects an input.
- `handleSubmit` validates before calling the submit function.
- `errors` contains field errors.
- `isSubmitting` prevents duplicate clicks.

The reservation dialog calls `trigger` to validate only the fields in the current step.

## 7. Zod concepts

Zod defines executable data rules:

```ts
const loginInputSchema = z.object({
  email: z.string().trim().email().max(160),
  password: z.string().min(10).max(128),
});
```

`parse` returns validated data or throws a `ZodError`. `safeParse` returns a success/failure object instead of throwing.

```ts
const input = loginInputSchema.parse(request.body);
```

Zod can also transform values:

```ts
page: z.coerce.number().int().min(1).default(1)
```

Query strings arrive as text, so `coerce.number()` converts `"2"` into `2`.

Sharing schemas means browser validation gives fast feedback while server validation remains the security boundary.

## 8. HTTP and API concepts

### Request and response

An HTTP request contains a method, URL, headers, and sometimes a body. The response contains a status, headers, and body.

### Methods used here

| Method | Meaning in this application |
| --- | --- |
| `GET` | Read data without changing it |
| `POST` | Create data or start a session |
| `PATCH` | Change part of an existing record |
| `DELETE` | Archive public content or rooms |

The delete routes use **soft deletion**: they set `active=false` instead of removing rows.

### Status codes used here

| Code | Meaning |
| --- | --- |
| `200` | Successful read or update |
| `201` | New record created |
| `202` | Duplicate enquiry accepted by reusing an existing reference |
| `204` | Successful logout with no response body |
| `400` | Invalid input |
| `401` | Missing or expired authentication |
| `403` | Authenticated but not permitted, or invalid CSRF token |
| `404` | Route or record not found |
| `409` | Business conflict such as no inventory |
| `429` | Too many requests |
| `500` | Unexpected server error |
| `503` | Service is not ready or not configured |

### JSON

JSON is the text format used between web and API:

```json
{
  "status": "CONFIRMED",
  "note": "Deposit received"
}
```

`JSON.stringify` converts a JavaScript object to text. `response.json()` parses response text back into a JavaScript value.

## 9. Express concepts

Express receives HTTP requests in Node.js.

### Application and routes

```ts
const app = express();
app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});
```

A route combines a method, path, and handler.

### Middleware

Middleware runs during a request:

```ts
function requireOwner(request, response, next) {
  if (response.locals.admin.role !== "OWNER") {
    next(new AppError(403, "FORBIDDEN", "Owner access is required"));
    return;
  }
  next();
}
```

`next()` moves to the next middleware. `next(error)` skips to error-handling middleware.

Examples in `app.ts` include logging, Helmet, CORS, JSON parsing, cookies, and rate limiting.

### Routers

`publicRouter` and `adminRouter` group related routes. Mounting:

```ts
app.use("/api/v1/admin", adminRouter);
```

means `/auth/login` inside the router becomes `/api/v1/admin/auth/login`.

### `response.locals`

`requireAdmin` stores trusted request-specific values:

```ts
response.locals.session = session;
response.locals.admin = session.admin;
```

Later handlers can use them without querying the session again.

### Central error handling

Route handlers throw errors instead of each constructing responses. `errorHandler` maps known errors and hides unexpected implementation details.

## 10. Authentication and web security concepts

### Password hashing

Passwords are never stored directly. `bcrypt` creates a slow one-way hash. Login hashes/checks the candidate password rather than decrypting stored data.

### Session token

The browser receives a random session token in a cookie. The database stores only a SHA-256 hash. If the session table leaks, the hash cannot be directly used as the browser cookie.

### HTTP-only cookie

`httpOnly: true` prevents browser JavaScript from reading the session cookie. `SameSite=Strict` limits cross-site sending. `secure: true` is enabled in production so the cookie is sent only over HTTPS.

### CSRF

Cookies are attached automatically, which can be dangerous for state-changing requests. The API therefore also requires a random CSRF token in the `x-csrf-token` header. Another website cannot normally read that token.

### CORS

CORS decides which browser origins may call the API. `WEB_ORIGIN` is parsed into an exact allow-list. CORS is not authentication; it is an additional browser control.

### Rate limiting

Rate limits slow brute-force login and spam submissions. The default store is in memory, so a multi-instance production deployment should use a shared store such as Redis.

### Security headers

Helmet adds headers that reduce common browser attacks. The app also removes the Express identification header and limits JSON body size.

## 11. Prisma and database concepts

### Relational database

PostgreSQL stores data in tables. A row is one record; a column is one property.

### Prisma schema

```prisma
model Reservation {
  id         String            @id @default(cuid())
  reference  String            @unique
  status     ReservationStatus @default(NEW)
  roomTypeId String
  roomType   RoomType          @relation(fields: [roomTypeId], references: [id])
}
```

- `@id` marks the primary key.
- `@unique` prevents duplicates.
- `@default` supplies a value.
- `@relation` describes a foreign-key relationship.

### Prisma Client

After generation, Prisma provides typed queries:

```ts
await prisma.roomType.findMany({
  where: { active: true },
  orderBy: { sortOrder: "asc" },
});
```

### Migrations

A migration is versioned SQL that changes database structure. Commit migrations so every environment applies the same schema.

- `prisma migrate dev` creates/applies development migrations.
- `prisma migrate deploy` applies committed migrations in production.

### Seeding and bootstrap

Seeding inserts useful initial content. The regular seed updates demo content intentionally. Bootstrap first checks for an admin and property, so routine Docker restarts do not overwrite configured data.

### Primary and foreign keys

A primary key uniquely identifies a row. A foreign key points to another row. `Reservation.roomTypeId` must reference an existing room type.

### Indexes

Indexes make reads faster at the cost of storage and slightly more work during writes. This app indexes common filters such as reservation status/date and active content/order.

### Constraints

The migration adds:

```sql
CHECK ("totalUnits" >= 0
  AND "availableUnits" >= 0
  AND "availableUnits" <= "totalUnits")
```

Even if application code has a bug, PostgreSQL rejects impossible inventory.

### Transactions

A transaction groups changes into one all-or-nothing operation. Confirmation must decrement inventory, update the reservation, and write history together.

Serializable isolation behaves as though transactions ran one at a time. PostgreSQL may reject a conflicting transaction, so the code retries expected serialization conflicts.

### Idempotency and duplicate protection

Submitting the same request twice should not create two enquiries. The API combines normalized email, room, and move-in date into a fingerprint, adds a 15-minute time bucket, and stores it under a unique database constraint.

## 12. CSS concepts

### Custom properties

```css
:root {
  --bg: oklch(1 0 0);
  --primary: oklch(0.4 0.106 150);
}
```

Custom properties are reusable design tokens:

```css
.button.primary {
  background: var(--primary);
}
```

Changing one token updates many components.

### Dark theme

```css
:root[data-theme="dark"] {
  --bg: oklch(0.105 0.008 150);
}
```

React changes the root `data-theme` attribute, and CSS swaps token values.

### Flexbox and Grid

Flexbox is useful for one-dimensional rows/columns. Grid is useful for two-dimensional page structures.

```css
.metrics {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}
```

### Responsive media queries

```css
@media (max-width: 720px) {
  .metrics {
    grid-template-columns: 1fr;
  }
}
```

Rules inside apply only to smaller viewports.

### Reduced motion

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: .01ms !important;
  }
}
```

This respects users who experience discomfort from animation.

### OKLCH

OKLCH is a modern color format designed around human-perceived lightness. It makes consistent contrast and theme adjustments easier than arbitrary hexadecimal colors.

## 13. Docker concepts

### Image and container

An image is a packaged filesystem and command. A container is a running instance of an image.

### Multi-stage build

The Dockerfile uses one build stage and two final stages:

- build once;
- copy API output into a small Node image;
- copy web output into an Nginx image.

This avoids shipping source compilers in final containers.

### Docker Compose

Compose defines cooperating services, networks, environment variables, health checks, and persistent volumes.

`depends_on` with health conditions ensures:

1. PostgreSQL becomes healthy.
2. Setup applies migrations and bootstrap.
3. API starts and becomes ready.
4. Web starts.

### Persistent volume

`verdant_pg` stores PostgreSQL data outside the container. `docker compose down` keeps it; `docker compose down --volumes` deletes it.

### Nginx proxy

Nginx serves browser files and forwards `/api/` to the API container. This gives the browser one origin and simplifies production routing.

## 14. Testing concepts

### Unit tests

`reservations.test.ts` checks the pure status-transition rules without starting a server or database.

### HTTP tests

`app.test.ts` uses Supertest to send a request to the Express application in memory.

### Component tests

`PublicHome.test.tsx` renders React in jsdom, supplies API data, clicks an accessible button, and verifies the dialog opens.

### Mocking

Mocks replace external systems during a focused test:

```ts
vi.mock("./db.js", () => ({
  prisma: { $queryRaw: vi.fn(), $disconnect: vi.fn() },
}));
```

The health test does not need a real database.

### Assertions

```ts
expect(response.status).toBe(200);
expect(screen.getByRole("dialog")).toHaveAttribute("open");
```

Assertions describe expected behavior. A regression makes the test fail.

## 15. Follow one feature end to end

Use reservation submission as a learning exercise:

1. Start at the room button in `PublicHome.tsx`.
2. Follow `reserve(room.id)` into `ReservationDialog`.
3. Find `reservationInputSchema` in `packages/shared/src/index.ts`.
4. Follow `submitReservation` in `apps/web/src/api/client.ts`.
5. Find `POST /reservations` in `apps/api/src/routes.ts`.
6. Follow the Prisma `reservation.create` call.
7. Find the `Reservation` and history models in `schema.prisma`.
8. Open the admin reservations page in `AdminApp.tsx`.
9. Follow the status PATCH route to `transitionReservation`.
10. Observe the inventory transaction and history creation.

This route-by-route tracing technique is more reliable than reading files alphabetically.

## 16. Safe workflow for making changes

1. Identify the browser, shared contract, API, and database surfaces affected.
2. Change the shared contract first when request or response shape changes.
3. Add a Prisma migration when persistent structure changes.
4. Update both caller and handler.
5. Add or update tests.
6. Run:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
```

7. For database changes, apply the migration to a disposable local database before production.

## 17. Beginner debugging checklist

### Browser page is blank

- Open browser developer tools.
- Check the Console for a JavaScript error.
- Check Network for failed API requests.
- Confirm `VITE_API_URL`.

### API does not start

- Check environment validation output.
- Confirm `DATABASE_URL` and `SESSION_SECRET`.
- Confirm port 4000 is free.

### `/health` works but `/ready` fails

The server process is alive, but PostgreSQL cannot be queried. Check the database container, credentials, port, and migration state.

### Login succeeds but mutations fail with CSRF error

Refresh the admin page so `/auth/me` restores the in-memory CSRF token. Also confirm cookies are being sent and origins match.

### A room cannot be confirmed

Check `availableUnits`. The transaction returns `409 NO_AVAILABILITY` when no unit can be atomically claimed.

### Docker web loads but API calls fail

Check the `api` service health, `docker compose logs api`, and the `/api/` proxy in `docker/nginx.conf`.

## 18. What to learn next

A useful learning order is:

1. JavaScript objects, arrays, functions, promises, and modules.
2. TypeScript interfaces, unions, generics, and narrowing.
3. React components, props, state, effects, and forms.
4. HTTP methods, status codes, JSON, cookies, and CORS.
5. Express routes and middleware.
6. SQL tables, keys, indexes, and transactions.
7. Prisma schema and migrations.
8. Automated testing.
9. Docker and deployment.

Return to the real source after each topic and identify one example. The repository is small enough to trace every feature from browser interaction to database write.

