"""Claude Certified Associate - Foundations (CCAO-F): everyday professional use of Claude.

Written against the official Anthropic exam guide (version 1.0, effective July 2026) and
verified against the current Claude, Claude Code, Agent SDK and MCP documentation.
The track is split into two content parts so two writers can work in parallel; this
module owns CATEGORIES and combines the parts (see data/cissp.py for the same pattern).
IDs stay unique between the parts by range (part A uses 1-999, part B uses 1001+).
Part B is written by two writers: B1 (flashcards and questions) and B2 (lessons, games, case studies, cheat sheet).
"""
from . import ccao_a as _a, ccao_b1 as _b1, ccao_b2 as _b2

_PARTS = [_a, _b1, _b2]

CATEGORIES = [{'key': 'prompting',
  'label': 'Prompting and Task Execution',
  'marks': 14,
  'resources': [{'label': 'Claude docs: prompt engineering overview',
                 'url': 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview'},
                {'label': 'Claude docs: prompting best practices',
                 'url': 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices'},
                {'label': 'Claude Help Center: upload files to Claude',
                 'url': 'https://support.claude.com/en/articles/8241126-upload-files-to-claude'}]},
 {'key': 'evaluation',
  'label': 'Output Evaluation and Validation',
  'marks': 21,
  'resources': [{'label': 'Claude docs: reduce hallucinations',
                 'url': 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/reduce-hallucinations'},
                {'label': 'Claude docs: citations', 'url': 'https://platform.claude.com/docs/en/build-with-claude/citations'},
                {'label': 'Claude Help Center: when to use web search, extended thinking and research',
                 'url': 'https://support.claude.com/en/articles/11095361-when-should-i-use-web-search-extended-thinking-and-research'}]},
 {'key': 'models',
  'label': 'Product and Model Selection',
  'marks': 12,
  'resources': [{'label': 'Claude docs: choosing a model',
                 'url': 'https://platform.claude.com/docs/en/about-claude/models/choosing-a-model'},
                {'label': 'Claude docs: models overview', 'url': 'https://platform.claude.com/docs/en/models/overview'},
                {'label': 'Claude Help Center: change the model, effort and thinking settings',
                 'url': 'https://support.claude.com/en/articles/8664678-change-the-model-effort-and-thinking-settings'}]},
 {'key': 'workflow',
  'label': 'Workflow Integration and Solution Design',
  'marks': 16,
  'resources': [{'label': 'Claude Help Center: what are Artifacts',
                 'url': 'https://support.claude.com/en/articles/17153992-what-are-artifacts-and-how-do-i-use-them'},
                {'label': 'Claude Help Center: create and edit files with Claude',
                 'url': 'https://support.claude.com/en/articles/12111783-create-and-edit-files-with-claude'},
                {'label': 'Claude Help Center: browse skills, connectors and plugins',
                 'url': 'https://support.claude.com/en/articles/14328846-browse-skills-connectors-and-plugins-in-one-directory'}]},
 {'key': 'knowledge',
  'label': 'Configuration and Knowledge Management',
  'marks': 12,
  'resources': [{'label': 'Claude Help Center: what are Projects',
                 'url': 'https://support.claude.com/en/articles/9517075-what-are-projects'},
                {'label': 'Claude Help Center: RAG for Projects',
                 'url': 'https://support.claude.com/en/articles/11473015-retrieval-augmented-generation-rag-for-projects'},
                {'label': 'Claude Help Center: what are Skills', 'url': 'https://support.claude.com/en/articles/12512176-what-are-skills'},
                {'label': 'Claude Help Center: Claude personalization features',
                 'url': 'https://support.claude.com/en/articles/10185728-understanding-claude-s-personalization-features'}]},
 {'key': 'governance',
  'label': 'Governance, Risk, and Responsible Use',
  'marks': 15,
  'resources': [{'label': 'Claude Help Center: Anthropic privacy practices',
                 'url': 'https://support.claude.com/en/articles/10035659-where-can-i-learn-more-about-anthropic-s-privacy-practices'},
                {'label': 'Claude Help Center: certifications Anthropic has obtained',
                 'url': 'https://support.claude.com/en/articles/10015870-what-certifications-has-anthropic-obtained'},
                {'label': 'Claude Help Center: using Claude for legal work',
                 'url': 'https://support.claude.com/en/articles/15707726-using-claude-for-legal-work-privilege-confidentiality-and-how-to-think-about-configuration'},
                {'label': 'Claude Help Center: how Claude marks AI-generated content',
                 'url': 'https://support.claude.com/en/articles/16266773-how-claude-marks-ai-generated-content'}]},
 {'key': 'troubleshooting',
  'label': 'Troubleshooting and Optimization',
  'marks': 10,
  'resources': [{'label': 'Claude docs: prompting best practices',
                 'url': 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices'},
                {'label': 'Claude docs: increase output consistency',
                 'url': 'https://platform.claude.com/docs/en/test-and-evaluate/strengthen-guardrails/increase-consistency'},
                {'label': 'Claude Help Center: upload files to Claude',
                 'url': 'https://support.claude.com/en/articles/8241126-upload-files-to-claude'}]}]

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
