interface PreferredSourceButtonProps {
  theme?: "light" | "dark";
  className?: string;
}

/**
 * Google "Add as preferred source" button (Top Stories / AI Overviews / AI
 * Mode). https://developers.google.com/search/docs/appearance/preferred-sources
 * The loader script (news.google.com/swg/js/v1/publisher.js) lives once in
 * the root layout <head> and scans the page for this exact
 * `google-add-preferred-source-btn` attribute to hydrate. It's rendered via
 * a raw HTML string, not a JSX attribute, because the attribute name isn't
 * camelCase and has no typed React prop -- this guarantees the literal
 * markup Google's script matches, rather than whatever React would do with
 * an unrecognized custom attribute name.
 */
export function PreferredSourceButton({ theme = "dark", className }: PreferredSourceButtonProps) {
  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{
        __html: `<div google-add-preferred-source-btn data-theme="${theme}"></div>`,
      }}
    />
  );
}
