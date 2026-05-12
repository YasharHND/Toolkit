# Repo conventions for Claude

## Verification

Before reporting any code change as complete, run the following commands **in this order from the repo root** and ensure each passes with no errors:

1. `pnpm run format:check`
2. `pnpm run type:check`
3. `pnpm run lint:check`

If any of them fail, fix the issues before moving on. Re-run the failed command to confirm it now passes, then continue down the list.

### How to fix failures

| Command                 | How to fix failures                                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `pnpm run format:check` | Run `pnpm run format:fix` to auto-apply Prettier formatting.                                                                  |
| `pnpm run type:check`   | There is no `:fix` counterpart. Edit the code to resolve each TypeScript error.                                               |
| `pnpm run lint:check`   | Run `pnpm run lint:fix` first to auto-apply ESLint fixes. For anything ESLint can't fix automatically, edit the code by hand. |

Run the `:fix` counterpart only when its `:check` counterpart is failing — don't run it preemptively.

### Order matters

The commands are ordered cheapest → most expensive _and_ most foundational → most superficial:

- Format issues can mask the real shape of type or lint errors.
- Type errors can cascade into spurious lint errors.

So fixing earlier checks before running later ones avoids chasing phantom failures.
