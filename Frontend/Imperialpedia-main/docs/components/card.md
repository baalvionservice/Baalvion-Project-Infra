# Card Component

The primary container for grouping related content.

## Purpose
Used for displaying articles, glossary previews, and dashboard modules.

## Components
- `Card`: The main wrapper.
- `CardHeader`: Contains title and description.
- `CardTitle`: Large, bold heading.
- `CardDescription`: Muted sub-text.
- `CardContent`: The main body area.
- `CardFooter`: Optional area for actions.

## Usage
```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

<Card className="glass-card">
  <CardHeader>
    <CardTitle>Market Analysis</CardTitle>
  </CardHeader>
  <CardContent>
    Content goes here...
  </CardContent>
</Card>
```
