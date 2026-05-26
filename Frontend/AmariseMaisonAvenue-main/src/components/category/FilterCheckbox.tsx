"use client";

interface FilterCheckboxProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  swatch?: React.ReactNode;
  count?: number;
}

export function FilterCheckbox({
  label,
  checked,
  onChange,
  swatch,
  count,
}: FilterCheckboxProps) {
  return (
    <label
      onClick={onChange}
      className="flex items-center gap-3 cursor-pointer group select-none py-[1px]"
    >
      {/* Square checkbox matching exact site style */}
      <span
        className={`w-4 h-4 border flex-shrink-0 flex items-center justify-center transition-all duration-150 ${
          checked
            ? "bg-[#1a1a1a] border-[#1a1a1a]"
            : "border-[#b8b4ae] bg-white group-hover:border-[#1a1a1a]"
        }`}
      >
        {checked && (
          <svg
            className="w-[9px] h-[7px] text-white flex-shrink-0"
            viewBox="0 0 10 8"
            fill="none"
          >
            <path
              d="M1 4L3.8 7L9 1"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </span>
      {swatch}
      <span
        className={`text-[13px] leading-none tracking-[0.02em] flex-1 transition-colors duration-150 ${
          checked ? "text-[#1a1a1a] font-normal" : "text-[#4a4a4a] font-light group-hover:text-[#1a1a1a]"
        }`}
      >
        {label}
      </span>
      {count !== undefined && (
        <span className="text-[11px] text-[#aaa] font-light ml-auto">({count})</span>
      )}
    </label>
  );
}