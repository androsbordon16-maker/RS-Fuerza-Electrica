---
name: github-web-release
description: Safely prepare, review, and publish website changes from this GitHub repository. Use when creating a feature branch, opening a pull request, reviewing site changes, or preparing a deployment.
---

# GitHub Web Release

Use a reviewable, reversible release flow.

## Workflow

1. Inspect the current branch and affected files before editing.
2. Create a focused branch for one user-visible change. Do not mix redesigns, dependency upgrades, and unrelated fixes.
3. Make the smallest coherent change. Update documentation only when it helps the next maintainer operate the site.
4. Build and validate locally or through available checks before opening a pull request.
5. Write a pull request summary with: what changed, visitor impact, validation performed, and any manual test needed.
6. Use a preview deployment for visual review. Do not publish a production change unless the user explicitly asks.
7. Treat secrets as environment configuration. Never add keys, tokens, passwords, or private URLs to tracked source files.

## Pull Request Checklist

- Scope is clear and limited.
- Mobile and desktop behavior were checked.
- Accessibility and visible focus were checked.
- No sensitive values were committed.
- A rollback is obvious: revert the single pull request if necessary.