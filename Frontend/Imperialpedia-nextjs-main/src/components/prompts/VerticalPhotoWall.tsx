'use client';

function splitIntoColumns(photos: string[], count: number): string[][] {
  const columns: string[][] = Array.from({ length: count }, () => []);
  photos.forEach((photo, i) => columns[i % count].push(photo));
  return columns;
}

function Column({ files, direction }: { files: string[]; direction: 'up' | 'down' }) {
  if (files.length === 0) return null;
  // Duplicated so the loop point is invisible — translateY(-50%) lands exactly on the copy.
  const doubled = [...files, ...files];
  return (
    <div className="relative h-full overflow-hidden">
      <div
        className={`flex flex-col gap-3 ${direction === 'up' ? 'animate-marquee-up' : 'animate-marquee-down'}`}
      >
        {doubled.map((src, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={src}
            alt=""
            aria-hidden="true"
            className="w-full rounded-xl object-cover ring-1 ring-primary/50"
            loading={i < 3 ? 'eager' : 'lazy'}
          />
        ))}
      </div>
    </div>
  );
}

export function VerticalPhotoWall({ photos }: { photos: string[] }) {
  if (photos.length === 0) return null;
  const columns = splitIntoColumns(photos, 3);

  return (
    <div
      className="relative grid grid-cols-3 gap-3 h-[420px] sm:h-[520px] overflow-hidden rounded-2xl p-3 shadow-[0_0_80px_-10px] shadow-primary/30 [mask-image:linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]"
      aria-hidden="true"
    >
      {columns.map((files, i) => (
        <Column key={i} files={files} direction={i % 2 === 0 ? 'up' : 'down'} />
      ))}
    </div>
  );
}
