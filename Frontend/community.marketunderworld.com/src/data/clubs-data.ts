export interface Club {
  id: string;
  name: string;
  city: "Mumbai" | "Delhi" | "Gurgaon";
  image: string;
  musicType: string[];
  daysOpen: string;
  description: string;
  coverCharge: string;
  rating: number;
}

export const INDIAN_CLUBS: Club[] = [
  {
    id: "c-1",
    name: "Toy Room",
    city: "Mumbai",
    image: "https://images.unsplash.com/photo-1566737236500-c8ac43014a67?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    musicType: ["Hip Hop", "Commercial"],
    daysOpen: "Wed, Fri, Sat",
    description: "An exclusive, high-energy nightclub famous for its iconic teddy bear mascot 'Frank' and elite crowd.",
    coverCharge: "Couples only / VIP Table Minimums",
    rating: 4.8
  },
  {
    id: "c-2",
    name: "Kitty Su",
    city: "Delhi",
    image: "https://images.unsplash.com/photo-1545128485-c400e7702796?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    musicType: ["EDM", "Techno", "House"],
    daysOpen: "Wed - Sun",
    description: "One of Delhi's most legendary nightlife destinations known for international DJ acts and an inclusive vibe.",
    coverCharge: "₹3,000 - ₹5,000",
    rating: 4.9
  },
  {
    id: "c-3",
    name: "Sutra Gastropub",
    city: "Gurgaon",
    image: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    musicType: ["Bollywood", "Commercial", "Live Sufi"],
    daysOpen: "All Days",
    description: "Located in Cyber Hub, offering incredible open-air vibes, live music, and the best crowd in Gurugram.",
    coverCharge: "Free Entry (Stag restrictions apply)",
    rating: 4.5
  },
  {
    id: "c-4",
    name: "Dragonfly Experience",
    city: "Delhi",
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    musicType: ["Techno", "Hip Hop"],
    daysOpen: "Wed - Sun",
    description: "A high-end club in Aerocity by Badshah, featuring stunning insect-themed decor and premium bottle service.",
    coverCharge: "Table reservations required",
    rating: 4.7
  },
  {
    id: "c-5",
    name: "Bastian - At The Top",
    city: "Mumbai",
    image: "https://images.unsplash.com/photo-1572116469696-ed70ca8dbbc7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    musicType: ["Lounge", "Deep House", "Commercial"],
    daysOpen: "Tue - Sun",
    description: "A massive, ultra-luxurious dining and party space on the 48th floor with a spectacular view of the Mumbai skyline.",
    coverCharge: "Table Minimums (Very High)",
    rating: 4.9
  },
  {
    id: "c-6",
    name: "Diablo",
    city: "Delhi",
    image: "https://images.unsplash.com/photo-1574365561657-3f820253f545?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    musicType: ["Commercial", "Hip Hop"],
    daysOpen: "All Days",
    description: "Gothic and Mediterranean-themed hotspot with fiery cocktails and a massive courtyard for epic night outs.",
    coverCharge: "₹4,000",
    rating: 4.6
  },
  {
    id: "c-7",
    name: "Prism Club & Kitchen",
    city: "Gurgaon",
    image: "https://images.unsplash.com/photo-1470229722913-7c090be5c520?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    musicType: ["Bollywood", "Techno"],
    daysOpen: "Thu - Sun",
    description: "Massive club space with insane laser lighting, crazy weekend events, and premium VIP cabanas.",
    coverCharge: "₹2,500+",
    rating: 4.4
  },
  {
    id: "c-8",
    name: "Matahaari",
    city: "Mumbai",
    image: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    musicType: ["Bollywood", "Commercial"],
    daysOpen: "Wed, Fri, Sat",
    description: "Located in Worli, this high-energy club is famous for its opulent decor and celebrity sightings.",
    coverCharge: "Couples only / VIP Table",
    rating: 4.7
  }
];
