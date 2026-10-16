"""Claude Certified Architect - Foundations (CCAR-F): agentic architecture, tools and MCP, Claude Code, prompts and context.

Written against the official Anthropic exam guide (version 1.0, effective July 2026) and
verified against the current Claude, Claude Code, Agent SDK and MCP documentation.
The track is split into two content parts so two writers can work in parallel; this
module owns CATEGORIES and combines the parts (see data/cissp.py for the same pattern).
IDs stay unique between the parts by range (part A uses 1-999, part B uses 1001+).
Part B is written as B1 (flashcards, and the questions written with them) plus group files g1..gN (everything else for
the categories each group owns).
"""
from . import ccarf_a as _a, ccarf_b1 as _b1, ccarf_g1 as _g1, ccarf_g2 as _g2, ccarf_g3 as _g3

_PARTS = [_a, _b1, _g1, _g2, _g3]

CATEGORIES = [{'key': 'agentic',
  'label': 'Agentic Architecture and Orchestration',
  'marks': 27,
  'resources': [{'label': 'Agent SDK: how the agent loop works', 'url': 'https://code.claude.com/docs/en/agent-sdk/agent-loop'},
                {'label': 'Agent SDK: subagents', 'url': 'https://code.claude.com/docs/en/agent-sdk/subagents'},
                {'label': 'Agent SDK: hooks', 'url': 'https://code.claude.com/docs/en/agent-sdk/hooks'},
                {'label': 'Agent SDK: work with sessions', 'url': 'https://code.claude.com/docs/en/agent-sdk/sessions'},
                {'label': 'Claude docs: handle tool calls',
                 'url': 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls'}]},
 {'key': 'tools',
  'label': 'Tool Design and MCP Integration',
  'marks': 18,
  'resources': [{'label': 'Claude docs: define tools', 'url': 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools'},
                {'label': 'Claude docs: how tool use works',
                 'url': 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works'},
                {'label': 'Claude Code: connect to tools via MCP', 'url': 'https://code.claude.com/docs/en/mcp'},
                {'label': 'Model Context Protocol specification', 'url': 'https://modelcontextprotocol.io/specification/latest'},
                {'label': 'Claude docs: strict tool use',
                 'url': 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use'}]},
 {'key': 'claudecode',
  'label': 'Claude Code Configuration and Workflows',
  'marks': 20,
  'resources': [{'label': 'Claude Code: how Claude remembers your project (CLAUDE.md)', 'url': 'https://code.claude.com/docs/en/memory'},
                {'label': 'Claude Code: extend with skills', 'url': 'https://code.claude.com/docs/en/skills'},
                {'label': 'Claude Code: hooks guide', 'url': 'https://code.claude.com/docs/en/hooks-guide'},
                {'label': 'Claude Code: settings files and precedence', 'url': 'https://code.claude.com/docs/en/settings'},
                {'label': 'Claude Code: permissions', 'url': 'https://code.claude.com/docs/en/permissions'},
                {'label': 'Claude Code: run programmatically (headless)', 'url': 'https://code.claude.com/docs/en/headless'},
                {'label': 'Claude Code: GitHub Actions', 'url': 'https://code.claude.com/docs/en/github-actions'}]},
 {'key': 'prompts',
  'label': 'Prompt Engineering and Structured Output',
  'marks': 20,
  'resources': [{'label': 'Claude docs: prompting best practices',
                 'url': 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices'},
                {'label': 'Claude docs: structured outputs',
                 'url': 'https://platform.claude.com/docs/en/build-with-claude/structured-outputs'},
                {'label': 'Claude docs: increase output consistency',
                 'url': 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/increase-consistency'},
                {'label': 'Claude docs: batch processing',
                 'url': 'https://platform.claude.com/docs/en/build-with-claude/batch-processing'}]},
 {'key': 'context',
  'label': 'Context Management and Reliability',
  'marks': 15,
  'resources': [{'label': 'Claude docs: context windows', 'url': 'https://platform.claude.com/docs/en/build-with-claude/context-windows'},
                {'label': 'Claude docs: compaction', 'url': 'https://platform.claude.com/docs/en/build-with-claude/compaction'},
                {'label': 'Claude docs: context editing', 'url': 'https://platform.claude.com/docs/en/build-with-claude/context-editing'},
                {'label': 'Claude docs: reduce hallucinations',
                 'url': 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations'},
                {'label': 'Claude Code: explore the context window', 'url': 'https://code.claude.com/docs/en/context-window'}]}]

FLASHCARDS = [x for p in _PARTS for x in p.FLASHCARDS]
QUESTIONS = [x for p in _PARTS for x in p.QUESTIONS]
LESSONS = [x for p in _PARTS for x in p.LESSONS]
MADLIBS = [x for p in _PARTS for x in p.MADLIBS]
SEQUENCES = [x for p in _PARTS for x in p.SEQUENCES]
CASE_STUDIES = [x for p in _PARTS for x in p.CASE_STUDIES]
COMPARE = [x for p in _PARTS for x in p.COMPARE]
CLI_CHALLENGES = [x for p in _PARTS for x in getattr(p, 'CLI_CHALLENGES', [])]


def _ordered_cheat_sheet():
    """Parts in order, with the exam-day strategy section moved to the end."""
    sections = [s for p in _PARTS for s in p.CHEAT_SHEET if not s['heading'].startswith('Placeholder')]
    last = [s for s in sections if s['heading'].lower().startswith('exam-day strategy')]
    return [s for s in sections if s not in last] + last


CHEAT_SHEET = _ordered_cheat_sheet()
