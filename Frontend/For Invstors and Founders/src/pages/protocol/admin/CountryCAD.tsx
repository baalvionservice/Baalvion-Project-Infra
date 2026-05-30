import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Globe, Users, DollarSign, TrendingUp, ChevronRight, Search,
  ArrowUpRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import ProtocolLayout from "@/components/protocol/ProtocolLayout";
import { protocolApi } from "@/lib/protocol-api";

// Shape reference (data is loaded live from protocolApi.countries / .experts).
const countriesData = [
  { 
    code: "IN", 
    name: "India", 
    experts: 78, 
    students: 3240, 
    revenue: 156000, 
    growth: "+24%",
    flag: "🇮🇳"
  },
  { 
    code: "PK", 
    name: "Pakistan", 
    experts: 45, 
    students: 1820, 
    revenue: 89000, 
    growth: "+18%",
    flag: "🇵🇰"
  },
  { 
    code: "US", 
    name: "United States", 
    experts: 42, 
    students: 1560, 
    revenue: 234000, 
    growth: "+31%",
    flag: "🇺🇸"
  },
  { 
    code: "GB", 
    name: "United Kingdom", 
    experts: 38, 
    students: 1240, 
    revenue: 178000, 
    growth: "+15%",
    flag: "🇬🇧"
  },
  { 
    code: "AE", 
    name: "United Arab Emirates", 
    experts: 28, 
    students: 890, 
    revenue: 145000, 
    growth: "+42%",
    flag: "🇦🇪"
  },
  { 
    code: "SG", 
    name: "Singapore", 
    experts: 16, 
    students: 520, 
    revenue: 98000, 
    growth: "+28%",
    flag: "🇸🇬"
  },
  { 
    code: "CA", 
    name: "Canada", 
    experts: 14, 
    students: 480, 
    revenue: 67000, 
    growth: "+12%",
    flag: "🇨🇦"
  },
  { 
    code: "AU", 
    name: "Australia", 
    experts: 12, 
    students: 390, 
    revenue: 54000, 
    growth: "+19%",
    flag: "🇦🇺"
  },
];

// Mock experts by country
const expertsByCountry: Record<string, any[]> = {
  IN: [
    { name: "Priya Sharma", specialty: "Data Science", students: 312, revenue: 52100 },
    { name: "Raj Patel", specialty: "Web Development", students: 245, revenue: 38500 },
    { name: "Anita Singh", specialty: "Mobile Apps", students: 189, revenue: 29400 },
  ],
  PK: [
    { name: "Ali Hassan", specialty: "UI/UX Design", students: 156, revenue: 28900 },
    { name: "Fatima Khan", specialty: "Digital Marketing", students: 134, revenue: 22100 },
  ],
  US: [
    { name: "Dr. Sarah Chen", specialty: "AI & Machine Learning", students: 156, revenue: 45200 },
    { name: "Mike Johnson", specialty: "Cloud Architecture", students: 178, revenue: 52000 },
  ],
  GB: [
    { name: "Marcus Webb", specialty: "Blockchain", students: 234, revenue: 67800 },
    { name: "Emma Thompson", specialty: "Cybersecurity", students: 145, revenue: 41200 },
  ],
  AE: [
    { name: "Ahmed Al-Rashid", specialty: "FinTech", students: 89, revenue: 45600 },
    { name: "Sara Abdullah", specialty: "E-commerce", students: 112, revenue: 38900 },
  ],
};

const CountryCAD = () => {
  const navigate = useNavigate();
  const [countries, setCountries] = useState<any[]>([]);
  const [allExperts, setAllExperts] = useState<any[]>([]);
  useEffect(() => {
    protocolApi.countries.list().then((rows) => setCountries(rows.map((r: any) => ({ ...r, growth: "" }))));
    protocolApi.experts.list().then(setAllExperts);
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCountryData = countries.find(c => c.code === selectedCountry);
  const selectedExperts = selectedCountryData ? allExperts.filter((e) => e.country === selectedCountryData.name) : [];

  return (
    <ProtocolLayout role="admin" breadcrumbs={[{ label: "Admin", href: "/protocol/admin" }, { label: "Countries", href: "/protocol/admin/countries" }]}>
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="bg-[#12121a] border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Globe className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">{countriesData.length}</p>
                  <p className="text-white/40 text-sm">Active Countries</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#12121a] border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-500/10">
                  <Users className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">
                    {countriesData.reduce((acc, c) => acc + c.experts, 0)}
                  </p>
                  <p className="text-white/40 text-sm">Total Experts</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#12121a] border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">
                    {countriesData.reduce((acc, c) => acc + c.students, 0).toLocaleString()}
                  </p>
                  <p className="text-white/40 text-sm">Total Students</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-[#12121a] border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <DollarSign className="w-5 h-5 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-semibold text-white">
                    ${(countriesData.reduce((acc, c) => acc + c.revenue, 0) / 1000).toFixed(0)}K
                  </p>
                  <p className="text-white/40 text-sm">Total Revenue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Countries List */}
          <Card className="bg-[#12121a] border-white/5">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-white/90 flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-500" />
                All Countries
              </CardTitle>
              <div className="relative w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-white/5 border-white/10 text-white"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredCountries.map((country) => (
                  <div
                    key={country.code}
                    onClick={() => setSelectedCountry(country.code)}
                    className={`p-4 rounded-lg cursor-pointer transition-all ${
                      selectedCountry === country.code 
                        ? 'bg-amber-500/10 border border-amber-500/30' 
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{country.flag}</span>
                        <div>
                          <p className="text-white/90 font-medium">{country.name}</p>
                          <p className="text-white/40 text-sm">{country.experts} experts</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-white/70">${(country.revenue / 1000).toFixed(0)}K</p>
                        <div className="flex items-center gap-1 text-emerald-400 text-sm">
                          <ArrowUpRight className="w-3 h-3" />
                          {country.growth}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Country Details */}
          <Card className="bg-[#12121a] border-white/5">
            <CardHeader>
              <CardTitle className="text-white/90">
                {selectedCountryData ? (
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{selectedCountryData.flag}</span>
                    {selectedCountryData.name} - Experts
                  </div>
                ) : (
                  "Select a Country"
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCountryData ? (
                <div className="space-y-4">
                  {/* Country Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg bg-white/5 text-center">
                      <p className="text-xl font-semibold text-white">{selectedCountryData.experts}</p>
                      <p className="text-white/40 text-xs">Experts</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 text-center">
                      <p className="text-xl font-semibold text-white">{selectedCountryData.students.toLocaleString()}</p>
                      <p className="text-white/40 text-xs">Students</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 text-center">
                      <p className="text-xl font-semibold text-emerald-400">${(selectedCountryData.revenue / 1000).toFixed(0)}K</p>
                      <p className="text-white/40 text-xs">Revenue</p>
                    </div>
                  </div>

                  {/* Experts List */}
                  <div className="space-y-3 mt-6">
                    <h4 className="text-white/60 text-sm font-medium">Top Experts</h4>
                    {selectedExperts.length > 0 ? (
                      selectedExperts.map((expert, index) => (
                        <div 
                          key={index}
                          className="p-4 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-white/90 font-medium">{expert.name}</p>
                              <p className="text-amber-500/60 text-sm">{expert.specialty}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-white/70 text-sm">{expert.students} students</p>
                              <p className="text-emerald-400 text-sm">${expert.revenue.toLocaleString()}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-white/40 text-sm">No expert data available</p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Globe className="w-12 h-12 text-white/10 mb-4" />
                  <p className="text-white/40">Select a country to view its experts</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtocolLayout>
  );
};

export default CountryCAD;
