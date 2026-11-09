"""SC-900 track: combines the three content parts (_a, _b and _c) into one track module.

Part A owns CATEGORIES (concepts and Microsoft Entra); part B owns the security solutions;
part C owns the compliance solutions plus the Mad Libs, Sequences, Compare pairs and the
case study. IDs are kept unique between the parts by range (see each part's header).
"""
from . import sc900_a as _a, sc900_b as _b, sc900_c as _c

CATEGORIES = _a.CATEGORIES
FLASHCARDS = _a.FLASHCARDS + _b.FLASHCARDS + _c.FLASHCARDS
QUESTIONS = _a.QUESTIONS + _b.QUESTIONS + _c.QUESTIONS
LESSONS = _a.LESSONS + _b.LESSONS + _c.LESSONS
MADLIBS = _c.MADLIBS
SEQUENCES = _c.SEQUENCES
CASE_STUDIES = _c.CASE_STUDIES
COMPARE = _c.COMPARE
CHEAT_SHEET = _a.CHEAT_SHEET + _b.CHEAT_SHEET + _c.CHEAT_SHEET
