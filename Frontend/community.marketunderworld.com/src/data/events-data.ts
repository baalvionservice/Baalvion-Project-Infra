export interface ClubEvent {
  id: string;
  eventName: string;
  djName: string;
  venue: string;
  city: "Mumbai" | "Delhi" | "Gurgaon";
  date: string; // ISO: "2026-10-04"
  image: string;
  tag: "FREE ON GUEST LIST" | "BUY TICKETS" | "VIP TABLE" | "SOLD OUT";
  guestListId?: string; // clubId for routing
  clubId: string;
}

export const CLUB_EVENTS: ClubEvent[] = [
  // Mumbai
  { id: "e-1", eventName: "Saturday Night Fever", djName: "DJ NYK", venue: "Toy Room", city: "Mumbai", date: "2026-10-03", image: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=580&fit=crop", tag: "FREE ON GUEST LIST", clubId: "c-1" },
  { id: "e-2", eventName: "Bollywood Fridays", djName: "DJ Suketu", venue: "Matahaari", city: "Mumbai", date: "2026-10-03", image: "https://images.unsplash.com/photo-1571266028243-d220c6a98e0c?w=400&h=580&fit=crop", tag: "BUY TICKETS", clubId: "c-8" },
  { id: "e-3", eventName: "Deep House Sessions", djName: "DJ Shaan", venue: "Bastian - At The Top", city: "Mumbai", date: "2026-10-04", image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&h=580&fit=crop", tag: "VIP TABLE", clubId: "c-5" },
  { id: "e-4", eventName: "Hip Hop Sundays", djName: "DJ Aqeel", venue: "Toy Room", city: "Mumbai", date: "2026-10-05", image: "https://images.unsplash.com/photo-1574169208507-84376144848b?w=400&h=580&fit=crop", tag: "FREE ON GUEST LIST", clubId: "c-1" },
  { id: "e-5", eventName: "Weekend Warriors", djName: "DJ Lost Stories", venue: "Matahaari", city: "Mumbai", date: "2026-10-10", image: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=400&h=580&fit=crop", tag: "BUY TICKETS", clubId: "c-8" },
  { id: "e-6", eventName: "Sky Lounge Nights", djName: "DJ Tej", venue: "Bastian - At The Top", city: "Mumbai", date: "2026-10-11", image: "https://images.unsplash.com/photo-1545128485-c400e7702796?w=400&h=580&fit=crop", tag: "FREE ON GUEST LIST", clubId: "c-5" },

  // Delhi
  { id: "e-7", eventName: "Techno Thursdays", djName: "BLOT!", venue: "Kitty Su", city: "Delhi", date: "2026-10-03", image: "https://images.unsplash.com/photo-1598387180449-c2af3218b5e5?w=400&h=580&fit=crop", tag: "FREE ON GUEST LIST", clubId: "c-2" },
  { id: "e-8", eventName: "Badshah Live", djName: "Badshah", venue: "Dragonfly Experience", city: "Delhi", date: "2026-10-04", image: "https://images.unsplash.com/photo-1574365561657-3f820253f545?w=400&h=580&fit=crop", tag: "SOLD OUT", clubId: "c-4" },
  { id: "e-9", eventName: "Saturday Sessions", djName: "DJ MO-K", venue: "Kitty Su", city: "Delhi", date: "2026-10-04", image: "https://images.unsplash.com/photo-1470229722913-7c090be5c520?w=400&h=580&fit=crop", tag: "BUY TICKETS", clubId: "c-2" },
  { id: "e-10", eventName: "Gothic Night", djName: "DJ Pele", venue: "Diablo", city: "Delhi", date: "2026-10-05", image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?w=400&h=580&fit=crop", tag: "FREE ON GUEST LIST", clubId: "c-6" },
  { id: "e-11", eventName: "House Music All Night", djName: "Arjun Vagale", venue: "Kitty Su", city: "Delhi", date: "2026-10-10", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=580&fit=crop", tag: "BUY TICKETS", clubId: "c-2" },
  { id: "e-12", eventName: "Dragonfly Saturdays", djName: "Zaeden", venue: "Dragonfly Experience", city: "Delhi", date: "2026-10-11", image: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=580&fit=crop", tag: "VIP TABLE", clubId: "c-4" },

  // Gurgaon
  { id: "e-13", eventName: "Cyber Hub Wednesdays", djName: "DJ Sukhi", venue: "Sutra Gastropub", city: "Gurgaon", date: "2026-10-03", image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400&h=580&fit=crop", tag: "FREE ON GUEST LIST", clubId: "c-3" },
  { id: "e-14", eventName: "Laser Fridays", djName: "DJ Nikhil Chinapa", venue: "Prism Club & Kitchen", city: "Gurgaon", date: "2026-10-04", image: "https://images.unsplash.com/photo-1572116469696-ed70ca8dbbc7?w=400&h=580&fit=crop", tag: "BUY TICKETS", clubId: "c-7" },
  { id: "e-15", eventName: "Sufi Nights", djName: "Live Sufi Band", venue: "Sutra Gastropub", city: "Gurgaon", date: "2026-10-05", image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=400&h=580&fit=crop", tag: "FREE ON GUEST LIST", clubId: "c-3" },
  { id: "e-16", eventName: "VIP Saturdays", djName: "DJ Nasha", venue: "Prism Club & Kitchen", city: "Gurgaon", date: "2026-10-11", image: "https://images.unsplash.com/photo-1528495612343-9ca9f4a4de28?w=400&h=580&fit=crop", tag: "VIP TABLE", clubId: "c-7" },
  { id: "e-17", eventName: "Deep Beats Thursdays", djName: "DJ Ankytrixx", venue: "Sutra Gastropub", city: "Gurgaon", date: "2026-10-09", image: "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=400&h=580&fit=crop", tag: "FREE ON GUEST LIST", clubId: "c-3" },
  { id: "e-18", eventName: "Bollywood Masala", djName: "DJ Shadow Dubai", venue: "Prism Club & Kitchen", city: "Gurgaon", date: "2026-10-18", image: "https://images.unsplash.com/photo-1467810563316-b5476525c0f9?w=400&h=580&fit=crop", tag: "BUY TICKETS", clubId: "c-7" },
];
