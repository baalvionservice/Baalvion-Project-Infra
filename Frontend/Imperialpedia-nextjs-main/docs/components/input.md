# Form Components

Standardized inputs for data entry.

## Components
- `Input`: Standard text field.
- `Textarea`: Multi-line text entry.
- `Checkbox`: Binary selection.
- `RadioGroup`: Single selection from multiple options.
- `Select`: Dropdown selection.

## Styling
All form elements share:
- Consistent focus rings (Violet).
- Standard border radius (`lg`).
- Accessible `disabled` states.

## Usage
```tsx
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

<div className="grid gap-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="Enter your email" />
</div>
```
