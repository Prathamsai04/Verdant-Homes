import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PublicHome } from "./pages/PublicHome";

const AdminLogin = lazy(() => import("./pages/AdminLogin").then((module) => ({ default: module.AdminLogin })));
const AdminApp = lazy(() => import("./pages/AdminApp").then((module) => ({ default: module.AdminApp })));

export function App() {
  return (
    <Routes>
      <Route path="/" element={<PublicHome />} />
      <Route path="/admin/login" element={<Suspense fallback={<main className="admin-auth-loading">Loading secure workspace…</main>}><AdminLogin /></Suspense>} />
      <Route path="/admin/*" element={<Suspense fallback={<main className="admin-auth-loading">Restoring secure workspace…</main>}><AdminApp /></Suspense>} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
