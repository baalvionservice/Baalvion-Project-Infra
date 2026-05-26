'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const timezones = [
    '(GMT-12:00) International Date Line West',
    '(GMT-08:00) Pacific Time (US & Canada)',
    '(GMT-05:00) Eastern Time (US & Canada)',
    '(GMT+00:00) Greenwich Mean Time : Dublin, Edinburgh, Lisbon, London',
    '(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi',
    '(GMT+08:00) Singapore, Perth',
];
const languages = ['English (United States)', 'English (United Kingdom)', 'Hindi', 'Arabic'];
const dateFormats = ['MM/DD/YYYY', 'DD/MM/YYYY', 'YYYY-MM-DD', 'Month D, YYYY'];

export default function GeneralSettings() {
    const { toast } = useToast();

    const handleSaveChanges = () => {
        toast({
            title: "Settings Saved",
            description: "Your general platform settings have been updated.",
        });
    };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Manage the general settings for your platform.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="platform-name">Platform Name</Label>
          <Input id="platform-name" defaultValue="Baalvion" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="default-currency">Default Currency</Label>
          <Select defaultValue="USD">
            <SelectTrigger id="default-currency">
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="USD">USD - US Dollar</SelectItem>
              <SelectItem value="INR">INR - Indian Rupee</SelectItem>
              <SelectItem value="GBP">GBP - British Pound</SelectItem>
              <SelectItem value="AED">AED - UAE Dirham</SelectItem>
              <SelectItem value="SGD">SGD - Singapore Dollar</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="default-language">Default Language</Label>
          <Select defaultValue="English (United States)">
            <SelectTrigger id="default-language">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map(lang => <SelectItem key={lang} value={lang}>{lang}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="timezone">Timezone</Label>
          <Select defaultValue="(GMT+05:30) Chennai, Kolkata, Mumbai, New Delhi">
            <SelectTrigger id="timezone">
              <SelectValue placeholder="Select timezone" />
            </SelectTrigger>
            <SelectContent>
                {timezones.map(tz => <SelectItem key={tz} value={tz}>{tz}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="fiscal-year">Fiscal Year Start</Label>
          <Select defaultValue="April">
            <SelectTrigger id="fiscal-year">
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              {['January', 'April', 'July', 'October'].map(month => <SelectItem key={month} value={month}>{month}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="date-format">Date Format</Label>
          <Select defaultValue="Month D, YYYY">
            <SelectTrigger id="date-format">
              <SelectValue placeholder="Select format" />
            </SelectTrigger>
            <SelectContent>
              {dateFormats.map(format => <SelectItem key={format} value={format}>{format}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </CardFooter>
    </Card>
  );
}
