# Component Structure Guide

To maintain a scalable codebase, we recommend the following structure for new complex components:

```text
MyComponent/
├── index.ts        # Barrel export
├── MyComponent.tsx # Main React component
├── types.ts        # TypeScript interfaces
└── styles.ts       # (Optional) Tailwind logic or specific styles
```

### Best Practices
1. **Use Design Tokens**: Never hardcode hex values or pixel sizes.
2. **Prop Forwarding**: Ensure components can accept `className` for layout flexibility.
3. **Accessibility**: Always include relevant ARIA roles and states.
4. **Pure Layout**: Avoid side effects inside UI components; keep logic in hooks or services.
