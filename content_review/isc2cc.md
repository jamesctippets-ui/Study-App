# Content review: isc2cc (ISC2 Certified in Cybersecurity, outline effective Sept 1, 2026)

Reviewer: cr-cc-cloudplus. Source: `data/isc2cc.py`. Checked against the ISC2 exam outline page
(https://www.isc2.org/certifications/cc/cc-certification-exam-outline) and the ISC2 ethics page (https://www.isc2.org/ethics).

## Counts
| Item type | Read | Changed | Flagged |
|---|---|---|---|
| Flashcards | 240 (f1-f110, f9001-f9130) | 5 | 0 |
| Questions (mc 170, ms 33, tf 53) | 256 | 2 | 0 |
| Mad libs | 11 | 3 | 0 |
| Sequences | 8 | 0 | 0 |
| Compare pairs | 14 | 0 | 0 |
| Case studies | 4 (16 questions) | 0 | 0 |
| Lesson readings | 7 | 1 (one phrase) | 0 |
| Cheat sheet | 14 sections | 0 | 1 |

`python3 build.py` passes and `python3 tools/audit_content.py isc2cc` shows 0 errors (1 warning, see below).

## Changed
- q9053 | The audit's duplicate-options error was a false positive in the tool (it strips punctuation, so `2001:db8:::1` and `2001:db8::1` look identical), but the item had two real defects: the key option and a distractor differed only by one colon, and the explanation said "the first and third ... the second ..." (positional wording that is wrong once options are shuffled) | Distractor `2001:db8:::1` changed to `2001:db8::1::5` (two double colons, the classic invalid form); explanation rewritten with no positional words and now explains each wrong option. Key unchanged.
- q9027 | Explanation said "a thank-you note is not a control", but the distractor is a vendor letter promising nothing will go wrong | "a vendor's promise letter is not a control".
- f3 (Integrity) | With the term blanked the definition read "file _____ monitoring support it", nonsense | "file integrity monitoring" changed to "file-change monitoring".
- f10 (Threat, vulnerability and asset) | EXAMPLE line began "Example: ..." under an EXAMPLE heading | Removed the redundant "Example:".
- f86 (TLS and HTTPS) | "SSL ... deprecated (RFC 8996)": RFC 8996 deprecates TLS 1.0/1.1, SSL 3.0 is RFC 7568 | "(RFC 7568 and RFC 8996)".
- f9043 (IGA) | EXAMPLE referred to "the outline's frameworks and tools bullet", which the learner cannot see | Removed that sentence; kept the second sentence.
- f9097 (Information sharing) | Blanked prompt read "Communities such as _____ and analysis centers (ISACs)" (the term sat inside the spelled-out acronym) | Reworded to "Industry-based communities called ISACs, and threat feeds, let organizations share ..."; meaning unchanged.
- ml-isc2cc-4 | "something you {b1} with something you {b2}": "are"/"know" in the opposite order would also be true, so a blank had two defensible answers | Sentence now ties each blank to its item: "combines the password, something you {b1}, with the fingerprint, something you {b2}".
- ml-isc2cc-9001 | "An {b1} backup ... a {b2} backup": the article "An" gave away "incremental" (only option starting with a vowel) | "The {b1} backup ... the {b2} backup".
- ml-isc2cc-9003 | "is an {b1}" gave away "evil twin" by the article; "novelty" in b3 is an absurd distractor | "The term for a fake wireless network that copies a real network's name is {b1}."; b3 distractor "novelty" changed to "frequent patching" (plausible but wrong for OT).
- Lesson `operations-malware-incident-response` | "Cryptography protects data in operation." (odd phrase) | "in everyday operations".

## Needs a human check
- Cheat sheet, section "Exam-day strategy" | States "About 25 items are unscored pretest items". The ISC2 outline page confirms 2 hours, 100 to 125 items, multiple choice and advanced item types, CAT, 700/1000, but says nothing about the number of pretest items, and I found no ISC2 source for 25 | Left as is; confirm against ISC2's exam policy or soften to "some items are unscored pretest items".
- f9021 ("Purpose and importance of GRC") vs f28 (GRC) | Both definitions can be answered "GRC"; the front of f9021 is a phrase, not a term | Left unchanged: the definition ends "Without it, security work is ad hoc ...", which reads as a why-card, and a re-front would change the blanking behaviour. Owner may prefer to merge or re-front.
- Audit warning `tf9017` "placeholder": false alarm, the word is used correctly ("random placeholder" in a tokenization definition).

## Patterns
This track was in good shape: facts checked against current sources (NIST SP 800-63B-4 password rules, SP 800-61 Rev. 3, FIPS 203/204/205, PCI DSS v4.0.1, ISO/IEC 27002:2022, CIS Controls v8.1, ISC2 canons and preamble, ALE and backup arithmetic) were all correct, answer keys were right, distractors were plausible, and giveaway length bias is small (correct is longest in only 15% of multiple-choice items, mostly single-term answers). The defects were small wording problems: a positional explanation (q9053), definitions whose blanked form reads badly (f3, f9097), articles that gave mad-lib answers away, and one mismatch between an option and its explanation. Cards cover the 2026 outline well; categories fit (physical access controls and social engineering sit in Principles/Governance rather than the domain a reader might expect, but are defensible).
