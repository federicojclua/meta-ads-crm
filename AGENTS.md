# Cotejo CRM — Agent Rules

## Mandatory Rules

These rules apply to any agent (AI or human) working on this project.

### 1. Read Before Modify
- Read all relevant documentation before modifying any file
- Check DECISIONS.md for established architectural choices
- Check CHANGELOG.md for recent changes

### 2. One Stage at a Time
- Execute only the current approved stage
- Do not jump ahead to future stages
- Do not implement features from later stages "just because it's easy"
- Stop at the end of each stage and wait for approval

### 3. No Scope Creep
- If a task requires work outside the current stage, document it as a TODO
- Do not add features that were not requested
- Do not refactor unrelated code during a stage

### 4. Dependency Discipline
- Do not install dependencies without justification
- Document every new dependency in the commit message
- Prefer well-maintained, widely-used packages
- Check bundle size impact before adding frontend dependencies

### 5. No File Deletion Without Approval
- Never delete files without explicit user approval
- If a file is obsolete, mark it for deletion and ask

### 6. Secrets Management
- Never access, display, or log secrets
- Never commit .env files or credentials
- Never use VITE_ prefix for server-side secrets
- Never hardcode credentials in source code
- Never show credential values in documentation, commits, or conversations

### 7. Build and Test
- Run `npm run build` after every significant change
- Verify the build succeeds before declaring work complete
- Run any existing tests
- Check for console errors in the browser

### 8. Show Your Work
- List all files modified in your summary
- Explain non-obvious decisions
- Note any known issues or limitations

### 9. Update CHANGELOG
- Add entries to CHANGELOG.md for every significant change
- Group changes by category (Added, Changed, Fixed, Removed)

### 10. Commit Protocol
- Do NOT commit without explicit user approval
- Use conventional commit messages:
  - `feat:` for new features
  - `fix:` for bug fixes
  - `docs:` for documentation changes
  - `chore:` for maintenance tasks
  - `refactor:` for code restructuring
  - `test:` for test additions

### 11. No Production Deploy Without Authorization
- Never deploy to production without explicit user approval
- Use preview deploys for testing
- Document what will be deployed

### 12. Stop at Stage End
- When a stage is complete, stop
- Present deliverables
- Wait for review and approval
- Do not start the next stage automatically

## Quality Standards

### Code
- Clear, readable JavaScript
- Meaningful variable and function names
- Comments for non-obvious logic
- Consistent formatting (Prettier config when added)
- Error handling on all async operations

### Security
- Token verification on every API endpoint
- clientId filtering on every tenant query
- Input validation and sanitization
- No eval(), no dynamic require(), no template injection

### Performance
- Lazy load routes when possible
- Minimize bundle size
- Use TanStack Query for caching
- MongoDB connection pooling in serverless functions

### Accessibility
- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance
