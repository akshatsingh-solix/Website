import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, Link } from "react-router-dom";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import { captureUtm } from "./lib/api";

const Register = lazy(() => import("./pages/Register"));
const Confirmed = lazy(() => import("./pages/Confirmed"));
const History = lazy(() => import("./pages/History"));

function NotFound() {
  return (
    <section className="container grid min-h-[60vh] place-items-center pt-24 text-center">
      <div>
        <p className="eyebrow mb-3">404</p>
        <h1 className="text-fluid-h2 font-semibold">This page isn't on the agenda.</h1>
        <Link to="/" className="btn-primary mt-8">Back to SOLIXEmpower 2026</Link>
      </div>
    </section>
  );
}

const Fallback = () => <div className="min-h-[70vh]" />;

export default function App() {
  useEffect(() => captureUtm(), []);
  return (
    <Suspense fallback={<Fallback />}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="register" element={<Register />} />
          <Route path="register/confirmed" element={<Confirmed />} />
          <Route path="history" element={<History />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
