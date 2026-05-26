"use client";

const items = [
  { company: "TechCorp", text: "hired 12 engineers in 6 days" },
  { company: "Innovate Inc.", text: "reduced hiring cost by 68%" },
  { company: "BuildFast", text: "found their CTO in 4 days" },
  { company: "ScaleUp AI", text: "tripled candidate quality" },
  { company: "DevStudio", text: "saved 40 hours per hire" },
  { company: "CloudBase", text: "hires 5× faster than before" },
  { company: "DataFlow", text: "cut bad hires by 92%" },
];

export default function Marquee() {
  const doubled = [...items, ...items];

  return (
    <div className="bg-gray-900 py-[18px] overflow-hidden">
      <div
        className="flex gap-[60px] w-max"
        style={{ animation: "marquee 28s linear infinite" }}
      >
        {doubled.map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-2.5 whitespace-nowrap text-xs text-white/55"
          >
            <div className="w-[5px] h-[5px] rounded-full bg-green-500 flex-shrink-0" />
            <span className="font-bold text-white/90">{item.company}</span>{" "}
            {item.text}
          </div>
        ))}
      </div>
      <style>{`@keyframes marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }`}</style>
    </div>
  );
}
