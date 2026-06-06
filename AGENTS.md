# Agents

Specialized agents that do heavy work and return concise summaries to preserve context.

## Core Philosophy

> “Don't anthropomorphize subagents. Use them to organize your prompts and elide context. Subagents are best when they can do lots of work but then provide small amounts of information back to the main conversation thread.”
>
> – Adam Wolff, Anthropic

## Available Agents

### 🔍 `code-analyzer`
- **Purpose**: Hunt bugs across multiple files without polluting main context
- **Pattern**: Search many files → Analyze code → Return bug report
- **Usage**: When you need to trace logic flows, find bugs, or validate changes
- **Returns**: Concise bug report with critical findings only

### 📄 `file-analyzer`
- **Purpose**: Read and summarize verbose files (logs, outputs, configs)
- **Pattern**: Read files → Extract insights → Return summary
- **Usage**: When you need to understand log files or analyze verbose output
- **Returns**: Key findings and actionable insights (80-90% size reduction)

### 🧪 `test-runner`
- **Purpose**: Execute tests without dumping output to main thread
- **Pattern**: Run tests → Capture to log → Analyze results → Return summary
- **Usage**: When you need to run tests and understand failures
- **Returns**: Test results summary with failure analysis

### 🔀 `parallel-worker`
- **Purpose**: Coordinate multiple parallel work streams for an issue
- **Pattern**: Read analysis → Spawn sub-agents → Consolidate results → Return summary
- **Usage**: When executing parallel work streams in a worktree
- **Returns**: Consolidated status of all parallel work

## Why Agents?

Agents are **context firewalls** that protect the main conversation from information overload:

```
Without Agent:
Main thread reads 10 files → Context explodes → Loses coherence

With Agent:
Agent reads 10 files → Main thread gets 1 summary → Context preserved
```

## How Agents Preserve Context

1. **Heavy Lifting** - Agents do the messy work (reading files, running tests, implementing features)
2. **Context Isolation** - Implementation details stay in the agent, not the main thread
3. **Concise Returns** - Only essential information returns to main conversation
4. **Parallel Execution** - Multiple agents can work simultaneously without context collision

## Example Usage

```bash
# Analyzing code for bugs
Task: "Search for memory leaks in the codebase"
Agent: code-analyzer
Returns: "Found 3 potential leaks: [concise list]"
Main thread never sees: The hundreds of files examined

# Running tests
Task: "Run authentication tests"
Agent: test-runner
Returns: "2/10 tests failed: [failure summary]"
Main thread never sees: Verbose test output and logs

# Parallel implementation
Task: "Implement issue #1234 with parallel streams"
Agent: parallel-worker
Returns: "Completed 4/4 streams, 15 files modified"
Main thread never sees: Individual implementation details
```

## Creating New Agents

New agents should follow these principles:

1. **Single Purpose** - Each agent has one clear job
2. **Context Reduction** - Return 10-20% of what you process
3. **No Roleplay** - Agents aren't "experts", they're task executors
4. **Clear Pattern** - Define input → processing → output pattern
5. **Error Handling** - Gracefully handle failures and report clearly

## Anti-Patterns to Avoid

❌ **Creating "specialist" agents** (database-expert, api-expert)
   Agents don't have different knowledge - they're all the same model

❌ **Returning verbose output**
   Defeats the purpose of context preservation

❌ **Making agents communicate with each other**
   Use a coordinator agent instead (like parallel-worker)

❌ **Using agents for simple tasks**
   Only use agents when context reduction is valuable

## Integration with PM System

Agents integrate seamlessly with the PM command system:

- `/pm:issue-analyze` → Identifies work streams
- `/pm:issue-start` → Spawns parallel-worker agent
- parallel-worker → Spawns multiple sub-agents
- Sub-agents → Work in parallel in the worktree
- Results → Consolidated back to main thread

This creates a hierarchy that maximizes parallelism while preserving context at every level.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
