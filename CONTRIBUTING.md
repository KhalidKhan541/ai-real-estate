# Contributing to AI Real Estate Platform

Thank you for your interest in contributing! This guide will help you get started.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help create a welcoming environment

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch
4. Make your changes
5. Submit a pull request

## Development Setup

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Run development server
npm run dev

# Run tests
npm test
```

## Branch Naming

- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation
- `refactor/` - Code refactoring
- `test/` - Adding tests
- `chore/` - Maintenance tasks

## Commit Messages

Follow Conventional Commits:

```
feat: add new property valuation feature
fix: resolve search filter bug
docs: update API documentation
refactor: improve error handling
test: add unit tests for mortgage service
chore: update dependencies
```

## Pull Request Process

1. Update documentation if needed
2. Add tests for new functionality
3. Ensure all tests pass
4. Update the changelog if applicable
5. Request review from maintainers

## Code Standards

### TypeScript

- Use strict TypeScript
- Avoid `any` types
- Define interfaces for all data structures
- Use proper error handling

### React

- Use functional components
- Use hooks for state management
- Keep components small and focused
- Write tests for all components

### Testing

- Write unit tests for services
- Write component tests for UI
- Maintain >80% code coverage
- Test edge cases and error scenarios

### CSS/Styling

- Use Tailwind CSS utility classes
- Follow the design system
- Ensure responsive design
- Support dark mode

## Testing Guidelines

### Unit Tests

```typescript
describe("ServiceName", () => {
  it("should do something specific", async () => {
    const result = await service.doSomething(input);
    expect(result).toEqual(expected);
  });
});
```

### Component Tests

```typescript
describe("ComponentName", () => {
  it("renders correctly", () => {
    render(<ComponentName {...props} />);
    expect(screen.getByTestId("element")).toBeInTheDocument();
  });

  it("handles user interaction", () => {
    const handler = jest.fn();
    render(<ComponentName onClick={handler} />);
    fireEvent.click(screen.getByRole("button"));
    expect(handler).toHaveBeenCalled();
  });
});
```

## Performance

- Use React.memo for expensive components
- Implement proper loading states
- Optimize images and assets
- Use proper caching strategies

## Security

- Never commit secrets or API keys
- Validate all user input
- Use proper authentication
- Follow OWASP guidelines

## Questions?

Open an issue or reach out to the maintainers.
