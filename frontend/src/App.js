import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { Layout } from "@/components/layout/Layout";
import { AdminAuthProvider, RequireAdmin } from "@/components/admin/AdminAuth";
import Home from "@/pages/Home";
import Products from "@/pages/Products";
import ProductDetail from "@/pages/ProductDetail";
import Solutions from "@/pages/Solutions";
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
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminLayout from "@/pages/admin/AdminLayout";
import AdminLeads from "@/pages/admin/AdminLeads";
import AdminSettings from "@/pages/admin/AdminSettings";

function App() {
  return (
    <BrowserRouter>
      <AdminAuthProvider>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<RequireAdmin><AdminLayout /></RequireAdmin>}>
            <Route index element={<AdminLeads />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>
          <Route element={<Layout />}>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/:slug" element={<ProductDetail />} />
            <Route path="/solutions" element={<Solutions />} />
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
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </AdminAuthProvider>
      <Toaster position="bottom-center" theme="dark" richColors closeButton />
    </BrowserRouter>
  );
}

export default App;
