import { ArrowDown } from "lucide-react";
import type { ArchitectureDiagram } from "@/lib/network-detail";

/**
 * Static architecture diagram for a Network detail page — plain boxes +
 * connector lines (no SVG, no client JS), rendered stage by stage top to
 * bottom. Each property's real topology differs (a static export pipeline
 * vs. a live gateway-fronted API), so the shape is a flexible list of stages
 * rather than a fixed template.
 */
export function NetworkArchitectureDiagram({ diagram }: { diagram: ArchitectureDiagram }) {
  return (
    <div className="flex flex-col items-center gap-3">
      {diagram.stages.map((stage, i) => (
        <div key={i} className="w-full flex flex-col items-center gap-3">
          {i > 0 && <ArrowDown className="w-4 h-4 text-gray-300" />}
          {stage.label && (
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-300">{stage.label}</span>
          )}
          <div
            className="grid w-full gap-4"
            style={{ gridTemplateColumns: `repeat(${Math.min(stage.nodes.length, 3)}, minmax(0, 1fr))` }}
          >
            {stage.nodes.map((n) => (
              <Node key={n.id} label={n.label} detail={n.detail} emphasis={n.emphasis} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function Node({ label, detail, emphasis }: { label: string; detail: string; emphasis?: boolean }) {
  return (
    <div
      className={
        emphasis
          ? "border border-dashed border-primary/40 bg-primary/5 rounded-xl px-5 py-4 text-center"
          : "border border-gray-200 bg-white rounded-xl px-5 py-4 text-center"
      }
    >
      <span className={emphasis ? "block text-sm font-bold text-primary" : "block text-sm font-bold text-gray-900"}>
        {label}
      </span>
      {detail && <span className="block text-[11px] text-gray-500 mt-1">{detail}</span>}
    </div>
  );
}
