"use client";

const logos = ["TechCorp", "Innovate Inc.", "BuildFast", "ScaleUp", "DevStudio", "CloudBase", "DataFlow"];

export default function TrustedBar() {
  return (
    <div className="bg-white border-t border-b border-gray-200 py-9 px-6 text-center">
      <p className="text-[10px] font-black uppercase tracking-[2px] text-gray-400 mb-5">
        Trusted by the world's leading companies
      </p>
      <div className="flex justify-center items-center gap-8 flex-wrap">
        {logos.map((logo) => (
          <div
            key={logo}
            className="text-[15px] font-black text-gray-400 opacity-55 hover:opacity-100 transition-opacity cursor-default"
          >
            {logo}
          </div>
        ))}
      </div>
    </div>
  );
}
