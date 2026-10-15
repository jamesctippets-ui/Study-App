"""Claude Certified Architect - Professional (CCAR-P): end-to-end Claude solution design, governance and delivery.

Written against the official Anthropic exam guide (version 1.0, effective July 2026) and
verified against the current Claude, Claude Code, Agent SDK and MCP documentation.
The track is split into two content parts so two writers can work in parallel; this
module owns CATEGORIES and combines the parts (see data/cissp.py for the same pattern).
IDs stay unique between the parts by range (part A uses 1-999, part B uses 1001+).
Part B is written by two writers: B1 (flashcards and questions) and B2 (lessons, games, case studies, cheat sheet).
"""
from . import ccarp_a as _a, ccarp_b1 as _b1, ccarp_b2 as _b2

_PARTS = [_a, _b1, _b2]

CATEGORIES = [{'key': 'design',
  'label': 'Solution Design and Architecture',
  'marks': 17,
  'resources': [{'label': 'Claude docs: Managed Agents overview', 'url': 'https://platform.claude.com/docs/en/managed-agents/overview'},
                {'label': 'Claude docs: tool use overview',
                 'url': 'https://platform.claude.com/docs/en/agents-and-tools/tool-use/overview'},
                {'label': 'Agent SDK overview', 'url': 'https://code.claude.com/docs/en/agent-sdk/overview'},
                {'label': 'Claude docs: choosing a model',
                 'url': 'https://platform.claude.com/docs/en/about-claude/models/choosing-a-model'}]},
 {'key': 'models',
  'label': 'Claude Models, Prompting and Context Engineering',
  'marks': 13,
  'resources': [{'label': 'Claude docs: models overview', 'url': 'https://platform.claude.com/docs/en/models/overview'},
                {'label': 'Claude docs: optimizing for cost and intelligence',
                 'url': 'https://platform.claude.com/docs/en/about-claude/models/optimizing-for-cost-and-intelligence'},
                {'label': 'Claude docs: prompting best practices',
                 'url': 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices'},
                {'label': 'Claude docs: context windows', 'url': 'https://platform.claude.com/docs/en/build-with-claude/context-windows'},
                {'label': 'Claude docs: prompt caching', 'url': 'https://platform.claude.com/docs/en/build-with-claude/prompt-caching'}]},
 {'key': 'integration',
  'label': 'Integration',
  'marks': 19,
  'resources': [{'label': 'Claude docs: the MCP connector', 'url': 'https://platform.claude.com/docs/en/agents-and-tools/mcp-connector'},
                {'label': 'Claude docs: remote MCP servers',
                 'url': 'https://platform.claude.com/docs/en/agents-and-tools/remote-mcp-servers'},
                {'label': 'Model Context Protocol specification', 'url': 'https://modelcontextprotocol.io/specification/latest'},
                {'label': 'Claude docs: Claude on Amazon Bedrock',
                 'url': 'https://platform.claude.com/docs/en/build-with-claude/claude-in-amazon-bedrock'},
                {'label': 'Claude docs: Claude on Vertex AI',
                 'url': 'https://platform.claude.com/docs/en/build-with-claude/claude-on-vertex-ai'},
                {'label': 'Claude docs: Claude in Microsoft Foundry',
                 'url': 'https://platform.claude.com/docs/en/build-with-claude/claude-in-microsoft-foundry'}]},
 {'key': 'evaluation',
  'label': 'Evaluation, Testing and Optimization',
  'marks': 16,
  'resources': [{'label': 'Claude docs: define success and develop tests',
                 'url': 'https://platform.claude.com/docs/en/test-and-evaluate/develop-tests'},
                {'label': 'Claude docs: batch processing', 'url': 'https://platform.claude.com/docs/en/build-with-claude/batch-processing'},
                {'label': 'Claude docs: token counting', 'url': 'https://platform.claude.com/docs/en/build-with-claude/token-counting'},
                {'label': 'Claude docs: reduce latency',
                 'url': 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-latency'},
                {'label': 'Claude docs: OpenTelemetry', 'url': 'https://platform.claude.com/docs/en/manage-claude/opentelemetry'}]},
 {'key': 'governance',
  'label': 'Governance, Safety and Risk Management',
  'marks': 14,
  'resources': [{'label': 'Claude docs: API and data retention',
                 'url': 'https://platform.claude.com/docs/en/manage-claude/api-and-data-retention'},
                {'label': 'Claude docs: data residency', 'url': 'https://platform.claude.com/docs/en/manage-claude/data-residency'},
                {'label': 'Claude docs: workload identity federation',
                 'url': 'https://platform.claude.com/docs/en/manage-claude/workload-identity-federation'},
                {'label': 'Claude docs: mitigate jailbreaks and prompt injections',
                 'url': 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/mitigate-jailbreaks'},
                {'label': 'Claude Code: security', 'url': 'https://code.claude.com/docs/en/security'}]},
 {'key': 'stakeholders',
  'label': 'Stakeholder Communication and Lifecycle Management',
  'marks': 14,
  'resources': [{'label': 'Claude docs: pricing', 'url': 'https://platform.claude.com/docs/en/about-claude/pricing'},
                {'label': 'Claude docs: model deprecations', 'url': 'https://platform.claude.com/docs/en/about-claude/model-deprecations'},
                {'label': 'Claude docs: release notes', 'url': 'https://platform.claude.com/docs/en/release-notes/overview'},
                {'label': 'Claude Code: manage costs effectively', 'url': 'https://code.claude.com/docs/en/costs'}]},
 {'key': 'productivity',
  'label': 'Developer Productivity and Operational Enablement',
  'marks': 7,
  'resources': [{'label': 'Claude Code: set up for your organization', 'url': 'https://code.claude.com/docs/en/admin-setup'},
                {'label': 'Claude Code: deploy managed settings', 'url': 'https://code.claude.com/docs/en/managed-settings'},
                {'label': 'Claude Code: track team usage with analytics', 'url': 'https://code.claude.com/docs/en/analytics'},
                {'label': 'Claude Code: champion kit', 'url': 'https://code.claude.com/docs/en/champion-kit'}]}]

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
