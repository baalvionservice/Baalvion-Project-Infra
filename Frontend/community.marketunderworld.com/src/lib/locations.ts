// India and UAE only. Country, then state (or emirate), then city, so nobody has to type a place.
export type Country = "India" | "United Arab Emirates";

export const COUNTRIES: { name: Country; stateLabel: string }[] = [
  { name: "India", stateLabel: "State or territory" },
  { name: "United Arab Emirates", stateLabel: "Emirate" },
];

export const PLACES: Record<Country, Record<string, string[]>> = {
  India: {
    "Andhra Pradesh": ["Visakhapatnam", "Vijayawada", "Guntur", "Tirupati", "Nellore", "Kurnool", "Rajahmundry", "Kakinada"],
    "Arunachal Pradesh": ["Itanagar", "Naharlagun", "Pasighat"],
    "Assam": ["Guwahati", "Silchar", "Dibrugarh", "Jorhat", "Nagaon", "Tezpur"],
    "Bihar": ["Patna", "Gaya", "Bhagalpur", "Muzaffarpur", "Darbhanga", "Purnia"],
    "Chhattisgarh": ["Raipur", "Bhilai", "Bilaspur", "Korba", "Durg"],
    "Goa": ["Panaji", "Margao", "Vasco da Gama", "Mapusa", "Calangute", "Candolim", "Anjuna", "Baga"],
    "Gujarat": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Gandhinagar", "Bhavnagar", "Jamnagar"],
    "Haryana": ["Gurugram", "Faridabad", "Panipat", "Ambala", "Karnal", "Hisar", "Rohtak"],
    "Himachal Pradesh": ["Shimla", "Manali", "Dharamshala", "Solan", "Mandi", "Kullu"],
    "Jharkhand": ["Ranchi", "Jamshedpur", "Dhanbad", "Bokaro"],
    "Karnataka": ["Bengaluru", "Mysuru", "Mangaluru", "Hubballi", "Belagavi", "Kalaburagi", "Udupi"],
    "Kerala": ["Kochi", "Thiruvananthapuram", "Kozhikode", "Thrissur", "Kollam", "Kannur", "Alappuzha"],
    "Madhya Pradesh": ["Indore", "Bhopal", "Jabalpur", "Gwalior", "Ujjain", "Sagar"],
    "Maharashtra": ["Mumbai", "Navi Mumbai", "Thane", "Pune", "Nagpur", "Nashik", "Aurangabad", "Kolhapur", "Solapur", "Vasai-Virar", "Pimpri-Chinchwad"],
    "Manipur": ["Imphal", "Thoubal"],
    "Meghalaya": ["Shillong", "Tura"],
    "Mizoram": ["Aizawl", "Lunglei"],
    "Nagaland": ["Kohima", "Dimapur"],
    "Odisha": ["Bhubaneswar", "Cuttack", "Rourkela", "Puri", "Sambalpur"],
    "Punjab": ["Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Mohali", "Bathinda"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner", "Alwar"],
    "Sikkim": ["Gangtok", "Namchi"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem", "Tirunelveli", "Erode", "Vellore"],
    "Telangana": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
    "Tripura": ["Agartala", "Udaipur (Tripura)"],
    "Uttar Pradesh": ["Lucknow", "Noida", "Ghaziabad", "Kanpur", "Agra", "Varanasi", "Prayagraj", "Meerut", "Greater Noida"],
    "Uttarakhand": ["Dehradun", "Haridwar", "Rishikesh", "Haldwani", "Nainital"],
    "West Bengal": ["Kolkata", "Howrah", "Durgapur", "Siliguri", "Asansol"],
    "Andaman and Nicobar Islands": ["Port Blair"],
    "Chandigarh": ["Chandigarh"],
    "Dadra and Nagar Haveli and Daman and Diu": ["Daman", "Diu", "Silvassa"],
    "Delhi": ["New Delhi", "Delhi"],
    "Jammu and Kashmir": ["Srinagar", "Jammu", "Anantnag", "Baramulla"],
    "Ladakh": ["Leh", "Kargil"],
    "Lakshadweep": ["Kavaratti"],
    "Puducherry": ["Puducherry", "Karaikal"],
  },
  "United Arab Emirates": {
    "Abu Dhabi": ["Abu Dhabi City", "Al Ain", "Yas Island", "Saadiyat Island", "Madinat Zayed"],
    "Dubai": ["Downtown Dubai", "Dubai Marina", "JBR", "Business Bay", "Jumeirah", "Deira", "Bur Dubai", "Palm Jumeirah", "Al Barsha", "JLT"],
    "Sharjah": ["Sharjah City", "Khor Fakkan", "Kalba"],
    "Ajman": ["Ajman City"],
    "Umm Al Quwain": ["Umm Al Quwain City"],
    "Ras Al Khaimah": ["Ras Al Khaimah City", "Al Marjan Island"],
    "Fujairah": ["Fujairah City", "Dibba Al-Fujairah"],
  },
};

export const OTHER_CITY = "Another city";

export interface Place { country: Country | ""; state: string; city: string }

// Stored as one line, "City, State, Country", so the existing profile field keeps working.
export const formatPlace = (p: Place) => [p.city, p.state, p.country].filter(Boolean).join(", ");

export function parsePlace(text: string): Place {
  const parts = text.split(",").map((s) => s.trim()).filter(Boolean);
  const country = COUNTRIES.find((c) => c.name === parts[parts.length - 1])?.name;
  if (!country) return { country: "", state: "", city: "" };
  const state = parts[parts.length - 2] && PLACES[country][parts[parts.length - 2]] ? parts[parts.length - 2] : "";
  const city = parts.slice(0, state ? -2 : -1).join(", ");
  return { country, state, city };
}
