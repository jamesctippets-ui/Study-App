"""CCAR-F group 2: Domain 4 (Prompt Engineering and Structured Output) questions, lessons, games, case study and cheat sheet.

Written against the official Claude Certified Architect - Foundations exam guide (version 1.0,
effective July 2026): task statements 4.1-4.6 (20%). The flashcards for this category live in
data/ccarf_b1.py (ids f1062-f1113). Product facts were checked against the current Claude API
(structured outputs, strict tool use, tool_choice, Message Batches API), prompting best-practice
and Claude Code documentation (October 2026). Group 2 ids: q1201.., msq1201.., tf1201..,
ml-ccarf-201.., seq-ccarf-201.., cmp-ccarf-201...
"""


def _mc(i, cat, question, options, correct, explanation, why=None):
    q = {'id': i, 'cat': cat, 'type': 'mc', 'question': question, 'options': options, 'correct': correct, 'explanation': explanation}
    if why:
        q['whyTested'] = why
    return q


def _ms(i, cat, question, options, correct, explanation, why=None):
    q = {'id': i, 'cat': cat, 'type': 'ms', 'question': question, 'options': options, 'correct': correct, 'explanation': explanation}
    if why:
        q['whyTested'] = why
    return q


def _tf(i, cat, question, answer, explanation, why=None):
    q = {'id': i, 'cat': cat, 'type': 'tf', 'question': question, 'answer': answer, 'explanation': explanation}
    if why:
        q['whyTested'] = why
    return q


def _cq(cid, n, qtype, question, explanation, options=None, correct=None, answer=None):
    """A case-study question: id is '<case id>-q<n>'."""
    q = {'id': '%s-q%d' % (cid, n), 'type': qtype, 'question': question, 'explanation': explanation}
    if qtype in ('mc', 'ms'):
        q['options'] = options
        q['correct'] = correct
    else:
        q['answer'] = answer
    return q


_PR = 'prompts'

FLASHCARDS = []
QUESTIONS = []
LESSONS = []
MADLIBS = []
SEQUENCES = []
CASE_STUDIES = []
COMPARE = []
CLI_CHALLENGES = []
CHEAT_SHEET = []


# ---------------------------------------------------------------------------
# QUESTIONS - 4.1 Explicit criteria to improve precision and reduce false positives
# ---------------------------------------------------------------------------
QUESTIONS.extend([
    _mc('q1201', _PR,
        'Your team\'s pull-request bot reviews Python services for security problems. Its prompt ends with: "Only report issues you are highly confident are real vulnerabilities." Engineers still get many warnings about harmless code, such as parameterized queries and input validated upstream, and have started ignoring the bot. Which change is most likely to improve precision?',
        ['Strengthen the wording to "only report issues you are 95% certain are exploitable", so the model applies a much higher bar before it speaks up',
         'Have the model attach a confidence score between 0 and 1 to every warning and let code drop any warning scoring below 0.8',
         'Define what to report (string-built SQL, hard-coded secrets, missing authorization checks) and what to skip (parameterized queries, validated input)',
         'Switch to the largest available model, which should be better at telling harmless code from real vulnerabilities in a large service'],
        2,
        'A request for confidence adds no decision boundary: the model already believes the findings it makes, so a stronger phrase or a score cutoff changes little, and self-reported confidence is not calibrated precision. Defining what counts as reportable and what to skip changes the decision itself. A larger model still does not know your team\'s definition of a reportable issue.'),
    _mc('q1202', _PR,
        'A CI job asks Claude to "check that the README examples are accurate". Its comments are full of complaints about wording, missing detail and tone, and maintainers now skim past them. Which rewritten instruction should cut the noise most?',
        ['Flag an example only when running it as written would fail or print something different from what the README shows',
         'Check each example carefully, but be conservative and avoid nitpicking about wording, tone or missing detail',
         'Rate every example from 1 to 10 for accuracy and report only the examples that score below 5',
         'Flag any example that a first-time user could plausibly find confusing, and sort the flags by importance before posting them'],
        0,
        'Flagging an example only when running it would fail is a test the model can answer yes or no, so the bar no longer depends on its own taste. "Accurate" and "conservative" leave the bar undefined, a numeric rating only moves that ambiguity into a number, and "confusing" widens the net to exactly the wording complaints you want to drop.'),
    _mc('q1203', _PR,
        'Your review assistant posts findings in four categories. After a month, measured precision is 93% for security, 88% for bugs, 31% for performance and 22% for naming. Developers have begun dismissing every finding unread, including the security ones. What should you do first?',
        ['Keep all four categories running and add a banner saying that some findings may be wrong, so developers read each one carefully',
         'Lower the severity label on every finding, so that developers feel less pressure to act on any of them',
         'Shut the assistant down until all four categories reach 90% precision, then relaunch it as a whole',
         'Pause the performance and naming categories while their criteria are rewritten, and keep security and bugs running'],
        3,
        'False positives in one category teach developers to ignore the assistant as a whole, so the accurate categories lose their value too. Pausing only the noisy categories restores trust quickly and keeps the useful findings flowing; the paused categories return once their measured precision is acceptable. A banner asks developers to do the filtering, lowering severity hides real problems, and a full shutdown throws away the accurate categories.'),
    _mc('q1204', _PR,
        'Your review prompt asks the model to label each finding critical, major or minor. Running the same diff twice gives different labels for similar defects: an unchecked null return is critical in one run and minor in the next. What is the most effective fix?',
        ['Add a sentence to the prompt telling the model to keep its severity labels consistent from one finding to the next',
         'Define each severity level in the prompt and attach a short code example of a typical finding at that level',
         'Ask for a 0 to 100 severity score in place of labels, and convert score ranges to labels in code',
         'Run every review three times and report the label that occurs most often for each finding'],
        1,
        'The labels drift because the boundaries between levels are undefined. Concrete definitions with an example for each level anchor the judgment, so like defects get like labels. Asking for consistency supplies no boundary, a numeric scale moves the same ambiguity into a number, and voting reduces noise at triple the cost without making the labels match your team\'s definitions.'),
    _mc('q1205', _PR,
        'A colleague proposes adding "only report findings you are highly confident about" to a review prompt as a quick way to cut false positives. Why is this unlikely to work as well as categorical criteria?',
        ['Models skip over intensifying words such as "highly", so the instruction has no effect on the output at all',
         'A review prompt can hold only one filtering rule, so the confidence rule would displace the severity rules that were already there',
         'It defines no standard for what counts as reportable, so the model still rates its own flagged findings as confident',
         'Confidence filtering only takes effect when the prompt also caps how many findings the model may report'],
        2,
        'The instruction sounds careful but provides no criterion. The model believes the findings it makes, so the same wrong ones are still reported with confidence, and self-reported confidence is not a calibrated measure of precision. Categories of what to report and what to skip change the decision itself. The other explanations invent limits: models do read such words, a prompt can carry many rules, and a cap on count is a separate tactic.'),
    _mc('q1206', _PR,
        'A review assistant keeps reporting that a function "mutates its argument" because of the function\'s name, and developers spend time disproving the claim each time. Which prompt addition most directly reduces these false positives?',
        ['Require each behavior claim to quote the line of code that demonstrates it, and skip claims resting only on names',
         'Add a line to the reviewer instructions telling the model to be skeptical of function names when it judges behavior',
         'Ask for a confidence percentage with each claim and show developers only the claims rated above 70 percent',
         'Tell the model that false claims waste developer time and that it should try hard to avoid making them'],
        0,
        'An evidence requirement is an explicit, checkable criterion: the claim either points at code that shows it or it is not reported. Skepticism, confidence percentages and reminders about wasted time all leave the model to decide for itself what is convincing.'),
    _ms('msq1201', _PR,
        'Which two revisions turn a vague review instruction into explicit criteria? (Choose two.)',
        ['Flag a retry loop only when it has no upper bound on the number of attempts',
         'Be conservative and avoid raising false alarms',
         'Skip comments about naming and formatting when they match the conventions already used in the same file',
         'Only report issues that you are very confident about',
         'Think carefully about whether each issue is important enough to mention'],
        [0, 2],
        'Each correct revision is a condition the model can decide yes or no on: a retry loop either has an upper bound or it does not, and a naming comment either matches local convention or it does not. The other three describe an attitude (conservative, confident, careful) without saying which issues belong in the review.'),
    _tf('tf1201', _PR,
        'Adding "only report findings you are highly confident about" to a review prompt cuts false positives about as well as defining which categories of issue to report and which to skip.',
        False,
        'A confidence instruction supplies no criterion, so the model keeps flagging the same borderline patterns. Explicit categories of what to report and what to skip change what gets flagged.'),
    _tf('tf1202', _PR,
        'A review category that produces many false positives can lead developers to distrust the categories that are accurate.',
        True,
        'False positives teach people to dismiss findings by habit, and once that habit forms, correct findings in other categories are dismissed too. That is why a noisy category can be paused while its prompt is improved.'),
    _tf('tf1203', _PR,
        'Pairing each severity level with a concrete code example helps the model give the same label to similar issues.',
        True,
        'Definitions alone leave the boundaries between levels open to interpretation. A representative example for each level anchors them, so similar defects receive similar labels from run to run.'),
])

# ---------------------------------------------------------------------------
# QUESTIONS - 4.2 Few-shot prompting for consistency and quality
# ---------------------------------------------------------------------------
QUESTIONS.extend([
    _mc('q1207', _PR,
        'Your review assistant\'s findings arrive in many shapes: some name a file and line, some only a function, some give a severity word and some do not. The prompt already describes the required format in three paragraphs of prose. What is the most effective next step?',
        ['Repeat the format rules in capital letters at the end of the prompt, label them as mandatory and add a warning about deviations',
         'Add two or three complete example findings that show the exact shape: location, issue, severity and suggested fix',
         'Lower the temperature so that the model repeats the same structure on every single run of the review',
         'Parse each finding with regular expressions and discard any finding that lacks a file name and line number'],
        1,
        'Examples show the format instead of describing it, which is the strongest fix when detailed written instructions still produce inconsistent output. Emphasis adds no information, temperature changes randomness rather than the model\'s understanding of the format, and discarding findings throws away useful output instead of making it consistent.'),
    _mc('q1208', _PR,
        'Your reviewer flags every broad exception handler as a defect, yet the team deliberately uses one at the top of each worker loop to log the error and continue. A prompt list of the files where this is allowed keeps missing new workers. What is the best approach?',
        ['Keep extending the list of allowed files in the prompt each time a new worker module is added to the codebase',
         'Remove exception handling from the review scope, since the model cannot tell the acceptable and harmful cases apart',
         'Tell the model to flag broad handlers only when it is certain that the handler is hiding a real bug in the code',
         'Add example pairs, each with a reason: a worker handler that logs and continues versus one that swallows an error'],
        3,
        'Pairs of acceptable and genuinely problematic code teach the principle behind the distinction, so the model can judge new workers it has never seen. An allow-list covers only what it names, dropping the category loses real bugs, and a certainty instruction supplies no criterion.'),
    _mc('q1209', _PR,
        'A pipeline extracts the list of cited sources from research papers. Papers with inline (author, year) citations work well, but for papers that put numbered references in a bibliography at the end, the model often returns an empty list. What should you try first?',
        ['Add a few examples of correct extraction from both layouts, one of them a paper that has only a bibliography',
         'Mark the cited_sources field as required, so that the model must always produce at least one entry for each paper',
         'Retry every empty result up to five times with the unchanged prompt and keep the first list that is not empty',
         'Split each paper into 500-word fragments, so that the bibliography is easier for the model to locate'],
        0,
        'The sources are present, but the model has not learned to recognize where they live in the second layout; examples of that layout teach it. A required field would push the model to invent entries for papers that really have none, unchanged retries reproduce the same miss, and fragmenting a paper can separate the reference list from the citations that point to it.'),
    _mc('q1210', _PR,
        'A recipe-digitizing system extracts ingredient quantities. Source text says things like "a good glug of oil" and "about a handful of basil", and the model keeps returning precise numbers such as 15 ml and 10 g. Which change best reduces this invented precision?',
        ['Tell the model in capital letters never to make up measurements, and repeat the warning at the end of the prompt',
         'Make the numeric quantity fields required, so that every ingredient is guaranteed to have a value',
         'Add examples in which informal quantities are kept as written and the numeric fields are left null',
         'Instruct the model to round every quantity to the nearest 5 ml or 5 g so that the values look consistent'],
        2,
        'Examples demonstrate how to record an informal measurement faithfully instead of converting it into false precision, which is how few-shot examples reduce hallucination in extraction. A bare prohibition is easy to overlook, a required numeric field forces a number to exist, and rounding still invents a value the recipe never gave.'),
    _mc('q1211', _PR,
        'You are writing few-shot examples for a classifier that labels support emails as billing, technical or account. Several emails are borderline, for instance a failed password reset caused by an expired card. Which set of examples is best?',
        ['Thirty clear-cut emails, ten for each label, so that the model sees every label many times',
         'A few examples that include borderline emails, each with a short reason why the chosen label beat the alternative',
         'One example per label picked at random from last month\'s inbox, with no explanation attached to any of them, to avoid bias',
         'Examples for the two most frequent labels only, since the third label is rare and will be picked up anyway'],
        1,
        'Targeted examples of hard cases, with the reasoning for the choice, teach where the boundaries lie and carry over to new borderline emails. Many easy examples add little, unexplained random picks do not show why a label won, and leaving out a label biases the classifier against it.'),
    _mc('q1212', _PR,
        'A CI job asks Claude to point out missing tests. It reliably lists functions that have no tests, but it never notices a function whose error branch is untested because another test already calls the function. What is the best way to close this gap?',
        ['Require 100% line coverage in the prompt and have the job fail whenever the reported coverage is lower',
         'Tell the model to be more thorough and to look harder for missing tests in every file it receives',
         'Move the job to the Message Batches API so that the model has more time to examine each file',
         'Add examples of a tested function with an untested branch and show how the gap is described'],
        3,
        'The model is treating "has a test" as the signal. Examples of the borderline case, a function that is tested but has an uncovered branch, show it what to notice and how to report it, and the lesson carries over to other branches. "Be more thorough" adds no information, a prompt cannot enforce a coverage number, and the Batches API changes cost and latency, not what the model looks for.'),
    _ms('msq1202', _PR,
        'Which two problems are most directly addressed by adding well-chosen few-shot examples? (Choose two.)',
        ['Findings arrive in inconsistent formats even though the prompt describes the format in detail',
         'A date field comes back empty for invoices that print the date in a footer layout the prompt never mentions',
         'A required clause is not present anywhere in the contract text that was supplied',
         'Some documents are too long to fit in the model\'s context window',
         'A nightly job takes up to a day to finish and nobody is waiting on it'],
        [0, 1],
        'Examples show the model what the output should look like and where to find a value in a layout it did not recognize. They cannot supply information that the source lacks, shrink a document, or change how long asynchronous processing takes.'),
    _ms('msq1203', _PR,
        'Which two practices make a set of few-shot examples more effective? (Choose two.)',
        ['Choose examples that mirror real inputs, including awkward layouts and borderline cases',
         'Make every example share one layout, so that the pattern is unmistakable',
         'Wrap each example, and the whole set, in clearly named tags so that the model can tell examples from instructions',
         'Include as many examples as will fit, since quantity matters more than variety',
         'Omit the reasons from ambiguous-case examples so the model works them out for itself'],
        [0, 2],
        'Relevant, varied examples in clear tags are what the prompting guidance recommends. Identical layouts teach the model to expect that layout, volume does not replace variety, and for borderline cases the stated reason is the part that transfers to new situations.'),
    _tf('tf1204', _PR,
        'Well-chosen few-shot examples can lead the model to apply a demonstrated judgment to patterns that do not appear in the examples, rather than only matching the cases shown.',
        True,
        'Examples convey the principle behind a decision, so the model extends it to new cases. That is why a few examples can outperform an exhaustive rule list, which only covers the cases it names.'),
    _tf('tf1205', _PR,
        'Few-shot examples are useful only for fixing output format; they cannot improve how the model handles ambiguous cases.',
        False,
        'Examples that show the chosen action and the reason it beat a plausible alternative are among the most effective ways to teach ambiguous-case handling. Format demonstration is only one of their jobs.'),
    _tf('tf1206', _PR,
        'Adding examples of an unusual document layout can reduce empty extractions that happen because the model did not recognize where a field appears in that layout.',
        True,
        'When the information is present but placed differently, examples of that layout show the model where to look. They cannot help when the information is genuinely absent from the document.'),
])

# ---------------------------------------------------------------------------
# QUESTIONS - 4.3 Structured output with tool use and JSON schemas
# ---------------------------------------------------------------------------
QUESTIONS.extend([
    _mc('q1213', _PR,
        'A pipeline asks the model to "return only JSON" in plain text and parses the reply with a JSON parser. About one response in 200 fails to parse because of a stray comment or a missing bracket. Which change most reliably removes these syntax failures?',
        ['Define the extraction as a tool whose input schema is the target JSON Schema, mark it strict, and read the tool input',
         'Add "your reply must be valid JSON and nothing else" to both the start and the end of the prompt',
         'Wrap the parser in error handling that asks the model to answer again whenever a reply fails to parse',
         'Set the temperature to 0 so that the model stops producing unusual, unexpected or badly formed output'],
        0,
        'A strict tool schema constrains generation so that the tool input always conforms to the schema, which eliminates syntax errors rather than detecting them afterwards (the JSON outputs option does the same for the reply itself). Repeating the instruction and lowering the temperature reduce the failure rate without guaranteeing zero, and re-asking only recovers after a failure has already happened.'),
    _mc('q1214', _PR,
        'An invoice schema marks po_number as required. About a third of suppliers do not use purchase-order numbers, and the results for their invoices contain realistic but invented numbers. What is the best fix?',
        ['Keep the field required and add "never invent a purchase-order number" to the system prompt',
         'Keep the field required and have a validator retry until the number exists in the purchasing database',
         'Make po_number optional or nullable, and tell the model to return null when an invoice shows none',
         'Add few-shot examples that all show invoices with a purchase-order number, so that the format is learned'],
        2,
        'A required field pushes the model to produce something, so the schema has to allow honest absence. A prompt prohibition works against that pressure, retrying cannot make a missing number appear, and examples that all contain a number reinforce the expectation that one is always there.'),
    _mc('q1215', _PR,
        'A contract-intake schema has a document_type enum with nda, msa, sow and amendment. Each week a few documents of other kinds, such as data-processing addenda, arrive and are quietly labeled with the nearest value, which distorts reports. Which schema change is best?',
        ['Replace the enum with a free-text string, so that the model can return any label it likes',
         'Add an "other" value and a companion text field in which the model describes the actual type',
         'Make document_type optional, so that the model can leave it out for unfamiliar documents',
         'Add a new enum value each time an unfamiliar type turns up, and re-run the affected documents'],
        1,
        'An other-plus-detail pattern keeps the field constrained for known types while capturing new ones with a description, so nothing is mislabeled silently and frequent types can be promoted to real enum values later. Free text loses consistency, omission throws away the fact that the document exists and what it is, and chasing new values leaves every not-yet-seen type mislabeled until someone notices.'),
    _mc('q1216', _PR,
        'A ticket-extraction schema has a category enum with billing, technical, account and other. Many tickets say only things like "it\'s not working", and the model picks a category with confidence anyway. The wrong picks route tickets to the wrong team. What is the most appropriate schema change?',
        ['Add a required confidence field and route automatically only the tickets with a value above 0.9',
         'Remove "other" from the enum, so that the model is forced to pick the closest category',
         'Add a longer description of each category to the prompt, so that vague tickets clearly match one',
         'Add an "unclear" value for tickets that cannot be classified, and send those tickets to a person'],
        3,
        'An explicit unclear option lets the model say that the source is ambiguous instead of guessing, and downstream code can route those tickets for review. Self-reported confidence is a weak proxy, removing options forces even more guesses, and longer category descriptions do not make a vague ticket specific.'),
    _mc('q1217', _PR,
        'A strict-schema invoice extraction always returns valid JSON with correct types. Even so, the finance team finds invoices whose line items add up to 1,204.00 while the extracted total is 1,240.00, and some whose ship-to address landed in the bill-to field. What explains this, and what is the right response?',
        ['Strict schemas guarantee structure, not correct values; add validation code with cross-checks and retry on failure',
         'The tool is not really strict, and switching strict mode on for the extraction tool will stop these mismatches',
         'The numeric types are too loose; change the total to a string with a regular-expression pattern so that it is checked',
         'The response budget is too small for the model to finish its arithmetic, so raising max_tokens will stop the mismatches'],
        0,
        'Constrained output guarantees valid structure and types; it cannot check that values are true or placed in the right field. Arithmetic and placement errors need validation code, with failures fed back for correction. The output here is already valid and typed, a pattern on a string does not check a sum, and a larger token budget does not change which values the model chooses.'),
    _mc('q1218', _PR,
        'A strict-schema extraction call returns HTTP 200 with JSON that is cut off: the last optional fields are missing and the final string ends mid-word. The schema is valid and the request was accepted. What is the most likely cause and the right response?',
        ['The model refused the request; rephrase the system prompt and send the request again',
         'The grammar failed to compile; remove strict from the tool and parse the reply leniently',
         'The output hit the max_tokens limit; check the stop reason and retry with a higher limit',
         'Optional fields are dropped once a schema contains several of them; make every field required'],
        2,
        'A cut-off result with a normal 200 status points to the output-token limit: the stop reason is max_tokens, and constrained output may then be incomplete. Check the stop reason before trusting parsed output and retry with a larger limit. A refusal has its own stop reason and is not a half-written object, a schema that cannot be compiled is rejected with an error before any output, and optional fields are not silently dropped for being optional.'),
    _mc('q1219', _PR,
        'An extraction schema types amount as a number and currency as an enum. Source invoices write amounts as "1.234,50 EUR", "$1,234.50" and "USD 1234.5". The output is valid but sometimes wrong: "1.234,50" occasionally becomes 1.234. What helps most?',
        ['Raise max_tokens so that the model has more room to work out what the separators in each amount mean',
         'Keep the strict schema and add normalization rules to the prompt for separators and currency symbols',
         'Drop the schema for this field and let the model write each amount in whatever format it finds most natural',
         'Make amount optional, so that ambiguous values come back as null instead of coming back as wrong numbers'],
        1,
        'The schema fixes the shape of the answer, not how messy source values are interpreted. Explicit normalization rules, ideally with an example or two, handle the interpretation. More tokens do not help, removing the schema gives up the structure, and nulls would hide values that are in fact present.'),
    _mc('q1220', _PR,
        'An extraction service runs on Claude Sonnet 5.5 and sets tool_choice to {"type": "any"}, so that the model must call one of its extraction tools. Every request now fails with a 400 error. Which approach keeps a structured-output guarantee?',
        ['Prefill the assistant turn with an opening brace so that the reply must start as JSON, then close it in code',
         'Turn on manual extended thinking for the requests, which allows forced tool calls on this model',
         'Remove the schemas and ask for a JSON reply in the prompt, with a retry whenever the reply fails to parse',
         'Leave tool choice on auto, mark the tools strict, and treat a response with no tool call as a failure to retry'],
        3,
        'The current documentation says the newest models, including Sonnet 5.5, reject the "any" and named-tool settings with a 400 error, and so does manual extended thinking. Automatic choice with strict tool use still guarantees that any call matches the schema, and the application checks that a call was actually made (or uses the JSON outputs option when the reply itself is the data). Prefilled replies are not supported on these models either, and prompt-only JSON gives up the guarantee.'),
    _ms('msq1204', _PR,
        'Which two problems can still occur when an extraction tool enforces its schema with strict mode? (Choose two.)',
        ['Line items that do not add up to the total printed on the document',
         'A tool input that is missing its closing brace',
         'A string where the schema requires an integer',
         'A value placed in the wrong field, such as a ship-to address in the bill-to field',
         'A required field that is absent from the tool input'],
        [0, 3],
        'Strict mode constrains syntax, types and required fields, so malformed JSON, wrong types and missing required fields are removed. It cannot verify that values are true or sensibly placed, so arithmetic mismatches and misplaced values remain, which is why validation code is still needed.'),
    _ms('msq1205', _PR,
        'Which two schema choices reduce the risk of fabricated values? (Choose two.)',
        ['Make a field optional or nullable when some source documents will not contain it',
         'Mark every field required so that each output is always complete',
         'Add an "unclear" value to categorical fields where the source can be ambiguous',
         'Fill every gap with a default value defined in the prompt, such as "N/A" or 0',
         'Replace enums with free text so that the model is never pushed into a category'],
        [0, 2],
        'Nullable fields and an explicit unclear option give the model an honest way to report that information is missing or ambiguous. Required fields do the opposite, default fill values look like real data downstream, and free text gives up the consistency of an enum without addressing why the model guessed.'),
    _tf('tf1207', _PR,
        'Strict tool use guarantees that tool inputs match the schema, but it does not guarantee that the extracted values are correct.',
        True,
        'Constrained decoding enforces structure and types. Whether a total is right or a value sits in the correct field is a semantic question that needs validation in code.'),
    _tf('tf1208', _PR,
        'When an extraction schema marks a field as required, the model may supply an invented value if the source document does not contain one.',
        True,
        'A required field must be filled in, so a plausible guess is the only way to comply when the data is absent. Fields that may be missing should be optional or nullable.'),
    _tf('tf1209', _PR,
        'The JSON outputs option constrains the model\'s reply itself to a JSON Schema, while strict tool use constrains the inputs of tool calls.',
        True,
        'Both rely on constrained decoding. JSON outputs are set with the output_config format option and shape the response text; strict: true on a tool definition shapes tool inputs. They can be used separately or together.'),
])

# ---------------------------------------------------------------------------
# QUESTIONS - 4.4 Validation, retry and feedback loops for extraction quality
# ---------------------------------------------------------------------------
QUESTIONS.extend([
    _mc('q1221', _PR,
        'An extraction fails your validator: the line items add up to 412.50 but the extracted total is 421.50. Which follow-up request has the best chance of producing a corrected result?',
        ['Resend the original request unchanged, since model output varies from one attempt to the next',
         'Send only the validator message, so that the model is not distracted by the long source document and the request stays short',
         'Send the document, the failed extraction and the validator message naming the mismatch, and ask for a correction',
         'Send the failed extraction and ask the model to adjust it until the numbers are consistent again'],
        2,
        'A correction needs three things: the source to re-read, the attempt that failed and the exact error. Without the document the model can only adjust numbers until they agree, which risks fudging values; an unchanged request repeats the odds of the original mistake; and an error with no document or attempt gives the model nothing to correct.'),
    _mc('q1222', _PR,
        'Your validator rejects 3% of contract extractions because governing_law is null. Each affected contract says the governing law is "as set out in Schedule 4", and Schedule 4 was never uploaded. Retrying with the error feedback fails every time. What should the pipeline do?',
        ['Stop retrying after a small cap, mark the field unavailable, and route the contract to someone who can get the schedule',
         'Raise the retry limit to ten and vary the temperature on each attempt, so that one of them eventually succeeds',
         'Tell the model to infer the governing law from the parties\' addresses whenever the referenced schedule is missing',
         'Make governing_law a required field in the schema so that the model treats the retry error message as more urgent'],
        0,
        'The needed information is not in the supplied text, so no retry can find it; retries repair format and structure errors. Capping attempts and routing the case to a person who can obtain the schedule is the only productive path. More retries waste cost, inference from addresses invents a legal fact, and a required field only adds pressure to fabricate.'),
    _mc('q1223', _PR,
        'A validation-retry loop appends the validator error to each retry. Which failure is it most likely to repair?',
        ['A warranty period that is stated only in a separate product brochure the pipeline never fetched',
         'An expiry date that is missing because the page holding it was not scanned',
         'A customer name that is empty because the person left that line blank on the form',
         'A date returned as "03/04/26" in a field where the validator requires the ISO 8601 form (year-month-day)'],
        3,
        'A format mismatch is a mistake the model can fix once it is told what the validator expects, because the information is in the source. The other three failures share one cause, absent information: the data is in a document the pipeline never supplied, on a page nobody scanned, or nowhere at all. No wording of a retry can produce it.'),
    _mc('q1224', _PR,
        'Developers dismiss about a third of the findings your review assistant posts, but you cannot tell which kinds of code lead to the dismissed findings. What is the most useful change to the findings schema?',
        ['Add a confidence field to every finding and review only the findings that carry the lowest confidence values',
         'Add a detected_pattern field naming the code construct that triggered each finding, and group dismissals by it',
         'Add a long free-text reasoning field to every finding and read a sample of those explanations each week',
         'Record how many findings each developer dismisses and discuss the highest counts with those developers'],
        1,
        'A structured field naming what triggered each finding turns dismissals into data: grouped by pattern, they show which criteria produce false positives, so those criteria can be fixed. Confidence says nothing about which constructs cause trouble, free-text reasoning is hard to aggregate, and per-developer counts measure people rather than patterns.'),
    _mc('q1225', _PR,
        'Some supplier invoices print a total that does not match their own line items, and you want the pipeline to surface these rather than hide them. Which output design works best?',
        ['Extract only the sum of the line items, since the model\'s arithmetic is more dependable than a number printed by a supplier',
         'Extract only the printed total and trust the supplier\'s arithmetic, flagging nothing for review',
         'Extract the printed total as stated_total and the sum of the line items as calculated_total, then flag any mismatch',
         'Ask the model to correct the printed total whenever it disagrees with the line items on the invoice'],
        2,
        'Capturing both numbers keeps the discrepancy visible, and a simple comparison in code flags it for review. Using only one of them silently decides which is right, and having the model rewrite the printed total alters a fact in the source.'),
    _mc('q1226', _PR,
        'A lease states its start date as 1 March on the cover page and as 1 April in the terms section. Your extractor currently keeps whichever date it meets first, so conflicts pass silently. Which schema change handles inconsistent source data best?',
        ['Add a conflict_detected boolean and capture both values, so that downstream code can route the record for review',
         'Tell the model to prefer the date in the terms section whenever the two dates in a document disagree, since that section is the binding one',
         'Make start_date optional, so that a record with conflicting dates produces null instead of a date',
         'Run the extraction twice on each document and keep whichever date appears in both of the runs'],
        0,
        'A conflict flag with both values makes the contradiction visible and lets a person or a rule decide. A fixed preference silently resolves it, nulls discard information that is in the document, and two runs of the same extractor tend to repeat the same choice, so agreement between runs proves little.'),
    _mc('q1227', _PR,
        'Your validation-retry loop re-asks until validation passes. A few unusual documents keep it running for dozens of attempts, costing many times the average. What is the best fix?',
        ['Accept the second extraction for any document that fails twice and mark it as validated, so that the queue clears and the costs stop growing',
         'Cap the number of attempts and send documents that still fail to human review together with their validation errors',
         'Double max_tokens on each retry so that the model has more room to get the answer right this time',
         'Add a timeout and quietly drop any document that exceeds it, so that one bad file cannot block the rest'],
        1,
        'A bounded loop controls cost, and routing the leftovers to a person with the error details means no document is lost or falsely accepted. Marking a failing extraction as validated defeats the purpose of validating, more tokens do not repair a validation error, and silently dropping documents loses data.'),
    _ms('msq1206', _PR,
        'Which two situations is a retry with the validation error appended most likely to fix? (Choose two.)',
        ['A currency returned as "US$" where the validator accepts only USD, EUR or GBP',
         'A tax identifier that appears only on a certificate that was never supplied',
         'A ship-to address written into the bill-to field, caught by a cross-check against the document',
         'A signature date that is missing because the signature page was not included in the file',
         'A customer name that is blank because the form field was left empty'],
        [0, 2],
        'Both are mistakes in how information that is in the document was written out, and the error message tells the model what to correct. The other three describe information that is not in the supplied source, which no retry can supply.'),
    _ms('msq1207', _PR,
        'Which two additions to an extraction schema make inconsistencies in the source documents visible to downstream code? (Choose two.)',
        ['A calculated total stored next to the stated total',
         'A free-text field summarizing the model\'s overall impression of the document',
         'A boolean that marks records whose source contains contradicting values',
         'A counter recording how many attempts the extraction needed',
         'A generated document title for display in the review queue'],
        [0, 2],
        'Comparing a calculated total with the stated one exposes arithmetic discrepancies, and a conflict flag exposes contradictions. An impression, a retry counter and a title describe the extraction process or its presentation, not whether the source is consistent.'),
    _tf('tf1210', _PR,
        'Retrying an extraction with the validation error appended can be expected to recover a value that is not anywhere in the supplied document.',
        False,
        'Retries repair format and structure errors. If the information is absent, for example because it lives in an attachment that was never provided, the model cannot find it, and the better response is to route the case for follow-up.'),
    _tf('tf1211', _PR,
        'Cross-field business rules, such as an end date that must come after the start date, are checked by validation code rather than guaranteed by the output schema.',
        True,
        'Schemas constrain structure and types but do not express relationships between fields like these. A validator, for example a Pydantic model, checks the rule, and a failure can drive a retry that includes the specific error.'),
])

# ---------------------------------------------------------------------------
# QUESTIONS - 4.5 Efficient batch processing strategies
# ---------------------------------------------------------------------------
QUESTIONS.extend([
    _mc('q1228', _PR,
        'An agent reviews insurance claims by calling a client-side lookup_policy tool, reading the result and deciding what to do next, sometimes over several rounds. The team wants the batch discount for 50,000 overnight claims. What is the main obstacle?',
        ['The Batches API rejects every request that includes tool definitions, whether the tools run on the client or on the server',
         'A batch can hold only one request per claim type, so 50,000 claims would need thousands of batches',
         'Batch requests cannot include a system prompt, so the claim-review instructions would be lost entirely',
         'A batch request is one asynchronous call, so there is no way to return a client-side tool result mid-request'],
        3,
        'In a batch, each request is answered in one asynchronous pass, so a loop that runs a client-side tool and sends the result back cannot happen inside it (the exam guide states this as no multi-turn tool calling within a single batch request). Keep such agents on the synchronous API, or redesign the work so that the single pass needs no mid-request tool result. Batches do accept tool definitions and system prompts, and one batch can hold very many requests.'),
    _mc('q1229', _PR,
        'A batch of 20,000 invoice extractions has ended, and 340 requests came back errored or expired. What is the most efficient recovery?',
        ['Use custom_id to identify the failed requests, fix their causes, and submit only those in a new batch',
         'Resubmit all 20,000 requests so that the whole set of results comes from one consistent run',
         'Match the failures to their inputs by position in the results file, then resend those inputs',
         'Rerun the 340 failures one at a time on the synchronous API, accepting the standard price for them'],
        0,
        'Results carry the custom_id you assigned, so failed and expired requests can be isolated exactly and resubmitted, with fixes applied where the cause is known. Resubmitting everything repeats work that already succeeded, results are not guaranteed to come back in submission order so position is unreliable, and synchronous reruns give up the discount for work that is not urgent.'),
    _mc('q1230', _PR,
        'Among the failed requests, 60 invoices errored because they exceed the model\'s context limit. How should they be resubmitted?',
        ['Unchanged, but with a higher max_tokens value so that the longer input is able to fit in the request',
         'Truncated to their first ten pages, which usually hold the header and the totals of an invoice',
         'Split into chunks, each with a custom_id that encodes the source document, and merge the chunk results afterwards',
         'Unchanged, but in a batch of their own so that they cannot be affected by any of the other requests that were submitted with them'],
        2,
        'Oversized input is a cause you can fix by changing the input: split the document into chunks and put the document and part into each custom_id so that the results can be reassembled. max_tokens limits output, not input; truncation can drop line items; and isolating the requests does not change their size.'),
    _mc('q1231', _PR,
        'Invoices arrive continuously. A batch can take up to 24 hours to finish, and the business needs every invoice extracted within 33 hours of arrival. What is the least frequent submission schedule that still guarantees this in the worst case?',
        ['Submit a batch every 9 hours',
         'Submit a batch every 12 hours',
         'Submit a batch every 24 hours',
         'Submit a batch every 33 hours'],
        0,
        'In the worst case an invoice arrives just after a submission, waits for the next one and then spends up to 24 hours in processing. So the interval plus 24 hours must not exceed 33 hours, which gives 9 hours. Every 12 hours allows 36 hours in the worst case, every 24 hours allows 48, and every 33 hours allows 57.'),
    _mc('q1232', _PR,
        'You are about to submit 60,000 product-sheet extractions as one batch. The prompt and schema have been tried on only three hand-picked sheets. What should you do first?',
        ['Submit the whole batch now and resubmit whatever fails, since resubmission is cheap at the discounted price',
         'Split the job into 600 batches of 100 sheets, so that a problem in the prompt can be spotted early',
         'Switch the whole job to synchronous calls, so that every failure shows up immediately and can be fixed',
         'Run a representative sample through the same request shape, fix prompt and schema problems, then submit the batch'],
        3,
        'A sample run catches systematic problems, such as a misread layout or a schema that pushes the model to invent values, before they are repeated 60,000 times, which raises first-pass success and avoids paying for rework. Submitting blindly means outputs that are wrong but "succeeded" never show up as failures, many small batches each still take up to a day to finish, and synchronous calls give up the discount.'),
    _mc('q1233', _PR,
        'After a batch is submitted, how should the application find out that its results are ready?',
        ['Poll the batch\'s processing status until it reports that processing has ended, then retrieve the results',
         'Wait exactly 24 hours, because results are only released when the processing window closes',
         'Read the results straight away and use the entries that have arrived so far, in the order they were submitted',
         'Hold a streaming connection open and read each result as soon as it completes'],
        0,
        'A batch moves from in progress to ended, and results are retrieved once it has ended, so polling the status is how the application finds out. Most batches finish well inside 24 hours, so a fixed wait wastes time; results do not come back in a guaranteed order; and streaming is not supported for batch requests.'),
    _mc('q1234', _PR,
        'You will resubmit chunks of oversized documents and later reassemble each document\'s results. Which custom_id scheme best supports that?',
        ['The position of the request in the submitted list, because results come back in that order',
         'The same batch name on every request, since all of the requests belong to one job',
         'A unique, stable ID built from the document and the chunk, such as inv-4417-c3',
         'The timestamp taken when each request was added to the batch, so that every value is different'],
        2,
        'Each custom_id must be unique within the batch, and one that encodes the document and part lets you pair results with inputs and resubmit specific items without a lookup table. Position is unreliable because results can come back in any order, a shared name cannot tell requests apart, and a timestamp changes whenever a request is rebuilt.'),
    _ms('msq1208', _PR,
        'Which two workloads are best suited to the Message Batches API? (Choose two.)',
        ['Regenerating unit tests overnight for every module merged that day',
         'A pre-merge check that blocks a developer until it passes',
         'Scoring 30,000 archived contracts against a policy checklist in a weekly audit',
         'A chat assistant that answers a customer who is waiting for a reply',
         'An agent loop that calls a client-side tool after every model turn'],
        [0, 2],
        'Nobody waits on nightly test generation or a weekly audit, so the cost saving is worth the processing window. A pre-merge check and a live chat reply are blocking workflows that need predictable latency, and an agent loop that must return client-side tool results mid-request cannot run inside a single batch request.'),
    _tf('tf1212', _PR,
        'Results in a finished batch come back in the same order as the requests were submitted, so a result\'s position identifies its request.',
        False,
        'Results can arrive in any order, which is why every request carries a custom_id that you use to match each result to its input.'),
    _tf('tf1213', _PR,
        'Because the Message Batches API offers no guaranteed completion time, it is a poor fit for a check that blocks developers from merging.',
        True,
        'Most batches finish within an hour, but up to 24 hours is allowed and nothing is guaranteed, so a blocked developer could wait a day for a check that takes seconds on the synchronous API. The 50% saving does not justify an unbounded wait.'),
    _tf('tf1214', _PR,
        'Tuning the prompt on a small representative sample before submitting a large batch helps avoid costly resubmissions.',
        True,
        'Fixing systematic problems on a sample raises the share of requests that succeed on the first pass. Request parameters in a batch are also validated asynchronously, so checking the request shape on the synchronous API first avoids discovering mistakes only after the batch has ended.'),
])

# ---------------------------------------------------------------------------
# QUESTIONS - 4.6 Multi-instance and multi-pass review architectures
# ---------------------------------------------------------------------------
QUESTIONS.extend([
    _mc('q1235', _PR,
        'A code-generation agent writes a database migration and, in the same session, is asked to review it. It approves its own work, but a teammate later finds a subtle ordering bug. Which change would most improve the automated review?',
        ['Ask the same session to review the migration again, this time with a harsher and more skeptical tone',
         'Run the review in a separate Claude instance that receives only the migration and the review criteria',
         'Give the same session a larger thinking budget for the review step so that it examines the migration longer',
         'Ask the same session to restate its reasoning for the migration before it starts the review'],
        1,
        'The authoring session still holds the reasoning that produced the migration, so it tends to defend it. A fresh instance without that context questions decisions the author would not. A harsher tone, more thinking time and restating the reasoning all keep the same biased context in play.'),
    _mc('q1236', _PR,
        'You are setting up a separate reviewer instance for AI-written changes. Which input gives it the best chance of finding subtle problems?',
        ['The diff plus the full transcript of the authoring session, so that the reviewer understands the intent',
         'The diff plus the author\'s own summary of why the change is correct and which tests it passes',
         'The diff plus the author\'s list of risky areas, so that the reviewer does not repeat them',
         'The diff and the review criteria, with nothing from the authoring session\'s reasoning'],
        3,
        'Anything derived from the author\'s reasoning primes the reviewer with the same assumptions and weakens the independence that makes a second instance valuable. Intent can be conveyed through the criteria and a plain description of the change; a transcript, a self-justification and a self-assessed risk list all carry the author\'s blind spots.'),
    _mc('q1237', _PR,
        'A pull request changes 18 files in a billing service. One review pass over the whole diff gives thorough comments on the first few files and little on the rest, and it misses that a refund helper now returns cents while its callers still expect dollars. Which restructured review is best?',
        ['Review each file in its own pass for local problems, then run a separate pass on how data flows between the files',
         'Run the same single pass with a model that has a larger context window, so that all 18 files fit comfortably',
         'Review each file in its own pass and merge the findings, since local passes already cover cross-file issues',
         'Run only an integration pass, since cross-file problems are the most serious and local issues will surface in it anyway'],
        0,
        'Per-file passes give every file the same depth, and a dedicated integration pass looks at how files connect, which is where a cents-versus-dollars mismatch lives. A bigger window does not fix uneven attention, local passes alone cannot see the callers in other files, and an integration-only pass dilutes attention across the whole diff again.'),
    _mc('q1238', _PR,
        'A single-pass review of a 25-file change fits within the model\'s context window but gives uneven depth across the files. A colleague proposes moving to a model with a much larger window. Why is that unlikely to solve the problem?',
        ['Larger windows are available only through the Batches API, which would make the review asynchronous and slower to deliver',
         'The window size limits how much output the model can write, not how much input it can read',
         'Fitting everything in the window does not guarantee even attention across it, whereas focused passes do',
         'Models with larger windows are trained on longer documents and review short inputs less accurately'],
        2,
        'The problem is attention dilution, not capacity: with many files in one pass, depth varies and verdicts can contradict each other. Narrower passes address that directly. The other statements are false: larger windows are not limited to batch processing, the window covers the input as well as the output, and larger windows do not make models worse on short inputs.'),
    _mc('q1239', _PR,
        'A verification pass asks the model to attach a confidence from 0 to 1 to each review finding. A manager wants findings above 0.9 posted automatically and the rest sent to a human queue starting tomorrow. What should you do before relying on those thresholds?',
        ['Nothing, because model-reported confidence is calibrated by design, so 0.9 means nine in ten are correct',
         'Compare the confidence values with known outcomes on a labeled sample and set cutoffs from the measured accuracy',
         'Ask the model to give a second confidence value for each finding and average the two values together',
         'Raise the automatic posting threshold to 0.99, since a higher cutoff is always the safer choice for a bot that comments on other people\'s code'],
        1,
        'Self-reported confidence is a useful routing signal, but what a value means has to be measured: on labeled findings, check how often each band is actually right and set the cutoffs from that. A second self-report has the same weakness, calibration is not guaranteed by design, and an extreme threshold sends almost everything to humans without evidence that quality improves.'),
    _ms('msq1209', _PR,
        'Which two approaches give a review that is independent of the author\'s reasoning? (Choose two.)',
        ['A fresh Claude instance that sees only the code and the review criteria',
         'The authoring session, asked to review the same change as if it were a different engineer',
         'A verification subagent started with clean context to try to refute each reported finding',
         'The authoring session with extended thinking enabled for the review step',
         'The authoring session, asked to list its own assumptions and then check them'],
        [0, 2],
        'Independence comes from a context that does not contain the author\'s reasoning: a fresh instance, or a verifier that starts clean and tries to disprove a finding. Role-play, extra thinking and self-audits all happen inside the context that produced the work.'),
    _ms('msq1210', _PR,
        'Which two are benefits of splitting a large review into per-file passes plus an integration pass? (Choose two.)',
        ['Each file receives a similar depth of attention instead of tailing off across the diff',
         'Total token use falls, because no file is read more than once',
         'Cross-file data-flow problems get a dedicated pass that looks at how the files connect',
         'The review no longer needs any filtering for false positives',
         'Human reviewers are no longer needed for risky changes'],
        [0, 2],
        'Focused passes counter attention dilution, and the integration pass supplies the cross-file view that local passes lack. The approach reads some material more than once, so it does not save tokens, and it removes neither false positives nor the need for people.'),
    _tf('tf1215', _PR,
        'A model asked to review its own output in the same session keeps the reasoning that produced it, which makes it less likely to question its own decisions.',
        True,
        'The earlier reasoning stays in context and supports the original choices. An independent instance without that context is a stronger check.'),
    _tf('tf1216', _PR,
        'Enabling extended thinking for the review step is as effective at catching subtle issues as sending the code to a separate reviewer instance.',
        False,
        'Extra reasoning time happens inside the same context that produced the code, so the bias toward its own decisions remains. A separate instance without that context is more effective.'),
])

# ---------------------------------------------------------------------------
# LESSONS - Domain 4 (prompts): two lessons covering task statements 4.1-4.3 and 4.4-4.6
# ---------------------------------------------------------------------------
LESSONS.extend([
    {
        'id': 'criteria-few-shot-and-schema-output',
        'title': 'Precise Criteria, Few-Shot Examples and Schema-Enforced Output',
        'summary': 'Covers task statements 4.1, 4.2 and 4.3: explicit report-and-skip criteria and severity examples, few-shot examples for format, borderline cases and varied layouts, and structured output through extraction tools, strict schemas, tool_choice and schema design.',
        'diagram': None,
        'vocabIds': ['f1062', 'f1063', 'f1071', 'f1074', 'f1079', 'f1082', 'f1083', 'f1084', 'f1085'],
        'quizIds': ['q1201', 'q1204', 'q1208', 'q1214', 'q1217', 'q1220'],
        'reading': (
            'This lesson covers task statements 4.1 to 4.3. Consider a pull-request review bot. A prompt such as "check that comments are accurate" or "be conservative" leaves the model to invent its own bar, so it keeps flagging harmless code: words like conservative and confident change the tone, not what counts as a problem. Give it a criterion it can answer yes or no to: flag a comment only when the behavior it describes contradicts the code; report bugs and security flaws; skip minor style and patterns that match the surrounding code. Ask for evidence, such as the quoted line.\n\n'
            'Precision is also about trust. If one category is wrong most of the time, developers learn to dismiss the bot, and then they dismiss its accurate security findings too. Switch the noisy category off for now, keep the good ones running, and re-enable it once its criteria hold up. Treat severity the same way: define each level and attach a code example of a typical finding, so one kind of defect always gets one label.\n\n'
            'Task statement 4.2 is few-shot prompting. When written rules still give inconsistent results, worked examples are the strongest remedy, because they show rather than describe. A complete example finding with location, issue, severity and suggested fix settles the format. A borderline case, with the action chosen and why it won, teaches judgment. A pair such as a worker-loop handler that logs and continues beside one that swallows an error teaches acceptable versus genuine, where an allow-list covers only the places it names. Examples of an unusual layout, such as a bibliography-only paper, fix fields that come back empty. Keep examples relevant and varied, and tag them so they are not mistaken for instructions. The guide says two to four; Anthropic\'s docs say three to five. Examples cannot supply information the document lacks.\n\n'
            'Task statement 4.3 is output you can parse without fear. Asking for "JSON only" mostly works, which is the problem. Instead define an extraction tool whose input schema is the JSON Schema you want, and read the data from the tool-use block. With strict: true the input is constrained to match the schema, and the JSON outputs option (output_config.format) does the same for the reply itself. That removes syntax errors and wrong types, not semantic ones such as line items that do not sum to the total. Check the stop reason too: a refusal or a max_tokens cut-off can leave output that does not match.\n\n'
            'tool_choice decides whether a call happens. With auto the model may answer in plain text; any requires a call but lets the model choose the tool, which suits several extraction schemas and an unknown document type; naming a tool forces it. The current docs add a caveat: on Opus 5.5, Sonnet 5.5 and Fable 5.1, and with manual extended thinking, any and a named tool return an error, so use auto with strict tools and treat a reply with no tool call as a failure. Design schemas so absence is honest: optional or nullable fields for data some documents lack (a required field invites an invented value), an unclear value for ambiguous sources, and other plus a detail string for unforeseen categories. Put normalization rules, such as ISO 8601 dates, in the prompt: the schema fixes the shape, not how messy values are read.'
        ),
        'fundamentalsLabel': 'New to prompting and structured output? See the everyday analogy',
        'fundamentals': 'Picture briefing a new proofreader. "Be careful" tells them nothing, while "flag a sentence only when it contradicts the figure in the table above it, and ignore house-style quibbles" lets them start. Two marked-up sample pages teach more than a page of rules, especially for borderline cases. A form with boxes that must all be filled in makes people write something even where they know nothing, while a form with a "not stated" option gets honest answers. And a form printed with fixed boxes guarantees tidy handwriting, not correct numbers.',
        'keyTerms': ['Explicit criteria', 'Trust erosion', 'Severity examples', 'Few-shot examples', 'Strict tool use', 'JSON outputs', 'tool_choice', 'Nullable field', 'Other plus detail'],
        'commonTraps': [
            'Phrases such as "be conservative" or "only report high-confidence findings" sound careful but add no criterion; categorical report-and-skip rules are the fix.',
            'Few-shot examples teach format and judgment, but they cannot supply information the document does not contain.',
            'Strict schemas remove syntax and type errors, not wrong values: totals that do not add up and misplaced fields still need validation.',
            'A required field makes the model produce a value even when the source has none; use optional or nullable fields, an unclear option, and other plus detail.',
            'tool_choice any or a named tool is rejected on the newest models and with manual extended thinking; use auto with strict tools and check that a call came back.',
        ],
        'scenario': 'A fintech team\'s invoice reader returns unparseable JSON about once in every two hundred calls, invents purchase-order numbers for suppliers who do not use them, and labels vague tickets with confident guesses. They replace the "JSON only" prompt with a strict extraction tool, make the purchase-order field nullable, and add an unclear category value. The companion review bot, which developers had stopped reading, gets explicit report-and-skip criteria and a few example pairs of acceptable and genuine code.',
        'onTheJob': 'Keep a small labeled set of real documents and diffs and re-run it after every prompt or schema change; precision and format consistency are measurable, so measure them. When something misbehaves, change one thing at a time: criteria first, examples second, schema last. Take examples from real failures rather than invented ones, and keep each short with its reason attached. Log the stop reason with every structured call, and count nulls and unclear values per field: a field that is never null in production is probably being invented.',
    },
    {
        'id': 'validation-retry-batch-and-review',
        'title': 'Validation, Retries, Batch Processing and Independent Review',
        'summary': 'Covers task statements 4.4, 4.5 and 4.6: retry with error feedback and its limits, self-check fields, matching the Message Batches API to latency-tolerant work, custom_id and deadline scheduling, and independent, multi-pass and confidence-routed review.',
        'diagram': None,
        'vocabIds': ['f1091', 'f1093', 'f1096', 'f1098', 'f1100', 'f1101', 'f1103', 'f1109', 'f1112'],
        'quizIds': ['q1222', 'q1225', 'q1229', 'q1231', 'q1235', 'q1237'],
        'reading': (
            'This lesson covers task statements 4.4 to 4.6: what happens after the first answer. Treat extraction output as a candidate and validate it in code, with a Pydantic model or a JSON Schema validator, for rules a schema cannot express, such as an end date after the start date or line items that sum to the total. When validation fails, retry with error feedback: send the original document, the failed extraction and the specific errors ("line items sum to 412.50, total says 421.50"). A bare "try again" repeats the mistake. Retries repair format and structure errors. They cannot repair absence: if the governing-law clause sits in a schedule nobody supplied, no retry finds it, so cap the attempts and route the case to a person.\n\n'
            'Design the output so problems show themselves. Extract calculated_total beside stated_total and flag any mismatch. Add a conflict_detected boolean for sources that contradict themselves, so the model does not silently choose. Give review findings a detected_pattern field naming the construct that triggered them; when developers dismiss findings, you can group the dismissals and fix the criteria behind the worst patterns.\n\n'
            'Task statement 4.5 is the Message Batches API: half price because requests are processed asynchronously. Most batches end within an hour, but up to 24 hours is allowed and nothing is guaranteed, so batch work nobody waits for (overnight reports, weekly audits, nightly test generation) and never a blocking step such as a pre-merge check. Give every request a custom_id, because results return in any order; poll the batch status until it ends, then match results to inputs by custom_id. One batch request is a single asynchronous call, so a client-side tool loop cannot run inside it; keep those agents on the synchronous API. Deadlines become schedules: a document may wait for the next submission and then take 24 hours, so a 36-hour deadline needs a submission at least every 12 hours. When some requests fail or expire, resubmit only those after fixing the cause, for example by splitting an oversized document into chunks. Tune the prompt on a small representative sample first.\n\n'
            'Task statement 4.6 is review with more than one pass or instance. A model that has just written code still holds the reasoning behind it, so asked to review it in the same session it tends to defend it; a harsher tone or extra thinking time does not remove that. A second Claude instance given only the diff and the criteria catches subtler problems. Large reviews fail differently: with many files in one pass, depth becomes uneven and verdicts contradict one another (attention dilution), and a bigger context window does not cure it. Run a per-file pass for local issues and a separate integration pass for data flow across files. A verification pass can attach a confidence to each finding to route doubtful ones to closer review, but raw confidence is only a hint until you calibrate it against labeled examples.'
        ),
        'fundamentalsLabel': 'New to extraction pipelines and review? See the everyday analogy',
        'fundamentals': 'Think of a bank clearing cheques. A second clerk checks the first clerk\'s entry without seeing the first clerk\'s working, because a person who has just written a number tends to see what they meant. A cheque with a smudged amount goes back with a note saying exactly what is wrong. A cheque with no date on it cannot be fixed by sending it back again, so an officer handles it. The overnight clearing run is cheaper because nobody is waiting, but it is not used for the cheque a customer is watching being cashed at the counter.',
        'keyTerms': ['Retry with error feedback', 'Unresolvable error', 'Calculated versus stated total', 'detected_pattern', 'Message Batches API', 'custom_id', 'Submission frequency', 'Independent review instance', 'Attention dilution'],
        'commonTraps': [
            'A retry only helps when the answer is in the source; absent information, such as a value in an attachment nobody supplied, needs routing, not more attempts.',
            'A bare "try again" is not feedback; the retry needs the document, the failed extraction and the specific errors.',
            'Batch is wrong for blocking work such as pre-merge checks because nothing guarantees completion, and results come back in any order, so custom_id is how you match them.',
            'Worst-case batch latency is the submission interval plus up to 24 hours, and a client-side tool loop cannot run inside one batch request.',
            'Asking the same session to review harder, or think longer, does not make it independent; a fresh instance without the author\'s reasoning does.',
        ],
        'scenario': 'An insurer extracts policy data from 40,000 scanned documents a week. Each result is validated in code; failures are retried once with the document, the failed output and the exact error, and anything still failing goes to an adjuster with the errors attached. The weekly run uses the Batches API with custom_ids such as pol-1182-c2, after a 100-document sample run to settle the prompt. A separate Claude instance reviews every change to the extraction code, first file by file and then across files.',
        'onTheJob': 'Cap retries at two or three and record which validation errors a retry fixed and which never get fixed; the second list shows where the prompt, the source feed or the schema needs work. Put the batch status, the count of each result type and the age of the oldest request on a dashboard, so a stuck job shows up before the deadline. Keep custom_ids stable and meaningful so a resubmission can reuse them. Give the independent reviewer the diff and your written criteria, nothing about how the author reasoned, and check its confidence numbers against labeled findings before using them to route work.',
    },
])

# ---------------------------------------------------------------------------
# CASE STUDY - Scenario 6: structured data extraction (Domain 4 with reliability)
# ---------------------------------------------------------------------------
_CS = 'cs-ccarf-structured-extraction'

CASE_STUDIES.extend([
    {
        'id': _CS,
        'cat': _PR,
        'title': 'Ledgerline Supply: An Invoice Reader Finance Cannot Trust',
        'scenario': 'Ledgerline Supply extracts data from supplier invoices that arrive as PDFs and emails in dozens of layouts. Each invoice\'s text goes to Claude with an extraction tool whose JSON schema marks invoice_number, po_number and total as required; a validator then checks the result before it feeds the accounting system. Three problems have surfaced. First, about a third of suppliers never use purchase-order numbers, yet their results contain convincing numbers that do not exist. Second, roughly 4% of results pass the schema but have line items that do not add up to the total, and finance finds them only at month end. Third, when the validator finds ship_to_country empty, a loop re-sends the request up to five times with the error. It fixes date and currency formats, but for about 2% of invoices the country stays missing, because it appears only on a customs form attached to the shipment and never sent to the pipeline. Separately, management wants to re-extract a 200,000-invoice archive. Nobody needs the results for two weeks, a few hundred documents are known to exceed the context window, and the prompt has been tried on only a dozen invoices.',
        'questions': [
            _cq(_CS, 1, 'mc',
                'Which schema change best stops the invented purchase-order numbers without weakening the fields that every invoice has?',
                'Only the purchase-order number is sometimes absent, so only that field should allow null; invoice_number and total are always present and are worth keeping required so that omissions are caught. Making everything optional invites silent gaps, a prompt sentence cannot overcome the pressure of a required field, and other-plus-detail is a pattern for categories, not for missing values.',
                options=['Make all three fields optional, so that the model is never pushed to produce a value it cannot see in the invoice',
                         'Keep all three required and add a prompt sentence telling the model never to invent a purchase-order number',
                         'Make po_number nullable and keep invoice_number and total required, since every invoice has those two',
                         'Make po_number required but add an "other" value with a detail string for suppliers that skip it'],
                correct=2),
            _cq(_CS, 2, 'mc',
                'Where should the check that the line items add up to the total live?',
                'A relationship between fields is a semantic rule, and schemas constrain structure and types rather than arithmetic. Validation code can recompute the sum and, on a mismatch, drive a retry that carries the specific error. A prompt reminder is only a hope, and catching the problem after loading means bad data has already reached the accounting system.',
                options=['In the JSON schema, as a rule that the total must equal the sum of all the line items on the invoice',
                         'In validation code that recomputes the sum, compares it with the total and sends any mismatch back as a retry error',
                         'In a prompt sentence telling the model to double-check its arithmetic before it fills in the total',
                         'In the accounting system after the data is loaded, where finance already reconciles the accounts'],
                correct=1),
            _cq(_CS, 3, 'mc',
                'What is the best response to the 2% of invoices whose ship_to_country stays missing after five retries?',
                'The country is not in the text the model receives, so no retry can find it. Supplying the form that holds it fixes the input, and where the form is missing a person has to follow up. More attempts waste calls, inferring a country from an address invents a fact, and a required field only adds pressure to fabricate.',
                options=['Raise the retry cap from five to ten so that the model has more chances to find the country',
                         'Let the model infer the country from the supplier address whenever the field is empty',
                         'Mark ship_to_country as required, so that the validator error carries more weight on each retry',
                         'Include the customs form in the input where it exists, and route invoices without it to a person'],
                correct=3),
            _cq(_CS, 4, 'ms',
                'Which three steps best fit the archive re-extraction? (Choose three.)',
                'Nobody waits for the archive results, so the Batches API saves half the cost. A sample run settles prompt and schema problems before they are repeated 200,000 times. custom_id lets you find failures and resubmit only those, with oversized invoices split into chunks. Running everything synchronously forfeits the discount, and results do not arrive in submission order, so position cannot identify an invoice.',
                options=['Submit the archive through the Message Batches API, since nobody needs the results for two weeks',
                         'Run a representative sample through the same request shape and refine the prompt before the full submission',
                         'Give every request a custom_id, then resubmit only the failures, splitting oversized invoices into chunks',
                         'Run all 200,000 invoices on the synchronous API in parallel so that failures appear immediately',
                         'Submit everything at once and match results to invoices by their order in the results file'],
                correct=[0, 1, 2]),
        ],
    },
])

# ---------------------------------------------------------------------------
# MADLIBS
# ---------------------------------------------------------------------------
MADLIBS.extend([
    {
        'id': 'ml-ccarf-201', 'cat': _PR,
        'scenario': 'To cut false positives, replace "only report high-confidence findings" with explicit {b1} that say which issues to report and which to skip. Few-shot examples work best when they are relevant, {b2} and wrapped in tags so the model does not mistake them for instructions. A field that some documents do not contain should be {b3}, so the model is not pushed to invent a value.',
        'blanks': [
            {'key': 'b1', 'options': ['confidence thresholds', 'categorical criteria', 'temperature settings'], 'correct': 1},
            {'key': 'b2', 'options': ['identical', 'as numerous as possible', 'varied'], 'correct': 2},
            {'key': 'b3', 'options': ['optional or nullable', 'required', 'defaulted to zero'], 'correct': 0},
        ],
        'explanation': 'Confidence wording and thresholds supply no decision boundary, whereas categorical criteria define what counts. Examples need variety rather than repetition, and clear tags to separate them from instructions. A required field pushes the model to fabricate, so a field that some documents lack should allow null or omission.',
    },
    {
        'id': 'ml-ccarf-202', 'cat': _PR,
        'scenario': 'A retry after a failed validation should send the original document, the failed extraction and the specific {b1}. The Message Batches API halves the cost, but a batch can take up to {b2} to finish and nothing guarantees an earlier result. A review that is independent of the author\'s reasoning needs {b3} that sees only the code and the criteria.',
        'blanks': [
            {'key': 'b1', 'options': ['previous system prompts', 'confidence scores', 'validation errors'], 'correct': 2},
            {'key': 'b2', 'options': ['10 minutes', '24 hours', '7 days'], 'correct': 1},
            {'key': 'b3', 'options': ['a fresh Claude instance', 'the same session with extended thinking', 'the same session with a harsher prompt'], 'correct': 0},
        ],
        'explanation': 'A retry needs the specific validation errors alongside the document and the failed attempt. A batch is cheaper because it is asynchronous, but it may take up to 24 hours and carries no earlier guarantee. Independence comes from a fresh instance without the author\'s reasoning; extended thinking or a harsher prompt in the same session keeps the same context.',
    },
])

# ---------------------------------------------------------------------------
# SEQUENCES
# ---------------------------------------------------------------------------
SEQUENCES.extend([
    {
        'id': 'seq-ccarf-201', 'cat': _PR,
        'prompt': 'Put the stages of a validated extraction pipeline in order, from defining the output to handling the leftovers.',
        'steps': [
            'Define an extraction tool whose JSON schema has nullable fields and an unclear or other option for categories',
            'Call the model with the document, the tool and the normalization rules in the prompt',
            'Check the stop reason, then read the extraction from the tool-use block',
            'Validate the result in code for semantic rules such as totals and date order',
            'On a fixable failure, retry with the document, the failed extraction and the specific errors',
            'After a small retry cap, route anything still failing to human review',
        ],
        'explanation': 'The schema comes first because its design prevents fabrication. The stop reason is checked before the output is trusted, and code validation catches the semantic errors that constrained output cannot. A retry carries the document, the failed attempt and the exact errors, and a cap sends the unresolvable cases to a person instead of looping.',
    },
    {
        'id': 'seq-ccarf-202', 'cat': _PR,
        'prompt': 'Order the steps of running a large extraction job through the Message Batches API.',
        'steps': [
            'Refine the prompt and schema on a small representative sample',
            'Build one request per document, each with a unique custom_id',
            'Submit the batch',
            'Poll the batch status until it reports that processing has ended',
            'Retrieve the results and match each one to its document by custom_id',
            'Resubmit only the failed or expired requests after fixing their causes, for example by chunking oversized documents',
        ],
        'explanation': 'Tuning on a sample comes first so most requests succeed on the first pass. Each request needs its custom_id before submission, because results return in any order. After polling shows the batch has ended, results are matched by custom_id, and only the failures are rebuilt and resubmitted.',
    },
])

# ---------------------------------------------------------------------------
# COMPARE
# ---------------------------------------------------------------------------
COMPARE.extend([
    {
        'id': 'cmp-ccarf-201', 'cat': _PR,
        'scenario': 'A review bot keeps flagging harmless patterns, and developers dismiss most of its comments. The team must choose the prompt change that will cut these false positives. Which is better?',
        'optionA': 'Tell the model to be conservative and to report only findings it is highly confident about.',
        'optionB': 'Define which categories to report and which to skip, and add a few example pairs of acceptable and genuinely problematic code with a one-line reason each.',
        'better': 'B',
        'why': 'Defining categories and adding example pairs gives the model a decision boundary and shows how to apply it to new cases. Confidence wording is tempting because it is cheap and sounds careful, but it changes tone rather than what counts as a problem, and the model\'s own confidence is not a calibrated measure of precision.',
    },
    {
        'id': 'cmp-ccarf-202', 'cat': _PR,
        'scenario': 'About a third of supplier invoices carry no purchase-order number, and the extraction schema currently marks that field as required. Which design is better?',
        'optionA': 'Make po_number nullable and tell the model to return null when the invoice shows no purchase-order number.',
        'optionB': 'Keep po_number required and add a prompt line saying the model must never invent a purchase-order number.',
        'better': 'A',
        'why': 'A required field pressures the model to supply something, and a prompt prohibition has to fight that pressure on every call. A nullable field lets the schema itself express honest absence. The prohibition looks safe because it is explicit, but a plausible fake number is worse than a null.',
    },
    {
        'id': 'cmp-ccarf-203', 'cat': _PR,
        'scenario': 'A coding agent has just finished a change, and you want an automated review that catches subtle defects. Which setup is better?',
        'optionA': 'Ask the same session to review its own change with extended thinking enabled and a prompt telling it to be highly critical.',
        'optionB': 'Start a fresh Claude instance that receives only the diff and the review criteria, and have it return findings.',
        'better': 'B',
        'why': 'The author session still holds the reasoning that produced the change and tends to defend it; more thinking time or a sterner tone does not remove that. Self-review with extended thinking is tempting because it keeps all context and spends more reasoning effort, but independence is what exposes subtle problems.',
    },
])

# ---------------------------------------------------------------------------
# CHEAT SHEET - Domain 4
# ---------------------------------------------------------------------------
CHEAT_SHEET.extend([
    {
        'heading': 'Criteria, few-shot examples and structured output (4.1, 4.2, 4.3)',
        'points': [
            'Vague instructions ("be conservative", "only high-confidence findings", "check that comments are accurate") do not change what gets flagged. Write explicit categorical criteria: what to report (bugs, security) and what to skip (minor style, local patterns), as tests the model can answer yes or no. Ask for evidence (quote the line) before a claim is posted.',
            'False-positive trust erosion: one noisy category makes developers ignore the accurate ones. Temporarily disable the noisy category, improve its criteria, then re-enable it. Define every severity level with a concrete code example so labels stay consistent.',
            'Few-shot examples are the strongest fix when detailed instructions still give inconsistent output. The guide says 2-4 targeted examples for ambiguous cases (Anthropic docs: 3-5), each showing the action chosen and why it beat the alternative. Make them relevant and varied, wrapped in example tags inside an examples tag.',
            'Jobs for examples: demonstrate the format (location, issue, severity, suggested fix); settle ambiguous cases; pair acceptable and genuine code to cut false positives while generalizing; cover varied layouts (inline citations versus bibliography, informal measurements) to fix empty or invented values. Examples cannot supply information the document lacks.',
            'Structured output: define an extraction tool whose input schema is the JSON Schema and read the tool-use input. strict: true (or the JSON outputs option, output_config.format) constrains decoding: no syntax errors, correct types, required fields present. It does NOT catch semantic errors (totals that do not sum, values in the wrong field). Check stop_reason: refusal and max_tokens can leave non-conforming output.',
            'tool_choice: auto (default; the model may reply in text), any (must call some tool, the model picks: unknown document type), a named tool (forced: run extract_metadata first). Forcing prefills the reply, so there is no preamble. Current docs: any and a named tool return a 400 error on Opus 5.5, Sonnet 5.5, Fable 5.1 (and Mythos 5.1) and with manual extended thinking; use auto with strict tools and treat a reply with no tool call as a failure.',
            'Schema design: optional or nullable fields for data some documents lack (a required field invites invented values); an "unclear" enum value for ambiguous sources; "other" plus a detail string for extensible categories; keep always-present fields required. Put format normalization rules (dates, currency, units) in the prompt next to the strict schema.',
        ],
    },
    {
        'heading': 'Validation, batches and multi-pass review (4.4, 4.5, 4.6)',
        'points': [
            'Validate in code (Pydantic or a JSON Schema validator) for semantic and cross-field rules. Retry with error feedback: send the original document, the failed extraction and the specific errors. A bare "try again" repeats the mistake. Cap the retries and route leftovers to human review.',
            'Retries fix format and structure errors (wrong date format, value in the wrong field). They cannot fix information that is absent from the supplied source (a clause in an attachment never provided): stop, record it as missing, and route it.',
            'Self-check design: extract calculated_total beside stated_total and flag differences; add a conflict_detected boolean (keep both values) for contradictory sources; add detected_pattern to findings so dismissals can be grouped and false-positive patterns fixed.',
            'Message Batches API: 50% cheaper, asynchronous, up to 24 hours (most batches finish within an hour), no guaranteed latency. Use it for overnight, weekly and nightly work; never for blocking steps such as pre-merge checks. Poll the processing status until it ends, then fetch the results.',
            'custom_id (unique and stable, such as inv-4417-c3) correlates requests and results, which come back in any order. Result types: succeeded, errored, canceled, expired. Resubmit only the failed or expired requests after fixing the cause (for example chunk oversized documents). Tune the prompt on a small representative sample first.',
            'A batch request is one asynchronous call: a client-side tool loop (run the tool, return the result, continue) cannot run inside it, so use the synchronous API for those agents. Deadline maths: worst case = submission interval + 24 hours, so a 36-hour deadline needs a submission at least every 12 hours.',
            'Self-review is weak: the same session keeps the reasoning that produced the work, and extended thinking or a harsher prompt does not remove the bias. Use an independent Claude instance given only the diff and the criteria (writer/reviewer pattern), or a clean-context verification subagent that tries to refute findings.',
            'Large reviews: per-file passes for local issues plus a separate integration pass for cross-file data flow; this fixes attention dilution (uneven depth, contradictory verdicts), which a bigger context window does not. A verification pass can carry self-reported confidence to route findings, but calibrate it on labeled data before trusting thresholds. Requiring several runs to agree can suppress real bugs that are caught only intermittently.',
        ],
    },
])
