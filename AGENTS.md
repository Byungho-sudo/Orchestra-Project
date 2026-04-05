# Orchestra Project — Agent Guidance

## Architecture Categories

Current responsibility layers:

- hook logic
- component rendering
- helper logic
- orchestration

Definitions:

Hook logic:
Behavior, async workflows, mutations, validation, and persistence coordination.

Component rendering:
UI sections, layout composition, and render-heavy branches.

Helper logic:
Pure functions such as shaping, normalization, sorting, and shared utilities.

Orchestration:
Coordination of hooks and components, shallow page-level UI state, and wiring.

## ProjectDetailClient.tsx

This file is the page orchestrator.

It should coordinate behavior rather than accumulate new logic.

It may temporarily hold small uncategorized logic if no better category exists yet,
but that logic should remain isolated and easy to extract later.

## Growth Awareness

If ProjectDetailClient.tsx grows significantly during a task:

- briefly explain what responsibility was added
- state whether the growth is temporary or appropriate
- note any obvious future extraction opportunity

This rule is for awareness, not restriction.

## Flexibility

Treat the architecture as guided but adaptable.

If a new responsibility pattern begins repeating,
propose a new category or boundary rather than forcing existing ones.
