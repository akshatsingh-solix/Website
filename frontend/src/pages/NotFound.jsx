import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative flex min-h-[80vh] items-center overflow-hidden" data-testid="not-found-page">
      <div className="absolute inset-0 grid-lines opacity-50" />
      <div className="container relative py-32">
        <p className="eyebrow mb-4">404</p>
        <h1 className="text-balance text-5xl font-medium tracking-tighter sm:text-6xl lg:text-7xl">This record was archived somewhere else.</h1>
        <p className="mt-6 max-w-lg text-muted-foreground md:text-lg">The page you're looking for has moved or never existed. Even our Preservation Zone can't find it.</p>
        <Button asChild size="lg" className="mt-10" data-testid="not-found-home">
          <Link to="/"><ArrowLeft /> Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
