# Layout Components

Utilities for structural consistency. Located in `src/design-system/layout/`.

## Container
Centers content with standard page margins and max-width.
```tsx
<Container>Content is centered</Container>
```

## Grid
A responsive CSS Grid wrapper.
```tsx
<Grid columns={{ sm: 1, md: 2, lg: 3 }} gap="lg">
  <div>Col 1</div>
  <div>Col 2</div>
  <div>Col 3</div>
</Grid>
```

## Stack
A vertical layout component for consistent spacing between elements.
```tsx
<Stack spacing="md">
  <h3>Title</h3>
  <p>Description text</p>
</Stack>
```

## Section
A vertical page block with standardized padding.
```tsx
<Section spacing="lg">
  <Container>Centered block content</Container>
</Section>
```
