# AagesLend Frontend Testing Guide

This document outlines the testing strategy, tools, and guidelines for contributing to AagesLend.

## 1. Environment & Stack
- **Test Runner / Framework**: Jest (with Babel config for Vite translation)
- **Component Testing**: React Testing Library (`@testing-library/react`)
- **User Interactions**: `@testing-library/user-event`
- **E2E Testing**: Playwright (`@playwright/test`) - Optional but recommended for full integration flows.

## 2. Directory Structure
```
frontend/
  ├── e2e/                     # End-to-End tests (Playwright)
  │    └── dashboard.spec.js
  ├── src/
  │    ├── __mocks__/          # Mock static assets
  │    └── __tests__/          # All Unit and Integration Tests
  │         ├── components/    # Tests for React components
  │         ├── hooks/         # Tests for custom React hooks
  │         ├── pages/         # Tests for page components
  │         ├── services/      # Tests for contract and API services
  │         └── utils/         # Testing utilities (renderers, mock data)
  ├── jest.config.js           # Jest Configuration
  └── babel.config.js          # Babel config for transpiling tests
```

## 3. Running Tests
- **Unit & Integration Tests**: `npm test` *(Requires adding `"test": "jest"` to `package.json`)*
- **Watch Mode**: `npm run test:watch` *(Requires `"test:watch": "jest --watch"`)*
- **Coverage**: `npm run test:coverage` *(Requires `"test:coverage": "jest --coverage"`)*

## 4. Writing Tests: Guidelines
### A. Component Tests
- Render components using our custom `renderWithProviders` helper in `src/__tests__/utils/renderWithProviders.js` if the component depends on Routers or Contexts.
- Use `screen.getByRole` or `screen.getByText` instead of `querySelector` or test IDs when possible to test accessibility correctly.
- Test user flows using `@testing-library/user-event`.

### B. Hook Tests
- Use `renderHook` from `@testing-library/react`.
- When dealing with state updates from asynchronous functions inside hooks, wrap the interaction in `act()`.

### C. Service / Integration Tests
- Do not test actual contract calls against live networks in Jest tests.
- Always mock `ethers.js` interactions or use the mocked data from `src/__tests__/utils/mockContracts.js`.

### D. Code Coverage Target
- **Minimum Target**: >80% lines and functions coverage.
- If a PR drops the coverage below this threshold, the CI pipeline will fail.
- Please write tests for both happy paths and error boundaries (like failing API calls, failing transactions).

## 5. CI/CD Integration
- On every pull request, GitHub Actions will run `npm test`.
- Coverage reports are generated and attached to the PR.
- To execute E2E tests manually on staging, use `npx playwright test`.

Happy coding and keep our TVL safe by writing reliable tests!
