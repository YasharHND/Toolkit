# Setup Instructions

Follow these steps to complete the setup:

## Step 1: Install Dependencies

From the root directory, run:

```bash
cd /Users/yashar/Workspace/Toolkit
pnpm install
```

This will install all dependencies for both the root workspace and the app folder.

## Step 2: Initialize Husky

After dependencies are installed, initialize Husky:

```bash
pnpm exec husky init
```

This will create the `.husky/_` directory needed for git hooks.

## Step 3: Make Hook Scripts Executable

Make the git hook scripts executable:

```bash
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
```

## Step 4: Verify Setup

Test that everything works:

```bash
# Start the dev server
pnpm dev
```

The app should open at `http://localhost:5173`

## Step 5: Test Git Hooks (Optional)

Try making a commit to test the hooks:

```bash
git add .
git commit -m "feat: initial project setup"
```

The pre-commit hook will:

- ✅ Check code formatting with Prettier
- ✅ Check code quality with ESLint

The commit-msg hook will:

- ✅ Validate commit message follows conventional commits

## All Done! 🎉

Your project is now ready. See `README.md` for available commands and more information.
