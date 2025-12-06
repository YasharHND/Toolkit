# Toolkit

A modern monorepo setup with React frontend and AWS CDK infrastructure.

## Tech Stack

### Frontend (`/app`)

- **React 19** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **ESLint** with Prettier for code quality
- **pnpm** for package management

### Infrastructure (Coming Soon)

- AWS CDK for infrastructure as code

## Project Structure

```
toolkit/
├── app/                    # React frontend application
│   ├── src/
│   ├── public/
│   └── package.json
├── .husky/                 # Git hooks
├── package.json            # Root workspace configuration
└── pnpm-workspace.yaml     # pnpm workspace config
```

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+

### Installation

Run this command from the **root directory**:

```bash
cd /Users/yashar/Workspace/Toolkit
pnpm install
```

This will install all dependencies for both the root workspace and the app.

### Development

Start the development server:

```bash
pnpm dev
```

This runs the React app at `http://localhost:5173`

### Building

Build the frontend for production:

```bash
pnpm build
```

### Code Quality

#### Linting

```bash
# Check for linting errors
pnpm lint

# Auto-fix linting errors
cd app && pnpm lint:fix
```

#### Formatting

```bash
# Check formatting
pnpm format:check

# Auto-format all files
pnpm format
```

## Git Hooks (Husky)

This project uses Husky to enforce code quality:

### Pre-commit Hook

Automatically runs before each commit:

- ✅ Prettier formatting check
- ✅ ESLint linting check

If checks fail, the commit will be blocked. Fix issues with:

```bash
pnpm format
cd app && pnpm lint:fix
```

### Commit Message Hook

Enforces conventional commit messages:

```bash
# Good examples:
git commit -m "feat: add user authentication"
git commit -m "fix: resolve navigation bug"
git commit -m "docs: update README"

# Bad examples:
git commit -m "updates"  # ❌ Will be rejected
```

## Scripts

### Root Level

- `pnpm dev` - Start frontend dev server
- `pnpm build` - Build frontend for production
- `pnpm lint` - Run ESLint on frontend
- `pnpm format` - Format all files with Prettier
- `pnpm format:check` - Check formatting without changes

### App Level (run from `/app`)

- `pnpm dev` - Start Vite dev server
- `pnpm build` - Build for production
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Fix ESLint errors
- `pnpm format` - Format app files
- `pnpm preview` - Preview production build

## Adding New Packages

Always run pnpm commands from the **root directory**:

```bash
# Add to frontend app
pnpm --filter app add <package-name>

# Add dev dependency to frontend app
pnpm --filter app add -D <package-name>

# Add to root workspace
pnpm add -w <package-name>
```

## Future Additions

- AWS CDK infrastructure code
- CI/CD pipelines
- Testing setup (Jest, React Testing Library)
- E2E testing (Playwright)

## License

MIT
