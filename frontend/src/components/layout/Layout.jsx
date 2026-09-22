import { Outlet } from "react-router-dom";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { ScrollToTop } from "@/components/shared/ScrollToTop";
import { ConciergeWidget } from "@/components/chat/ConciergeWidget";

export const Layout = () => (
  <div className="relative min-h-screen bg-background text-foreground">
    <ScrollToTop />
    <Navbar />
    <main>
      <Outlet />
    </main>
    <Footer />
    <ConciergeWidget />
  </div>
);
