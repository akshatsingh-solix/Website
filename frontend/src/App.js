import { Suspense, lazy, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import i18n from "@/i18n";
import { detectLanguage, getStoredLanguage } from "@/i18n/geoDetect";
import { Toaster } from "@/components/ui/sonner";
import { Layout } from "@/components/layout/Layout";
import { AccountAuthProvider, RequireAccount } from "@/components/account/AccountAuth";
import Home from "@/pages/Home";
import { slowConnection } from "@/lib/net";

// Route-level code splitting: the homepage ships alone; every other page is
// its own chunk, fetched on navigation and prefetched while the browser is idle.
const pages = {
  Platform: () => import("@/pages/Platform"),
  Products: () => import("@/pages/Products"),
  ProductDetail: () => import("@/pages/ProductDetail"),
  Solutions: () => import("@/pages/Solutions"),
  ServicesSupport: () => import("@/pages/ServicesSupport"),
  Industries: () => import("@/pages/Industries"),
  IndustryDetail: () => import("@/pages/IndustryDetail"),
  Resources: () => import("@/pages/Resources"),
  Article: () => import("@/pages/Article"),
  Company: () => import("@/pages/Company"),
  Careers: () => import("@/pages/Careers"),
  Partners: () => import("@/pages/Partners"),
  Newsroom: () => import("@/pages/Newsroom"),
  PressRelease: () => import("@/pages/PressRelease"),
  Contact: () => import("@/pages/Contact"),
  NotFound: () => import("@/pages/NotFound"),
  Account: () => import("@/pages/Account"),
  SignIn: () => import("@/pages/auth/SignIn"),
  SignUp: () => import("@/pages/auth/SignUp"),
};
const Platform = lazy(pages.Platform);
const Products = lazy(pages.Products);
const ProductDetail = lazy(pages.ProductDetail);
const Solutions = lazy(pages.Solutions);
const ServicesSupport = lazy(pages.ServicesSupport);
const Industries = lazy(pages.Industries);
const IndustryDetail = lazy(pages.IndustryDetail);
const Resources = lazy(pages.Resources);
const Article = lazy(pages.Article);
const Company = lazy(pages.Company);
const Careers = lazy(pages.Careers);
const Partners = lazy(pages.Partners);
const Newsroom = lazy(pages.Newsroom);
const PressRelease = lazy(pages.PressRelease);
const Contact = lazy(pages.Contact);
const NotFound = lazy(pages.NotFound);
const Account = lazy(pages.Account);
const SignIn = lazy(pages.SignIn);
const SignUp = lazy(pages.SignUp);
// Admin (sign-in, API client and pages) is a separate bundle that public
// visitors never download.
const AdminApp = lazy(() => import("@/pages/admin/AdminApp"));

// On slow or data-saver connections pages load on demand instead, so the
// prefetch never competes with the page the visitor is reading.
const prefetchPages = () => {
  if (slowConnection()) return;
  const run = () => ["Products", "ProductDetail", "Solutions", "Resources", "Article", "Contact", "Industries", "IndustryDetail", "Platform", "Company"].forEach((k, i) => setTimeout(() => pages[k]().catch(() => {}), i * 400));
  if ("requestIdleCallback" in window) window.requestIdleCallback(run, { timeout: 5000 });
  else setTimeout(run, 3000);
};

const PageFallback = () => <div className="min-h-[70vh]" aria-busy="true" />;

function App() {
  // Subscribing here re-renders the whole tree on a language change, so
  // every component reading localized data (see i18n/localize.js) updates.
  useTranslation();
  useEffect(() => {
    detectLanguage().then(({ lang }) => {
      // Never let a slow geo lookup undo a language the visitor picked
      // while it was running.
      if (getStoredLanguage().source === "manual") return;
      if (lang !== i18n.language) i18n.changeLanguage(lang);
    });
    if (!window.location.pathname.includes("/admin")) prefetchPages();
  }, []);

  return (
    <BrowserRouter basename="/Website">
      <AccountAuthProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/admin/*" element={<AdminApp />} />
            {/* Solix ECS trial accounts - standalone pages, like solix.com/ai/signin */}
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/ai/signin" element={<Navigate to="/signin" replace />} />
            <Route path="/ai/signup" element={<Navigate to="/signup" replace />} />
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/platform" element={<Platform />} />
              <Route path="/products" element={<Products />} />
              <Route path="/products/:slug" element={<ProductDetail />} />
              <Route path="/solutions" element={<Solutions />} />
              <Route path="/services-support" element={<ServicesSupport />} />
              <Route path="/industries" element={<Industries />} />
              <Route path="/industries/:slug" element={<IndustryDetail />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/resources/:slug" element={<Article />} />
              <Route path="/company" element={<Company />} />
              <Route path="/careers" element={<Careers />} />
              <Route path="/partners" element={<Partners />} />
              <Route path="/newsroom" element={<Newsroom />} />
              <Route path="/newsroom/:id" element={<PressRelease />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/account" element={<RequireAccount><Account /></RequireAccount>} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </Suspense>
      </AccountAuthProvider>
      <Toaster position="bottom-center" theme="light" richColors closeButton />
    </BrowserRouter>
  );
}

export default App;
