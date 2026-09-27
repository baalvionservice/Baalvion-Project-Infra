# Button Component

The standard interactive element for actions.

## Purpose
Used for submissions, navigation, and triggering modal actions.

## Variants
- `default`: The primary action style (Violet).
- `secondary`: For less prominent but important actions (Blue).
- `outline`: For secondary actions or navigation.
- `ghost`: For low-priority actions or icons.
- `destructive`: For high-risk actions (e.g., Delete).

## Sizes
- `sm`: Small buttons for tight spaces.
- `default`: Standard size for general use.
- `lg`: Hero-style buttons for high conversion areas.
- `icon`: Square buttons for standalone icons.

## Usage
```tsx
import { Button } from "@/components/ui/button";

<Button variant="default" size="lg">
  Get Started
</Button>
```
