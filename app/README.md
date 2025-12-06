# Toolkit App

A modern developer toolkit with a beautiful gray and orange color scheme.

## Features

### UUID Generator

- **UUID v4**: Generates random UUIDs using cryptographically strong random values
- **UUID v5**: Generates deterministic UUIDs based on namespace and name using SHA-1 hashing
  - Supports predefined namespaces: DNS, URL, OID, X500
  - Allows custom namespace UUIDs
  - Same namespace + name always produces the same UUID

## Design System

### Color Palette

- **Primary**: Orange (#f97316) - Used for buttons, active states, and accents
- **Background**: Gray shades (900-800) - Dark gradient background
- **Surface**: Gray 800 - Card backgrounds
- **Border**: Gray 700 - Subtle borders
- **Text**: White and Gray shades

### Components

- **Header**: Sticky navigation with toolkit branding
- **Cards**: Rounded with subtle borders and shadows
- **Buttons**: Orange gradient with hover effects
- **Inputs**: Dark gray with orange focus rings

## Development

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Lint
pnpm lint

# Format
pnpm format
```

## Adding New Tools

To add a new tool to the toolkit:

1. Create a new component in `src/components/`
2. Add the tab to the `Header.tsx` component
3. Import and render in `App.tsx`
4. Update the `Tab` type in both files

Example:

```typescript
// In Header.tsx
const tabs = [
  { id: 'uuid', label: 'UUID' },
  { id: 'base64', label: 'Base64' }, // New tool
];

// In App.tsx
{activeTab === 'base64' && <Base64Encoder />}
```
