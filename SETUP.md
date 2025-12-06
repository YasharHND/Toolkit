# Setup Instructions

Follow these steps to complete the setup:

## Step 1: Install Dependencies

From the root directory, run:

```bash
pnpm install
```

This will install all dependencies for both the root workspace and the app folder.

## Step 2: Initialize Husky

After dependencies are installed, initialize Husky for git hooks:

```bash
pnpm exec husky init
```

This will create the `.husky/_` directory and a default pre-commit hook.

## Step 3: Configure Git Hooks

Set up the pre-commit and commit-msg hooks:

```bash
# Configure pre-commit hook
echo "cd app && pnpm format:check && pnpm lint" > .husky/pre-commit

# Configure commit-msg hook
echo "npx --no -- commitlint --edit \$1" > .husky/commit-msg

# Make them executable
chmod +x .husky/pre-commit .husky/commit-msg
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
