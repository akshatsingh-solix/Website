import { Download, ExternalLink } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LeadForm } from "@/components/forms/LeadForm";
import { typeLabel } from "@/components/home/InsightsPreview";

export const ResourceDialog = ({ resource, onClose }) => (
  <Dialog open={!!resource} onOpenChange={(o) => !o && onClose()}>
    <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-ink-950 sm:max-w-2xl" data-testid="resource-dialog">
      {resource && (
        <>
          <DialogHeader>
            <p className="eyebrow">{typeLabel(resource.type)} · {resource.tag}</p>
            <DialogTitle className="font-display text-2xl font-medium tracking-tight sm:text-3xl">{resource.title}</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">{resource.desc}</DialogDescription>
          </DialogHeader>
          {resource.gated ? (
            <div className="mt-2 rounded-2xl border border-white/10 bg-card p-6">
              <p className="mb-5 text-sm text-slate-300">Tell us a little about yourself and we'll send the full {typeLabel(resource.type).toLowerCase()} to your inbox.</p>
              <LeadForm
                type="download"
                extra={{ resource: resource.title }}
                submitLabel="Send me the resource"
                successTitle="It's on its way."
                successDesc="Check your inbox in the next few minutes. We've also saved your request."
                showInterest={false}
                showMessage={false}
                compact
              />
            </div>
          ) : (
            <div className="mt-2 space-y-5">
              <div className="prose-solix rounded-2xl border border-white/10 bg-card p-6 text-sm leading-relaxed text-slate-300">
                <p>This is a preview of the full {typeLabel(resource.type).toLowerCase()}. In the production site this opens the complete article, recording or event page.</p>
                <p>Highlights: why archive-first programs finish sooner, how the Preservation Zone keeps retired data query-ready, and what a trust perimeter looks like in practice for business-led AI.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button data-testid="resource-open-button" onClick={onClose}><ExternalLink /> Continue reading</Button>
                <Button variant="outline" onClick={onClose}><Download /> Save for later</Button>
              </div>
            </div>
          )}
        </>
      )}
    </DialogContent>
  </Dialog>
);
