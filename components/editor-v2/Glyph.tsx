import { TEMPLATES, type TemplateKey } from "@/lib/v2/templates";

/** The 30×22 pictogram of a template (static markup from the registry). */
export function Glyph({ template, className = "h-7 w-10" }: { template: TemplateKey; className?: string }) {
  return (
    <svg
      viewBox="0 0 30 22"
      fill="currentColor"
      aria-hidden
      className={className}
      dangerouslySetInnerHTML={{ __html: TEMPLATES[template].glyph }}
    />
  );
}
