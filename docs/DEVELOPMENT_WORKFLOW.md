# DEVELOPMENT WORKFLOW & STANDARDS

## 1. Golden Rules of Development

1. **Phase Discipline**: Always adhere to the current development phase defined in `docs/PHASES.md`. Do not start future phase tasks ahead of time.
2. **Never Break Working Tests**: Before committing changes, run the test suite:
   ```bash
   php artisan test
   ```
3. **Documentation as Permanent Truth**: If a data structure, API endpoint, or business rule changes, immediately update the relevant documentation in `/docs` and record decisions in `docs/DECISIONS.md`.
4. **No Fake Profiles in Production**: Seed data must be strictly flagged for local development and testing only.

---

## 2. Branching & Commit Conventions

### Commit Prefixes:
- `feat:` New feature implementation
- `fix:` Bug fix
- `docs:` Documentation updates
- `refactor:` Code refactoring without behavioral change
- `test:` Adding or adjusting automated tests
- `chore:` Dependency or build tool updates

---

## 3. Pre-Implementation Checklist for Every Phase

Before coding:
- [ ] Review relevant `/docs` files.
- [ ] Understand dependencies and policies.
- [ ] Implement backend models, migrations, and Form Requests.
- [ ] Implement service layer and controller logic.
- [ ] Add automated feature tests.
- [ ] Build responsive mobile-first frontend components.
- [ ] Update `docs/CHANGELOG.md` and `docs/PHASES.md`.
