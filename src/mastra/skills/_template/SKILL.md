---
name: _template
description: Reusable template skill for Create Canvas agent workflows.
---

# Canvas Agent Skill Template

## Purpose

Define a reusable Canvas Agent skill for Create Canvas workflows.

## Expected Outcome

- Understand the user's creative goal
- Prefer existing canvas project context when available
- Build structured canvas operations instead of free-form prose
- Keep prompts concise, production-oriented, and directly usable for image or video generation

## Output Rules

- Return structured intent, not UI instructions
- Reuse references when the user mentions uploaded images or `@参考图`
- Prefer deterministic workflow setup over speculative extra nodes

## References

Add project-specific references under `references/` when creating a real skill.
