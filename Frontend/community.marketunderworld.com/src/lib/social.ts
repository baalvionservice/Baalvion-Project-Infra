// The links a member can show on their public page, in the order they appear.
export const SOCIALS: { key: string; label: string; placeholder: string }[] = [
  { key: "instagram", label: "Instagram", placeholder: "@yourname" },
  { key: "tiktok", label: "TikTok", placeholder: "@yourname" },
  { key: "youtube", label: "YouTube", placeholder: "@yourchannel" },
  { key: "x", label: "X", placeholder: "@yourname" },
  { key: "facebook", label: "Facebook", placeholder: "your.name or a link" },
  { key: "snapchat", label: "Snapchat", placeholder: "your username" },
  { key: "telegram", label: "Telegram", placeholder: "@yourname" },
  { key: "linkedin", label: "LinkedIn", placeholder: "your-name or a link" },
  { key: "spotify", label: "Spotify", placeholder: "a link to your page" },
  { key: "soundcloud", label: "SoundCloud", placeholder: "your-name" },
  { key: "website", label: "Website", placeholder: "yourwebsite.com" },
]
export const socialLabel = (k: string) => SOCIALS.find((s) => s.key === k)?.label ?? k
