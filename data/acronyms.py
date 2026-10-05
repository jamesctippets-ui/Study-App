"""Acronym and initialism expansions for the definition flyouts.

When a flyout opens, any acronym in its title, definition, or detail text that
appears here is expanded ("RBAC — Role-based access control"), and an
acronym used on its own in lesson, quiz, or bridge text can be tapped to see
its expansion. Everything is shared across certs, so an acronym that means
different things in different certs lists every meaning.

    ACRONYMS = {
        'RBAC': {'exp': 'Role-based access control'},
        'CA': {'exp': ['Conditional Access', 'Certificate authority']},   # ambiguous: every meaning
        'ID': {'exp': 'Identifier', 'trigger': False},                    # expand in flyouts, but not tappable
    }

* `exp` is a string, or a list of strings when the acronym is ambiguous.
  Use the standard capitalisation of the spelled-out form.
* `trigger: False` marks ubiquitous acronyms (ID, OS, GB...) that are expanded
  inside flyouts but not turned into tappable words in running text.
* A plural ('VMs', 'NSGs') is covered by its singular entry.

`IGNORE` lists tokens the content uses that are NOT acronyms (SQL keywords,
product and brand names, sample variable names, cert codes, units) so
build.py's coverage check can require that every real acronym is defined.
When ENFORCE_COVERAGE is True, build.py fails if content uses an acronym-like
token at least twice that is in neither ACRONYMS nor IGNORE
(run `python3 build.py --check-acronyms` to list them).
"""

ENFORCE_COVERAGE = False

ACRONYMS = {}

IGNORE = set()
