import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import i18n from "@/i18n";
import { detectLanguage, getStoredLanguage } from "@/i18n/geoDetect";
import { Toaster } from "@/components/ui/sonner";
import { Layout } from "@/components/layout/Layout";
import { AdminAuthProvider, RequireAdmin } from "@/components/admin/AdminAuth";
import { AccountAuthProvider, RequireAccount } from "@/components/account/AccountAuth";
import Home from "@/pages/Home";
import Platform from "@/pages/Platform";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Solutions from "@/pages/Solutions";
import ServicesSupport from "@/pages/ServicesSupport";
import Industries from "@/pages/Industries";
import IndustryDetail from "@/pages/IndustryDetail";
import Resources from "@/pages/Resources";
import Article from "@/pages/Article";
import Company from "@/pages/Company";
import Careers from "@/pages/Careers";
import Partners from "@/pages/Partners";
import Newsroom from "@/pages/Newsroom";
import PressRelease from "@/pages/PressRelease";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/NotFound";
import SignIn from "@/pages/auth/SignIn";
import SignUp from "@/pages/auth/SignUp";
import Account from "@/pages/Account";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminLeads from "@/pages/admin/AdminLeads";
import AdminSettings from "@/pages/admin/AdminSettings";

function App() {
  useEffect(() => {
    detectLanguage().then(({ lang }) => {
      // Never let a slow geo lookup undo a language the visitor picked
      // while it was running.
      if (getStoredLanguage().source === "manual") return;
      if (lang !== i18n.language) i18n.changeLanguage(lang);
    });
  }, []);

  return (
    <BrowserRouter basename="/Website">
      <AdminAuthProvider>
        <AccountAuthProvider>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          {/* Solix ECS trial accounts - standalone pages, like solix.com/ai/signin */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/ai/signin" element={<Navigate to="/signin" replace />} />
          <Route path="/ai/signup" element={<Navigate to="/signup" replace />} />
          <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<AdminLeads />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
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
        </AccountAuthProvider>
      </AdminAuthProvider>
      <Toaster position="bottom-center" theme="light" richColors closeButton />
    </BrowserRouter>
  );
}

export default App;
