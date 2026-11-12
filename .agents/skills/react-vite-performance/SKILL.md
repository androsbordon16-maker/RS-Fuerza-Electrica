---
name: react-vite-performance
description: Build, review, and refactor React, Vite, and Tailwind code in this repository for reliable performance, clear component boundaries, accessible interactions, and small client bundles. Use when editing components, routes, data loading, forms, or UI performance.
---

# React + Vite Performance

Keep the application simple, responsive, and maintainable.

## Build Rules

1. Prefer small components with one clear responsibility.
2. Keep static content and constants outside component functions.
3. Import only what is needed. Lazy-load a genuinely heavy, below-the-fold feature instead of splitting small components.
4. Avoid effects for values that can be derived during render. Put user actions in event handlers.
5. Prevent request waterfalls: start independent asynchronous work together and handle loading, success, empty, and error states.
6. Use stable keys from data, not list indexes, when items can change.
7. Use semantic elements before adding ARIA. Add accessible names to icon-only controls.
8. Keep Tailwind classes readable. Extract repeated visual patterns into components or shared class constants.
9. Avoid premature memoization; measure or identify a real expensive render first.
10. Run the existing build and lint/test commands after changes. Fix warnings that indicate real defects.

## Before Publishing

- Confirm no console errors.
- Check mobile layout and keyboard interaction.
- Confirm images use meaningful alt text and explicit dimensions where possible.
- Check that forms validate user-facing input and show a usable error message.