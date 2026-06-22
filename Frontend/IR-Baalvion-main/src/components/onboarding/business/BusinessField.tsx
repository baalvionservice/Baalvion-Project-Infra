'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Option } from './options';

const LABEL_CLS = 'text-[10px] font-bold uppercase tracking-widest text-muted-foreground';
const ERROR_CLS = 'text-[10px] text-destructive uppercase font-bold';

function FieldLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Label className={LABEL_CLS}>
      {label}
      {required && <span className="text-primary"> *</span>}
    </Label>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
  required?: boolean;
  error?: string;
  hint?: string;
}

export function TextField({ label, value, onChange, placeholder, type = 'text', required, error, hint }: TextFieldProps) {
  return (
    <div className="space-y-2">
      <FieldLabel label={label} required={required} />
      <Input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-background/50"
        suppressHydrationWarning
      />
      {hint && !error && <p className="text-[10px] text-muted-foreground tracking-wide">{hint}</p>}
      {error && <p className={ERROR_CLS}>{error}</p>}
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function SelectField({ label, value, onChange, options, placeholder, required, error }: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <FieldLabel label={label} required={required} />
      <Select value={value || undefined} onValueChange={onChange}>
        <SelectTrigger className="bg-background/50">
          <SelectValue placeholder={placeholder || 'Select…'} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className={ERROR_CLS}>{error}</p>}
    </div>
  );
}

interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}

export function TextareaField({ label, value, onChange, placeholder, required, error }: TextareaFieldProps) {
  return (
    <div className="space-y-2">
      <FieldLabel label={label} required={required} />
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="bg-background/50"
        suppressHydrationWarning
      />
      {error && <p className={ERROR_CLS}>{error}</p>}
    </div>
  );
}
