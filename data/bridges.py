"""Cross-cert "bridges": short lessons on an idea that several certs teach.

Each bridge says what the shared idea is, how each cert frames it (and which
lesson of that cert it belongs next to), where the same words mean different
things, and a couple of questions that only make sense if you know both
sides. They are the optional "same idea, other cert" sections on Home's
study path: a bridge is offered after the unit it is attached to, for
whichever of its certs the learner has in their plan.

The content lives in data/bridges_<group>.py files (each exports BRIDGES);
this module just loads every one of them, so a group can be added or edited
without touching the others. Shape of one bridge, validated by build.py:

    {
      'id': 'br-least-privilege',              # unique, starts with 'br-'
      'title': 'Least privilege',
      'summary': 'The shared idea in 2-4 sentences.',
      'appearsIn': [                            # >= 2 entries, distinct certs
        {'track': 'az900', 'lesson': 'identity-security',   # a real lesson id of that track
         'angle': 'How this cert frames the idea, 1-3 sentences.'},
        ...
      ],
      'watchOut': 'Where the same words mean different things across certs.',
      'questions': [                            # 2-3, all multiple choice
        {'id': 'br-least-privilege-q1', 'type': 'mc', 'question': '...',
         'options': ['...', '...', '...', '...'], 'correct': 0,
         'explanation': '...', 'whyTested': '...'},   # whyTested optional
      ],
    }
"""
import importlib
import pkgutil
from pathlib import Path

BRIDGES = []

for _info in sorted(pkgutil.iter_modules([str(Path(__file__).parent)]), key=lambda m: m.name):
    if _info.name.startswith('bridges_'):
        BRIDGES.extend(importlib.import_module(f'data.{_info.name}').BRIDGES)
