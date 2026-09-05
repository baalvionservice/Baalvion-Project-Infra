import { ArrowDown } from "lucide-react";
import type { ArchitectureDiagram } from "@/lib/network-detail";

/**
 * Static request-topology diagram for a Network detail page. Plain
 * boxes + connector lines (no SVG, no client JS) so it renders identically
 * in the initial HTML — matches the diagram already documented in that
 * property's own README.
 */
export function NetworkArchitectureDiagram({ diagram }: { diagram: ArchitectureDiagram }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <Node label={diagram.root.label} detail={diagram.root.detail} emphasis />
      <ArrowDown className="w-4 h-4 text-gray-300" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
        {diagram.gated.map((n) => (
          <Node key={n.id} label={n.label} detail={n.detail} />
        ))}
      </div>

      <ArrowDown className="w-4 h-4 text-gray-300" />
      <div className="w-full border border-dashed border-primary/40 bg-primary/5 rounded-xl p-5 text-center">
        <span className="text-[11px] font-bold uppercase tracking-widest text-primary block mb-1">
          {diagram.gate.label}
        </span>
        <span className="text-sm text-gray-600">{diagram.gate.detail}</span>
      </div>

      {diagram.standalone.length > 0 && (
        <>
          <div className="text-[11px] font-bold uppercase tracking-widest text-gray-300 pt-4">
            Also reached directly from the browser
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {diagram.standalone.map((n) => (
              <Node key={n.id} label={n.label} detail={n.detail} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function Node({ label, detail, emphasis }: { label: string; detail: string; emphasis?: boolean }) {
  return (
    <div
      className={
        emphasis
          ? "border border-gray-900 bg-gray-900 text-white rounded-xl px-6 py-4 text-center"
          : "border border-gray-200 bg-white rounded-xl px-5 py-4 text-center"
      }
    >
      <span className={emphasis ? "block text-sm font-bold" : "block text-sm font-bold text-gray-900"}>
        {label}
      </span>
      <span className={emphasis ? "block text-[11px] text-gray-300 mt-1" : "block text-[11px] text-gray-500 mt-1"}>
        {detail}
      </span>
    </div>
  );
}
