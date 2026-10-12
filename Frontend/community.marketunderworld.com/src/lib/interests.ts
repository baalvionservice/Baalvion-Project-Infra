// What a member can say they want here. Shared by the onboarding guide and the dashboard profile.
// "group" is who the person is, so the picker reads as "I am a guest / I run a business / I want work" and not a bare list.
export const GROUPS: { id: string; title: string; text: string }[] = [
  { id: "guest", title: "I go out and enjoy", text: "Guests, fans and members" },
  { id: "work", title: "I want work", text: "Jobs, gigs, casting and learning" },
  { id: "business", title: "I run a business or organise events", text: "Venues, small businesses, promoters, sellers" },
  { id: "trade", title: "I trade or pay in crypto", text: "Buying, USDT and intermediaries" },
]

export const INTERESTS: { id: string; title: string; group: string }[] = [
  { id: "clubs", title: "Night life: clubs, guest lists and events", group: "guest" },
  { id: "wallet", title: "Ticket draws and DJ demands", group: "guest" },
  { id: "forum", title: "Take part in forums", group: "guest" },
  { id: "buy", title: "Buy on the marketplace", group: "guest" },
  { id: "locals", title: "Find local jobs and gigs", group: "work" },
  { id: "student", title: "Study and learn (student)", group: "work" },
  { id: "teacher", title: "Teach a course (teacher)", group: "work" },
  { id: "employer", title: "Hire people for local jobs", group: "business" },
  { id: "organiser", title: "Make events and post event posters", group: "business" },
  { id: "ticketseller", title: "Sell tickets or guest lists for my club", group: "business" },
  { id: "sell", title: "Sell my products on the marketplace", group: "business" },
  { id: "trade", title: "Buy USDT or get help with a trade", group: "trade" },
  { id: "agent", title: "Work as an intermediary", group: "trade" },
]
