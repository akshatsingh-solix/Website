import { cn } from "@/lib/utils";
import { Picture } from "@/components/shared/Picture";
import { Sigil } from "@/components/materials/Sigil";

/** An industry has a vector illustration rather than a photo when there is no render of it yet. */
export const hasIndustryPhoto = (industry) => !/\.svg$/.test(industry?.image || "");

/**
 * An industry's picture: its photo, or - for an industry without one - its
 * sigil in Solix Blue, so every industry tile in a grid has a real visual.
 */
export const IndustryPicture = ({ industry, sizes, className, loading }) =>
  hasIndustryPhoto(industry) ? (
    <Picture src={industry.image} sizes={sizes} loading={loading} className={className} />
  ) : (
    <Sigil icon={industry.icon} tone="blue" sizes={sizes} className={cn("absolute inset-0 h-full w-full", className)} />
  );

export default IndustryPicture;
