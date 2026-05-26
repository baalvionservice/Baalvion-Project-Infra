/**
 * @fileOverview Mock Lawyer Identity Implementation
 */

const MOCK_LAWYERS = [
  {
    id: "lawyer_1",
    lawyerId: "lawyer_1",
    name: "Harvey Specter",
    email: "harvey@pearsonhardman.com",
    specialization: ["Corporate", "Litigation", "M&A"],
    experience: 15,
    rating: 5.0,
    totalReviews: 124,
    hourlyRate: 8500,
    location: "Mumbai",
    bio: "Senior Partner specializing in high-stakes corporate litigation and complex negotiations. Recognized as one of the top closers in the industry with a focus on enterprise stability and acquisition strategy.",
    profileImage: "https://picsum.photos/seed/harvey/400/400",
    isVerified: true,
    available: true,
    createdAt: Date.now()
  },
  {
    id: "lawyer_2",
    lawyerId: "lawyer_2",
    name: "Ananya Deshmukh",
    email: "ananya@legal.in",
    specialization: ["Criminal", "Family", "Civil"],
    experience: 12,
    rating: 4.8,
    totalReviews: 89,
    hourlyRate: 4500,
    location: "Pune",
    bio: "Dedicated advocate with a track record of successful criminal defense and family mediation. Committed to providing accessible yet elite legal representation for private estates and individuals.",
    profileImage: "https://picsum.photos/seed/ananya/400/400",
    isVerified: true,
    available: true,
    createdAt: Date.now()
  },
  {
    id: "lawyer_3",
    lawyerId: "lawyer_3",
    name: "Rahul Khanna",
    email: "rahul.khanna@ip.com",
    specialization: ["Intellectual Property", "Tech", "Startup"],
    experience: 8,
    rating: 4.9,
    totalReviews: 56,
    hourlyRate: 6000,
    location: "Bangalore",
    bio: "Expert in patent filing and IP strategy for high-growth technology startups. Helping founders secure their innovations in the global marketplace through strategic filing and protection.",
    profileImage: "https://picsum.photos/seed/rahul/400/400",
    isVerified: true,
    available: false,
    createdAt: Date.now()
  },
  {
    id: "lawyer_4",
    lawyerId: "lawyer_4",
    name: "Ishita Roy",
    email: "ishita@arbitration.com",
    specialization: ["Arbitration", "Corporate", "International"],
    experience: 20,
    rating: 5.0,
    totalReviews: 210,
    hourlyRate: 12000,
    location: "New Delhi",
    bio: "Renowned international arbitrator handling cross-border commercial disputes. Her practice involves some of the most complex multi-jurisdictional legal challenges in the elite network.",
    profileImage: "https://picsum.photos/seed/ishita/400/400",
    isVerified: true,
    available: true,
    createdAt: Date.now()
  },
  {
    id: "lawyer_5",
    lawyerId: "lawyer_5",
    name: "Vikram Malhotra",
    email: "vikram@tax.in",
    specialization: ["Tax", "Financial", "Compliance"],
    experience: 10,
    rating: 4.7,
    totalReviews: 42,
    hourlyRate: 5500,
    location: "Mumbai",
    bio: "Specialist in enterprise tax optimization and regulatory compliance. Providing strategic financial legal advice to ensure corporate longevity and compliance with evolving statutes.",
    profileImage: "https://picsum.photos/seed/vikram/400/400",
    isVerified: true,
    available: true,
    createdAt: Date.now()
  }
];

export const mockGetAllLawyers = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return MOCK_LAWYERS;
};

export const mockGetLawyerById = async (id: string) => {
  await new Promise(resolve => setTimeout(resolve, 400));
  return MOCK_LAWYERS.find(l => l.id === id) || null;
};

export const mockSearchLawyers = async (filters: any) => {
  await new Promise(resolve => setTimeout(resolve, 600));
  let results = [...MOCK_LAWYERS];

  if (filters.specialization && filters.specialization !== 'all') {
    results = results.filter(l => l.specialization.includes(filters.specialization));
  }

  if (filters.minRating && filters.minRating !== 'all') {
    results = results.filter(l => l.rating >= parseFloat(filters.minRating));
  }

  if (filters.maxPrice && filters.maxPrice !== 'all') {
    results = results.filter(l => l.hourlyRate <= parseInt(filters.maxPrice));
  }

  if (filters.query) {
    const q = filters.query.toLowerCase();
    results = results.filter(l => 
      l.name.toLowerCase().includes(q) || 
      l.specialization.some(s => s.toLowerCase().includes(q))
    );
  }

  return results;
};
