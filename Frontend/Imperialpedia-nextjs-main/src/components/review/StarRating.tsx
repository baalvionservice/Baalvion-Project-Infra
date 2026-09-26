"use client";

interface StarRatingProps {
  score: number; // out of 5
  showNumber?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StarRating({
  score,
  showNumber = true,
  size = "md",
}: StarRatingProps) {
  const stars = 5;
  const filled = Math.floor(score);
  const partial = score % 1;

  const sizeMap = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const textMap = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">
        {Array.from({ length: stars }).map((_, i) => {
          const isFilled = i < filled;
          const isPartial = i === filled && partial > 0;

          return (
            <svg
              key={i}
              className={`${sizeMap[size]} ${isFilled ? "text-yellow-400" : isPartial ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
              fill={isFilled ? "currentColor" : "none"}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              {isPartial ? (
                <>
                  <defs>
                    <linearGradient id={`partial-${i}`} x1="0" x2="1" y1="0" y2="0">
                      <stop offset={`${partial * 100}%`} stopColor="currentColor" />
                      <stop offset={`${partial * 100}%`} stopColor="transparent" />
                    </linearGradient>
                  </defs>
                  <path
                    fill={`url(#partial-${i})`}
                    stroke="currentColor"
                    d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                  />
                </>
              ) : (
                <path
                  fill={isFilled ? "currentColor" : "none"}
                  d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
                />
              )}
            </svg>
          );
        })}
      </div>
      {showNumber && (
        <span className={`font-semibold text-foreground ${textMap[size]}`}>
          {score.toFixed(1)}
        </span>
      )}
    </div>
  );
}