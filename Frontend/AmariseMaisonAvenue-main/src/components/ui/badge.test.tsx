import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from './badge';

describe('Badge', () => {
  it('renders its children', () => {
    render(<Badge>Authenticated</Badge>);
    expect(screen.getByText('Authenticated')).toBeInTheDocument();
  });

  it('applies the destructive variant classes', () => {
    render(<Badge variant="destructive">Revoked</Badge>);
    expect(screen.getByText('Revoked')).toHaveClass('bg-destructive');
  });

  it('applies the outline variant classes by default text color, not a filled background', () => {
    render(<Badge variant="outline">Draft</Badge>);
    const el = screen.getByText('Draft');
    expect(el).toHaveClass('text-foreground');
    expect(el).not.toHaveClass('bg-primary');
  });
});
