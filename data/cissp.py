"""CISSP track: combines the two content parts (_a and _b) into one track module.

Part A owns CATEGORIES (and the exam-strategy cheat-sheet section); part B
owns the rest of the items. IDs are kept unique between the parts by range
(see each part's header).
"""
from . import cissp_a as _a, cissp_b as _b

CATEGORIES = _a.CATEGORIES
FLASHCARDS = _a.FLASHCARDS + _b.FLASHCARDS
QUESTIONS = _a.QUESTIONS + _b.QUESTIONS
LESSONS = _a.LESSONS + _b.LESSONS
MADLIBS = _a.MADLIBS + _b.MADLIBS
SEQUENCES = _a.SEQUENCES + _b.SEQUENCES
CASE_STUDIES = _a.CASE_STUDIES + _b.CASE_STUDIES
COMPARE = _a.COMPARE + _b.COMPARE
CHEAT_SHEET = _a.CHEAT_SHEET + _b.CHEAT_SHEET
