# Typography System

Centralized text management using the `Text` component.

## Purpose
Ensures font hierarchy, line heights, and weights are consistent across the app.

## Variants
- `display`: Largest text for hero sections.
- `h1` to `h6`: Standard heading levels.
- `body`: Primary reading text.
- `bodySmall`: Dense information.
- `caption`: Micro-copy.
- `label`: Uppercase, tracked-out metadata labels.

## Usage
```tsx
import { Text } from "@/design-system";

<Text variant="h1" as="h1" weight="bold">
  Imperialpedia Intelligence
</Text>

<Text variant="body" color="var(--muted-foreground)">
  Deep financial insights at scale.
</Text>
```
