"""Claude Certified Developer - Foundations (CCDV-F): building, integrating and shipping with Claude.

Written against the official Anthropic exam guide (version 1.0, effective July 2026) and
verified against the current Claude, Claude Code, Agent SDK and MCP documentation.
The track is split into two content parts so two writers can work in parallel; this
module owns CATEGORIES and combines the parts (see data/cissp.py for the same pattern).
IDs stay unique between the parts by range (part A uses 1-999, part B uses 1001+).
Part B is written by two writers: B1 (flashcards and questions) and B2 (lessons, games, case studies, cheat sheet).
"""
from . import ccdv_a as _a, ccdv_b1 as _b1, ccdv_b2 as _b2

_PARTS = [_a, _b1, _b2]

CATEGORIES = [{'key': 'agents',
  'label': 'Agents and Workflows',
  'marks': 15,
  'resources': [{'label': 'Claude docs: tool use overview',
                 'url': 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview'},
                {'label': 'Claude docs: build a tool-using agent',
                 'url': 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/build-a-tool-using-agent'},
                {'label': 'Agent SDK overview', 'url': 'https://code.claude.com/docs/en/agent-sdk/overview'},
                {'label': 'Claude docs: Managed Agents overview', 'url': 'https://platform.claude.com/docs/en/managed-agents/overview'}]},
 {'key': 'apps',
  'label': 'Applications and Integration',
  'marks': 33,
  'resources': [{'label': 'Claude docs: working with the Messages API',
                 'url': 'https://platform.claude.com/docs/en/build-with-claude/working-with-messages'},
                {'label': 'Claude docs: streaming', 'url': 'https://platform.claude.com/docs/en/build-with-claude/streaming'},
                {'label': 'Claude docs: handling stop reasons',
                 'url': 'https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons'},
                {'label': 'Claude docs: structured outputs',
                 'url': 'https://platform.claude.com/docs/en/build-with-claude/structured-outputs'},
                {'label': 'Claude docs: batch processing', 'url': 'https://platform.claude.com/docs/en/build-with-claude/batch-processing'},
                {'label': 'Claude docs: files', 'url': 'https://platform.claude.com/docs/en/build-with-claude/files'}]},
 {'key': 'code',
  'label': 'Claude Code',
  'marks': 3,
  'resources': [{'label': 'Claude Code: overview', 'url': 'https://code.claude.com/docs/en/overview'},
                {'label': 'Claude Code: how Claude remembers your project (CLAUDE.md)', 'url': 'https://code.claude.com/docs/en/memory'},
                {'label': 'Claude Code: run programmatically (headless)', 'url': 'https://code.claude.com/docs/en/headless'}]},
 {'key': 'testing',
  'label': 'Evaluation, Testing and Debugging',
  'marks': 3,
  'resources': [{'label': 'Claude docs: define success and develop tests',
                 'url': 'https://platform.claude.com/docs/en/test-and-evaluate/develop-tests'},
                {'label': 'Claude docs: troubleshooting tool use',
                 'url': 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/troubleshooting-tool-use'},
                {'label': 'Claude docs: increase output consistency',
                 'url': 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/increase-consistency'}]},
 {'key': 'models',
  'label': 'Model Selection and Optimization',
  'marks': 17,
  'resources': [{'label': 'Claude docs: choosing a model',
                 'url': 'https://platform.claude.com/docs/en/about-claude/models/choosing-a-model'},
                {'label': 'Claude docs: prompt caching', 'url': 'https://platform.claude.com/docs/en/build-with-claude/prompt-caching'},
                {'label': 'Claude docs: effort', 'url': 'https://platform.claude.com/docs/en/build-with-claude/effort'},
                {'label': 'Claude docs: extended thinking',
                 'url': 'https://platform.claude.com/docs/en/build-with-claude/extended-thinking'},
                {'label': 'Claude docs: pricing', 'url': 'https://platform.claude.com/docs/en/about-claude/pricing'}]},
 {'key': 'prompting',
  'label': 'Prompt and Context Engineering',
  'marks': 11,
  'resources': [{'label': 'Claude docs: prompting best practices',
                 'url': 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices'},
                {'label': 'Claude docs: context windows', 'url': 'https://platform.claude.com/docs/en/build-with-claude/context-windows'},
                {'label': 'Claude docs: compaction', 'url': 'https://platform.claude.com/docs/en/build-with-claude/compaction'},
                {'label': 'Claude docs: context editing', 'url': 'https://platform.claude.com/docs/en/build-with-claude/context-editing'}]},
 {'key': 'safety',
  'label': 'Security and Safety',
  'marks': 8,
  'resources': [{'label': 'Claude docs: mitigate jailbreaks and prompt injections',
                 'url': 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks'},
                {'label': 'Claude docs: reduce prompt leak',
                 'url': 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-prompt-leak'},
                {'label': 'Claude docs: authentication', 'url': 'https://platform.claude.com/docs/en/manage-claude/authentication'},
                {'label': 'Claude docs: API and data retention',
                 'url': 'https://platform.claude.com/docs/en/manage-claude/api-and-data-retention'},
                {'label': 'Agent SDK: securely deploying AI agents',
                 'url': 'https://code.claude.com/docs/en/agent-sdk/secure-deployment'}]},
 {'key': 'tools',
  'label': 'Tools and MCPs',
  'marks': 10,
  'resources': [{'label': 'Claude docs: define tools', 'url': 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools'},
                {'label': 'Claude docs: handle tool calls',
                 'url': 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls'},
                {'label': 'Claude docs: the MCP connector', 'url': 'https://platform.claude.com/docs/en/agents-and-tools/mcp-connector'},
                {'label': 'Model Context Protocol specification', 'url': 'https://modelcontextprotocol.io/specification/latest'},
                {'label': 'Claude Code: connect to tools via MCP', 'url': 'https://code.claude.com/docs/en/mcp'}]}]

FLASHCARDS = [x for p in _PARTS for x in p.FLASHCARDS]
QUESTIONS = [x for p in _PARTS for x in p.QUESTIONS]
LESSONS = [x for p in _PARTS for x in p.LESSONS]
MADLIBS = [x for p in _PARTS for x in p.MADLIBS]
SEQUENCES = [x for p in _PARTS for x in p.SEQUENCES]
CASE_STUDIES = [x for p in _PARTS for x in p.CASE_STUDIES]
COMPARE = [x for p in _PARTS for x in p.COMPARE]


def _ordered_cheat_sheet():
    """Parts in order, with the exam-day strategy section moved to the end."""
    sections = [s for p in _PARTS for s in p.CHEAT_SHEET if not s['heading'].startswith('Placeholder')]
    last = [s for s in sections if s['heading'].lower().startswith('exam-day strategy')]
    return [s for s in sections if s not in last] + last


CHEAT_SHEET = _ordered_cheat_sheet()
