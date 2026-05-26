
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import countriesData from '@/lib/data/countries.json';
import { useToast } from '@/hooks/use-toast';

interface BusinessSetupStepProps {
  onNext: () => void;
  onBack: () => void;
  updateFormData: (data: any) => void;
  formData: any;
}

const industries = ["Technology", "Retail", "Finance", "Media", "Agency", "Other"];
const employeeCounts = ["1-10", "11-50", "51-200", "200+"];
const currencies = ["USD", "INR", "GBP", "AED", "SGD"];

export default function BusinessSetupStep({ onNext, onBack, updateFormData, formData }: BusinessSetupStepProps) {
  const [bizName, setBizName] = useState(formData.businessName || '');
  const [country, setCountry] = useState(formData.country || '');
  const [industry, setIndustry] = useState(formData.industry || '');
  const [currency, setCurrency] = useState(formData.currency || '');
  const [employees, setEmployees] = useState(formData.employees || '1-10');
  const { toast } = useToast();

  useEffect(() => {
    if (country) {
      const countryData = countriesData.find(c => c.name === country);
      if (countryData) {
        const currencyMap: Record<string, string> = { "India": "INR", "United Kingdom": "GBP", "UAE": "AED", "USA": "USD", "Singapore": "SGD" };
        const suggestedCurrency = currencyMap[countryData.name];
        if (suggestedCurrency && currencies.includes(suggestedCurrency)) {
          setCurrency(suggestedCurrency);
        }
      }
    }
  }, [country]);

  const handleNext = () => {
    if (!bizName || !country || !industry || !currency) {
      toast({
        variant: 'destructive',
        title: 'Missing Information',
        description: 'Please fill out all required fields.',
      });
      return;
    }
    updateFormData({
      businessName: bizName,
      country,
      industry,
      currency,
      employees
    });
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="biz-name">Business Name</Label>
          <Input id="biz-name" placeholder="e.g., QuantumLeap AI" required value={bizName} onChange={e => setBizName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="biz-country">Country</Label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger id="biz-country"><SelectValue placeholder="Select a country" /></SelectTrigger>
            <SelectContent>{countriesData.map(c => <SelectItem key={c.id} value={c.name}>{c.flag} {c.name}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="biz-industry">Industry</Label>
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger id="biz-industry"><SelectValue placeholder="Select an industry" /></SelectTrigger>
            <SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="biz-currency">Currency</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger id="biz-currency"><SelectValue placeholder="Select currency" /></SelectTrigger>
            <SelectContent>{currencies.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Number of employees</Label>
        <RadioGroup value={employees} onValueChange={setEmployees} className="flex flex-wrap gap-4">
          {employeeCounts.map(count => (
            <div key={count} className="flex items-center space-x-2"><RadioGroupItem value={count} id={`r-${count}`} /><Label htmlFor={`r-${count}`}>{count}</Label></div>
          ))}
        </RadioGroup>
      </div>
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  );
}
