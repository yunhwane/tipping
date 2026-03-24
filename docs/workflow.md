# Development Workflow

## Branch Strategy (GitHub Flow)

| Branch | Purpose |
|--------|---------|
| `master` | Production. Always deployable. **No direct pushes.** |
| `feat/<name>` | New feature (e.g., `feat/bookmark-page`) |
| `fix/<name>` | Bug fix (e.g., `fix/tag-position`) |
| `chore/<name>` | Config, CI, dependencies (e.g., `chore/ci-setup`) |
| `refactor/<name>` | Code improvement with no behavior change |
| `docs/<name>` | Documentation changes |
| `style/<name>` | UI/styling changes |

Rules:
- Create branches from `master`
- Keep branches short-lived (1-3 days)
- Delete branches after merge

## Commit Convention (Conventional Commits)

Format: `<type>: <description>`

| Type | Usage |
|------|-------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code improvement (no behavior change) |
| `chore` | Config, CI, dependencies |
| `docs` | Documentation |
| `style` | UI/styling |

Examples:
```
feat: add bookmark page
fix: correct tag position in tip card
chore: configure CI workflow
refactor: simplify tRPC router structure
```

## Pull Request Rules

- **Title**: Same format as commit convention
- **Body**: Use the PR template (`.github/pull_request_template.md`)
- **Merge method**: Squash and Merge (keeps `master` history clean)
- **Merge condition**: CI must pass (typecheck + build)
- **Post-merge**: Branch auto-deleted

## CI (GitHub Actions)

Triggered on PRs targeting `master`. Pipeline:

1. `npm ci` — Install dependencies
2. `npx prisma generate` — Generate Prisma client types
3. `npm run typecheck` — TypeScript type checking
4. `npm run build` — Next.js production build

Config: `.github/workflows/ci.yml`

Note: CI uses dummy env vars for `DATABASE_URL` and auth secrets — no real DB connection needed for type checking and building.

## Deployment

- Vercel auto-deploys on merge to `master`
- PR branches get Vercel preview deployments automatically

## GitHub Repository Settings

Required one-time setup in GitHub Settings:

1. **Branch protection** on `master`:
   - Require pull request before merging
   - Require status checks to pass → select "Typecheck & Build"
2. **Merge settings**:
   - Allow squash merging only (disable merge commit and rebase)
3. **General**:
   - Enable "Automatically delete head branches"
