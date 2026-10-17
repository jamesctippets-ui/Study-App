"""CCDV-F part B1: flashcards and questions for Claude Code, Evaluation/Testing/Debugging, Model Selection and
Optimization, Prompt and Context Engineering, Security and Safety, and Tools and MCPs.

Written against the Claude Certified Developer - Foundations exam guide (version 1.0, effective July 2026;
domains 3 and 4-8) and verified in October 2026 against the current Claude API, Claude Code, Agent SDK and
Model Context Protocol documentation. Writer B1 owns FLASHCARDS and QUESTIONS only; writer B2 (data/ccdv_b2.py)
owns lessons, games, case studies and the cheat sheet. IDs here start at 1001 so they never collide with part A.
"""


def _fc(i, cat, front, back, detail):
    return {'id': i, 'cat': cat, 'front': front, 'back': back, 'detail': detail}


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


_CO = 'code'
_TE = 'testing'
_MO = 'models'
_PR = 'prompting'
_SA = 'safety'
_TO = 'tools'

FLASHCARDS = []
QUESTIONS = []
LESSONS = []
MADLIBS = []
SEQUENCES = []
CASE_STUDIES = []
COMPARE = []
# Placeholder so the build validates while content is written; replace with the real sections.
CHEAT_SHEET = [{'heading': 'Placeholder B', 'points': ['Placeholder one', 'Placeholder two']}]


# ---------------- Domain 5: Model Selection and Optimization (flashcards) ----------------
FLASHCARDS += [
    _fc('f1001', _MO, 'Token (and tokenizer)',
        "The small chunk of text, often a word fragment, that a model reads and writes; context limits, prices and rate limits are all measured in this unit, and the count for identical text depends on the model generation's text-splitting scheme.",
        'Budgets, max_tokens and cost estimates all use it. On older models one unit is about 3.5 English characters; Claude 4.7 and later models produce roughly 30 percent more units for the same text.'),
    _fc('f1002', _MO, 'Context window',
        'The maximum material a model can hold in view for one request: the system prompt, every message, tool definitions and results, images and documents, plus the reply it generates, thinking included. It works like working memory, and filling it is not automatically better.',
        'All current Claude models offer 1M tokens (Haiku 5.5 charges more above 100,000). Accuracy and recall can degrade as the window fills, so curate what goes in.'),
    _fc('f1003', _MO, 'Next-token generation (autoregressive decoding)',
        'How a language model writes text: given everything so far it scores every possible continuation, selects one small piece, appends it and repeats, so a reply is built one unit at a time and each earlier choice shapes the later ones.',
        'This is why long replies take longer and cost more, why a reply can be cut off mid-sentence, and why early wording choices can steer everything after them.'),
    _fc('f1004', _MO, 'Sampling parameters (temperature, top_p, top_k)',
        "Request settings that control how randomly the next piece of text is picked from the model's probability scores: one reshapes the distribution, another keeps only the most probable options up to a cumulative share, a third keeps a fixed number of top options. The newest Claude models reject any non-default value with a 400 error.",
        'On Opus 5.5, Sonnet 5.5, Haiku 5.5 and Fable 5.1 do not send them; steer behavior with prompts, examples, effort and structured outputs. Old advice to set temperature to 0 no longer applies.'),
    _fc('f1005', _MO, 'Non-determinism (LLM outputs)',
        'The property that identical requests can return different replies from one call to the next; reducing randomness settings does not make output fully repeatable, so tests and pipelines must tolerate variation instead of expecting byte-identical text.',
        'Grade with rubrics, thresholds or schema checks rather than string equality, and validate outputs in code. Anthropic notes that even temperature 0 is not fully deterministic.'),
    _fc('f1006', _MO, 'Zero-shot prompting',
        'Asking the model to perform a task from instructions alone, with no worked examples included in the prompt.',
        'Often enough for clear tasks on current models. Add examples when the output format or edge-case handling keeps going wrong.'),
    _fc('f1007', _MO, 'Single-shot (one-shot) prompting',
        'Including exactly one demonstration of an input and its desired output in the prompt, to show the expected format or style before the real input is given.',
        'One example can fix format, but the model may copy its quirks. If answers come in several shapes, vary the examples.'),
    _fc('f1008', _MO, 'Multi-shot (few-shot) prompting',
        'Supplying several varied, relevant demonstrations, typically three to five, of an input and its ideal output, each wrapped in its own tags, so the model infers the pattern, format and edge-case handling.',
        'One of the most reliable ways to steer format, tone and structure. The examples must be diverse, otherwise the model picks up accidental patterns.'),
    _fc('f1009', _MO, 'Adaptive thinking',
        'A mode in which the model itself decides whether and for how long to reason before answering, based on how hard the request is and on the effort setting. On the newest Opus and Fable models it is always on and cannot be turned off.',
        'It replaced manual budgets. Control depth with effort; thinking is billed as output. Sending thinking type disabled returns 400 on Opus 5.5 and Fable 5.1.'),
    _fc('f1010', _MO, 'Extended thinking (manual budget)',
        'The older way to enable reasoning, where a request sets thinking type enabled with a fixed budget_tokens allowance. It is deprecated on the 4.6 generation and rejected with a 400 error on current models, which use the adaptive approach instead.',
        'Migration trap: code that sends budget_tokens fails after a model upgrade. Remove it, choose an effort level, and use max_tokens as the hard ceiling.'),
    _fc('f1011', _MO, 'Effort parameter (output_config.effort)',
        'A request setting with five levels from low to max that scales how much work the model puts into the whole reply, including its reasoning, the number and verbosity of tool calls and the answer text. It is a behavioral signal, not a hard token limit.',
        'Default is high on most models and medium on Opus 5.5 and Haiku 5.5. Tuning it is often a better lever than switching models; changing it mid-conversation invalidates the prompt cache.'),
    _fc('f1012', _MO, 'Thinking token accounting',
        'The rule that reasoning produced before the answer is billed as output, counts against the response ceiling and takes up context space, even when the reasoning text is hidden from the application.',
        'Leave room in max_tokens at higher effort levels. A stop_reason of max_tokens with a short visible answer usually means thinking used up the budget.'),
    _fc('f1013', _MO, 'Fast mode',
        'An option on Opus 5.5, Opus 5 and Opus 4.8 (research preview on the last two) that serves the same model weights with a faster inference setup, giving up to about 2.5 times the output speed at premium pricing; it speeds up generation, not the wait before the first output appears.',
        'Set speed to fast; the beta header is needed only on the research-preview models, not on Opus 5.5. It is not available with the Batch API or on partner clouds, and switching speeds invalidates the prompt cache.'),
    _fc('f1014', _MO, 'Time to first token (TTFT)',
        'The delay between sending a request and receiving the first piece of generated output; the measure that makes streaming interfaces feel responsive, driven by prompt length, model choice and any up-front reasoning.',
        'Long prompts raise it; shorter prompts and prompt caching lower it; fast mode does not. Total time is roughly this delay plus output length divided by generation speed.'),
    _fc('f1015', _MO, 'Claude Haiku tier',
        "Anthropic's lowest-latency, lowest-price model tier, aimed at high-volume work such as classification, extraction, routing and sub-agent tasks where speed and cost dominate but reasoning quality still matters.",
        'The natural starting point for efficiency-first selection. Haiku 5.5 defaults to medium effort; confirm on your own evals before trusting it with harder steps.'),
    _fc('f1016', _MO, 'Claude Sonnet tier',
        'The balanced model tier: fast and capable enough for everyday coding, data analysis, content creation and agentic tool use, priced well below the top tiers, and a common default for production workloads.',
        'Pick it when the small tier falls short but the highest capability is not needed. Sonnet 5.5 defaults to high effort.'),
    _fc('f1017', _MO, 'Claude Opus tier',
        "The tier built for complex, long-running agentic coding and knowledge work, and the documentation's suggested starting point for most workloads; moderate latency, with higher capability and cost than the balanced tier.",
        'Opus 5.5 always uses adaptive thinking and defaults to medium effort; fast mode is offered on some Opus models.'),
    _fc('f1018', _MO, 'Claude Fable tier',
        'The highest-capability tier open to all customers, meant for demanding reasoning and long-horizon agentic work such as multi-hour agent sessions and deep research; it is slower and the most expensive, and it is a Covered Model that requires 30-day data retention.',
        'Move up to it when evals on Opus at xhigh or max effort still fall short. A sibling model with the same capabilities is limited to verified organizations.'),
    _fc('f1019', _MO, 'Efficiency-first model selection',
        'Starting with the smallest, cheapest tier that might work, testing it thoroughly on your own tasks, and moving up a tier only for the capability gaps those tests expose.',
        'Best for prototypes, tight latency and high-volume straightforward work. The opposite approach is capability-first.'),
    _fc('f1020', _MO, 'Capability-first model selection',
        'Starting with a strong model so the task is solved at all, tuning prompts for it, then trading down in effort or tier for as long as the evals still pass.',
        'Best for complex reasoning, high-stakes accuracy and long-horizon agents: the savings come after you know what quality is achievable.'),
    _fc('f1021', _MO, 'Cost per completed task',
        'The comparison measure that divides total spend, including retries, extra turns and verbose output, by the number of tasks actually solved, instead of comparing per-million-token prices.',
        'A pricier model can be cheaper if it finishes in fewer turns, and a tokenizer change makes per-token comparisons misleading.'),
    _fc('f1022', _MO, 'Advisor strategy',
        'A multi-model pattern in which a smaller executor model runs the loop and consults a stronger model through an advisor tool only at hard decisions; it helps only when the executor actually asks for advice.',
        'Measure the consult rate and compare against simply raising effort. The advisor tool definition itself adds roughly a thousand prompt tokens to every request.'),
    _fc('f1023', _MO, 'Model migration breaking change',
        'A difference between model generations that makes unchanged code fail or behave differently, such as removed parameters, new defaults or a different tokenizer, found by reading the migration guide and re-running your evals before switching.',
        'Examples: sampling parameters, prefill, manual thinking budgets and forced tool_choice are rejected on newer models, and the default effort changed on Opus 5.5.'),
    _fc('f1024', _MO, 'Tokenizer change (Claude 4.7 and later)',
        'The shift in which Claude 4.7 and later models split the same text into roughly 30 percent more pieces than earlier models, so counts, limits and bills measured on an older model must be re-baselined for the target model.',
        'Recount with the token counting endpoint and the new model ID; revisit max_tokens, compaction triggers and any client-side size estimates.'),
    _fc('f1025', _MO, 'Models API (capability lookup)',
        "A listing endpoint that returns each available model's id, maximum input and output sizes and a capabilities object, so code can check support, such as whether thinking may be disabled, instead of hard-coding assumptions.",
        'Read capabilities rather than inferring them from a model name. It also reports which line a model belongs to, useful for model pickers.'),
    _fc('f1026', _MO, 'Covered Model data retention',
        'The designation for the most capable model families (Fable and Mythos) that require 30-day data retention, which means zero data retention is not available for them unless Anthropic expressly authorizes it.',
        'A model-selection constraint for regulated workloads: an organization without the required retention setting can have requests rejected with a 400 error. Check it before choosing the top tier.'),
    _fc('f1027', _MO, 'Prompt caching economics',
        'The pricing shape of caching: writing a prefix costs more than ordinary input (about 1.25 times for the five-minute lifetime, 2 times for one hour), while later reads cost only a small fraction (a tenth or less), so it pays off when a prefix is reused soon and often.',
        'At the standard read rate break-even is one read for the five-minute lifetime and two for the one-hour lifetime. Output pricing is unaffected, and batch discounts stack with it.'),
    _fc('f1028', _MO, 'Cache time-to-live (TTL)',
        'How long a cached prefix stays available: five minutes by default, refreshed at no charge each time it is read, or one hour at a higher write price. Pick it from the gaps between requests in a conversation.',
        'Turns seconds apart suit the default; a person pausing between five minutes and an hour suits the longer lifetime. A miss rewrites the whole prefix at the write price.'),
    _fc('f1029', _MO, 'Cache checkpointing',
        'Placing breakpoints at the end of each stable section (tool definitions, system instructions, a large reference document, the conversation so far) so each part is reused independently; up to four, each on the last block that is identical across requests.',
        'Never mark a block that changes per request, such as a timestamp or the newest user message. Because the lookback is 20 blocks, long conversations may need an extra checkpoint.'),
    _fc('f1030', _MO, 'Cache invalidation',
        'What happens when anything at or before a breakpoint changes: the prefix no longer matches, so the next request misses and pays the write price again. Editing tool definitions clears everything; editing the system prompt clears it and later messages; changes to tool_choice, images, thinking or effort clear the message layer.',
        'Keep volatile data after the last breakpoint, and make unavoidable changes at natural breaks, such as right after a compaction.'),
    _fc('f1031', _MO, 'Minimum cacheable prompt length',
        'The shortest prefix the API will cache (512 tokens on the current models, more on older ones). Shorter prompts are processed normally with no error and no caching, which shows up as zero in both cache fields of the usage object.',
        'If a prompt sits just under the minimum, adding stable content to reach it can lower cost. Always confirm caching happened by reading the usage fields.'),
    _fc('f1032', _MO, 'Output token premium',
        'The pricing asymmetry in which generated text costs several times more per unit than input text (five times on the current models), and in an agent loop each generated unit is re-read as input on later turns, so concise replies save more than shorter prompts.',
        'Ask for the answer you will read, not the one that looks thorough: in one measured agent a long memo format cost far more than a one-line answer with no gain in accuracy.'),
    _fc('f1033', _MO, 'Token budgeting',
        'Deciding in advance how much each request, agent turn or session may consume across input, reasoning, tool results and output, and enforcing it with ceilings and alerts rather than hoping usage stays reasonable.',
        'Tools include max_tokens per response, effort, task budgets, session budgets in Managed Agents, and workspace spend limits as the final backstop.'),
    _fc('f1034', _MO, 'Task budget (task_budget)',
        'A beta output setting that gives the model an advisory total allowance for a whole agentic loop, shown to it as a running countdown so it paces itself and wraps up gracefully; unlike a hard ceiling, the model can see it.',
        'It complements effort (thoroughness per step) and max_tokens (a hard cap on one response). The API does not report the remaining amount back to you.'),
    _fc('f1035', _MO, 'Cost modeling',
        'Estimating spend before launch by multiplying expected request volume by input, output and reasoning volumes at their different prices, then adjusting for cache hits, batch discounts and tool overhead, and validating the estimate against real usage data.',
        'Include the resent conversation history, tool definitions and thinking, and recount tokens for the target model.'),
    _fc('f1036', _MO, 'Usage and Cost API',
        'An administrative reporting interface that returns token usage and cost in time buckets, filterable and groupable by model, workspace, API key, service tier and more, for attribution, chargeback and cache-efficiency analysis; it needs an Admin-level credential, not a workspace key.',
        'Data appears within minutes, and the Console shows similar Usage and Cost pages. Separate workspaces per feature or environment make attribution simple.'),
    _fc('f1037', _MO, 'Client SDK (REST wrapper)',
        'A language library that wraps the HTTP interface so code calls typed functions instead of crafting requests by hand, adding authentication, required headers, retries, timeouts, streaming helpers and error classes.',
        'Official SDKs exist for Python, TypeScript, C#, Go, Java, PHP and Ruby, and read ANTHROPIC_API_KEY from the environment. Hand-written HTTP must send the version header and implement retries itself.'),
    _fc('f1038', _MO, 'WebSocket',
        "A protocol that upgrades an HTTP connection into a persistent two-way channel, unlike a plain request/response call or a one-way event stream; Claude's streaming replies do not use it.",
        "The Messages API streams over server-sent events. A WebSocket can still make sense between your own backend and a browser when the user must send messages while a reply streams, but that layer is yours, not the API's."),
]


# ---------------- Domain 6: Prompt and Context Engineering (flashcards) ----------------
FLASHCARDS += [
    _fc('f1039', _PR, 'Clear and direct instructions',
        'Stating the task, audience, success criteria, format and constraints explicitly, as if briefing a capable new colleague who has no background, because the model cannot infer unstated norms or intentions.',
        'Golden-rule test: if a colleague with minimal context would be confused by the prompt, the model will be too. "Above and beyond" behavior has to be requested, not assumed.'),
    _fc('f1040', _PR, 'Instruction motivation',
        'Adding the purpose behind a rule, for example that the text will be read aloud by a speech engine, so the model can apply the intent to cases the rule never listed instead of obeying a bare prohibition mechanically.',
        'A bare "never use ellipses" is weaker than saying why. Explanations generalize; shouting in capitals does not.'),
    _fc('f1041', _PR, 'XML tag structuring',
        'Wrapping each kind of prompt content (instructions, context, examples, variable input, documents) in its own consistently named tags, nested when the content is hierarchical, so the model separates them without ambiguity.',
        'It also works for output: ask for the answer inside a named tag so code can extract it reliably.'),
    _fc('f1042', _PR, 'Example curation',
        'Choosing demonstrations that are relevant to the real task, diverse enough to cover edge cases and every label without teaching accidental patterns, and enclosed in their own tags so they are not mistaken for instructions.',
        'Three to five is a good range. A set of all-positive examples biases a classifier; near-duplicates add nothing.'),
    _fc('f1043', _PR, 'Role prompting',
        "Setting a persona or area of expertise in the system prompt, even in a single sentence, to focus the model's tone, vocabulary and behavior for the application.",
        'A system prompt works best as a role plus durable policies; per-request data belongs in the user turn.'),
    _fc('f1044', _PR, 'System versus user placement',
        'The rule of thumb for where text goes: the stable role, policies and output rules that apply to every turn live in the system prompt, while the specific task and the data to work on arrive in the user turn.',
        'Untrusted material does not belong in the system prompt, which carries the highest authority. Long documents go in the user turn, ahead of the question.'),
    _fc('f1045', _PR, 'Documents-first ordering',
        'Placing long reference material, tens of thousands of units and more, near the top of the prompt and the question or instructions after it, which tests showed can raise answer quality, especially with many documents.',
        'Wrap each document with its source in tags, and consider asking for relevant quotes before the answer.'),
    _fc('f1046', _PR, 'Quote-first grounding',
        'Asking the model to extract word-for-word quotes from the supplied documents first and then answer using only those quotes, which focuses it on the relevant passages and cuts down on invented claims.',
        'Pair it with permission to say the answer is not in the documents. A claim with no supporting quote should be withdrawn.'),
    _fc('f1047', _PR, 'Positive instruction framing',
        'Phrasing guidance as the behavior you want (write in flowing paragraphs) rather than the behavior you forbid (do not use lists), which steers more reliably and avoids drawing attention to the unwanted pattern.',
        "Match the prompt's own style to the desired output: a prompt full of markdown tends to produce markdown."),
    _fc('f1048', _PR, 'Output constraints',
        'Explicit limits on the shape of a reply: required format or schema, structure, tone and length. For length, sentence or paragraph limits work better than word counts, because the model works in pieces of text rather than words.',
        'A hard max_tokens cut-off truncates mid-sentence, so treat it as a safety net rather than the length control. Use structured outputs when the shape must be guaranteed.'),
    _fc('f1049', _PR, 'Iterative prompt refinement',
        'A disciplined loop: write a first prompt, run it against a fixed set of test cases, inspect the failures, change one thing, re-run everything and repeat until the criteria are met, instead of tuning on the latest complaint.',
        'Keep the test set and record each revision. Fixing three anecdotes can silently break others.'),
    _fc('f1050', _PR, 'Prompt audit',
        'Re-reading existing prompts, tool descriptions and instruction files after a model change and deleting text written for an older model, such as emphatic warnings, "verify twice" rules and hand-built scratchpads, because newer models obey such text literally.',
        'Over-obeyed instructions cost money through extra tool rounds; stale settings and contradictions cost accuracy. Claude Code offers /doctor prompt-audit for a first pass.'),
    _fc('f1051', _PR, 'Emphasis dial-back',
        'Replacing shouted wording such as CRITICAL or MUST ALWAYS with ordinary phrasing like "use this tool when...", because newer models respond strongly to the system prompt and tend to over-apply rules that are emphasized.',
        'Symptom: a tool or skill that used to under-trigger is now called constantly. Fix the prompt before reaching for lower effort.'),
    _fc('f1052', _PR, 'Input sanitization',
        'Cleaning and bounding untrusted text before it enters a prompt: escaping or removing delimiter sequences that could close your data section, limiting length, normalizing encoding and rejecting inputs that match known attack patterns.',
        'A first line of defense, not a complete one; combine it with structural separation, least privilege and output checks.'),
    _fc('f1053', _PR, 'Instruction placement across components',
        'Choosing the layer that should hold each instruction: the system prompt for durable role and policy, the user turn for the task and its data, a tool description for per-tool usage, CLAUDE.md for always-on project facts, a skill for occasional procedures, and a hook or code for rules that must never be missed.',
        'The wrong layer is a common root cause: a must-always rule in a prompt is a wish, and a rare procedure in an always-loaded file is waste.'),
    _fc('f1054', _PR, 'Context rot',
        'The decline in accuracy and recall as a context fills with more material, which is why a huge window does not remove the need to choose carefully what goes into it.',
        'Curate: retrieve only what is relevant, trim stale tool output, summarize, or delegate side work.'),
    _fc('f1055', _PR, 'Context drift',
        'The gradual loss of early goals, constraints or decisions in a long session, as newer material crowds them out or older turns are summarized away, so the model starts ignoring rules it followed earlier.',
        'Counter with durable instructions in the system prompt or CLAUDE.md, periodic restatement, state files and fresh sessions between unrelated tasks.'),
    _fc('f1056', _PR, 'Compaction',
        'Replacing the older turns of a long conversation with a model-written summary so work can continue inside the window; recent turns can be kept verbatim, but detail from the summarized part may be lost.',
        'Server-side compaction is the primary strategy for long agent runs. Rules that must persist belong in the system prompt or CLAUDE.md, not only in early messages.'),
    _fc('f1057', _PR, 'Context editing',
        'An API feature (beta) that applies rules to the history before the prompt reaches the model, such as clearing the oldest tool results or earlier thinking blocks once a threshold is passed and leaving a placeholder behind.',
        'Use it for tool-heavy loops where old results no longer matter. Unlike compaction it deletes by rule instead of summarizing.'),
    _fc('f1058', _PR, 'Tool output pruning',
        'Keeping tool results small: returning only the fields the next step needs, truncating or paginating large payloads, and replacing stale bulky results with a one-line extract at task boundaries.',
        'The cheapest context lever is not producing the bulk in the first place; tool search and programmatic tool calling attack other sources of bloat.'),
    _fc('f1059', _PR, 'Just-in-time context retrieval',
        'Giving the agent lightweight handles such as file paths, queries or links, plus tools to open them, so it loads detail only when needed instead of stuffing everything into the prompt up front.',
        'It keeps the window focused and lets an agent explore a huge repository or knowledge base.'),
    _fc('f1060', _PR, 'Context isolation',
        'Keeping noisy side work out of the main conversation by giving it its own window, through a delegated subagent or a separate fresh model call in a multi-step workflow, and carrying forward only the conclusions.',
        'Pass structured results, not transcripts, between steps. It also stops one step\'s chatter from steering the next.'),
    _fc('f1061', _PR, 'Multi-window state files',
        'Durable artifacts that let a fresh context window resume long work: a structured status file such as tests.json, free-form progress notes and the git history, which the new session reads before continuing.',
        'When a task spans many windows, starting fresh and reading these files is often better than relying on a lossy summary.'),
    _fc('f1062', _PR, 'Retrieval-augmented generation (RAG)',
        'Pulling relevant passages from an external knowledge base at question time and placing them in the prompt, so answers rest on current, specific evidence rather than on what the model memorized; quality depends on the quality of the retrieval.',
        'Choose it when knowledge is large or changes often. Cite the sources and let the model say when nothing relevant was found.'),
    _fc('f1063', _PR, 'Hallucination',
        'Plausible-sounding output that is wrong or unsupported by the supplied sources, produced because the model predicts likely text rather than looking facts up.',
        'Reduce it with permission to say "I do not know", quote-first grounding, citations, restriction to the provided documents and external checks. It can be lowered, never eliminated.'),
    _fc('f1064', _PR, 'Skepticism toward confident output',
        'The engineering habit of treating a fluent, assured answer as unverified until it is checked against a source, a test, a schema or a second opinion, particularly before the output triggers an action or reaches users.',
        'Confidence in tone is not evidence. Scale verification to the stakes: tests for code, citations for facts, human review for irreversible actions.'),
    _fc('f1065', _PR, 'Validate-and-retry loop',
        'Checking each reply in code against the schema and business rules and, on failure, re-prompting with the specific error for a bounded number of attempts before escalating to a fallback or a person.',
        'Feeding the exact violation back usually fixes it, while unbounded retries burn money. Constrained decoding reduces, but does not remove, the need.'),
    _fc('f1066', _PR, 'Best-of-N consistency check',
        'Running the same prompt several times and comparing the answers; disagreement between runs flags content that is likely unreliable and worth verifying.',
        'A cheap signal for factual claims, but agreement does not prove correctness, and it costs N times as much.'),
    _fc('f1067', _PR, 'Citations (source grounding)',
        "An API option on document blocks that returns, alongside the text, pointers to the exact passages in your supplied sources that support each claim, making answers auditable instead of relying on the model's own account of where facts came from.",
        'More dependable than asking in the prompt for sources. Cache the document block; the option cannot be combined with structured outputs.'),
]


# ---------------- Domain 8: Tools and MCPs (flashcards) ----------------
FLASHCARDS += [
    _fc('f1068', _TO, 'Tool description',
        'The detailed plain-language text attached to a tool definition that tells the model what the tool does, when to use it and when not to, what each parameter means and what the result contains; the biggest single factor in whether tools are chosen and called correctly.',
        'Aim for several sentences, not a phrase. Differentiate similar tools by WHEN to use each one, not only by what they do.'),
    _fc('f1069', _TO, 'Tool input examples (input_examples)',
        'An optional list of sample argument objects, each valid against the schema, shipped with a tool definition to show how complex, nested or format-sensitive inputs should look; invalid samples are rejected and each adds a little prompt cost.',
        'Use it when the description alone leaves optional fields or formats ambiguous. Not supported on server-executed tools.'),
    _fc('f1070', _TO, 'tool_choice parameter',
        'A request field that governs whether the model may or must call tools: automatic choice, any one tool, one named tool, or none. The forcing options are rejected on the newest models, which expect automatic choice plus strict schemas.',
        'Changing it between requests invalidates cached message content. A forced call skips thinking and suppresses preamble text.'),
    _fc('f1071', _TO, 'Tool consolidation',
        'Merging closely related operations into one tool with an action argument, rather than exposing many near-identical tools, so the model faces fewer, clearer choices and the tool list stays short.',
        'The trade-off is that a merged tool needs a precise description of every action. Pair it with namespacing.'),
    _fc('f1072', _TO, 'Tool namespacing',
        'Prefixing tool names with the service or resource they belong to, such as github_list_prs or slack_send_message, so similar tools from different systems stay unambiguous as the catalog grows.',
        'It matters most with tool search and with several MCP servers; clients that aggregate servers should prefix names to avoid collisions.'),
    _fc('f1073', _TO, 'High-signal tool responses',
        'Designing tool results to return only the fields the next decision needs, with stable, meaningful identifiers instead of opaque internal references, and keeping payloads small, because bulky results waste context and bury what matters.',
        'Paginate or summarize large lists. Bloated results are a main source of context rot in agents.'),
    _fc('f1074', _TO, 'Instructive tool errors',
        'Failure results returned with is_error set whose message states what went wrong and what to try next, so the model can fix a parameter or wait and retry instead of guessing.',
        '"failed" teaches nothing; "date must be in the future, today is 2026-10-15" does. An invalid call is normally retried by the model two or three times.'),
    _fc('f1075', _TO, 'Client-executed tool',
        'Any tool whose code runs inside your own application: the model emits a request, your harness runs it and returns a result block. It covers your own functions and Anthropic-schema tools such as bash, text editor, memory and computer use.',
        'You own execution, permissions, logging and the loop. The contrast is a tool that Anthropic runs for you.'),
    _fc('f1076', _TO, 'Server-executed tool',
        'A tool that Anthropic runs on your behalf, such as web search, web fetch, code execution or tool search; you enable it and read the results instead of building a result block, except when the loop pauses or a client tool is called alongside it.',
        'Look for server_tool_use blocks. If the iteration limit is hit the stop reason is pause_turn, and you re-send the conversation to continue.'),
    _fc('f1077', _TO, 'Anthropic-schema tool',
        'A tool whose definition Anthropic publishes and the models were trained on, such as bash, text editor, memory, computer or browser use; Claude calls it more reliably than a home-made equivalent, but your application still executes it.',
        'Choose these for standard developer operations and define your own for business logic.'),
    _fc('f1078', _TO, 'Tool dispatcher',
        "The harness code that maps each incoming tool request's name to a handler, validates the arguments, runs it with the right permissions, and returns a result, or an error result, for every request id.",
        'The right place for authorization, input validation, rate limits, logging and approval checks, because it runs no matter what the model decides.'),
    _fc('f1079', _TO, 'Tool search (deferred loading)',
        'A server-side tool that lets the model search a large catalog and load only the definitions it needs; tools marked defer_loading stay out of the prompt until discovered, cutting context cost and improving selection among dozens of tools.',
        'About 55k tokens of definitions in a five-server setup shrink by over 85 percent. Consider it past roughly 20 tools; the search tool itself is never deferred.'),
    _fc('f1080', _TO, 'Programmatic tool calling',
        'Letting the model write code that runs in the code execution sandbox and calls your tools from there, so loops and filtering happen in code and only the final, trimmed result enters the conversation.',
        'Good for many repetitive lookups, such as checking 20 employees with one script instead of 20 round trips. The tool must allow code execution as a caller.'),
    _fc('f1081', _TO, 'Model Context Protocol (MCP)',
        'An open standard, built on JSON-RPC, for connecting AI applications to external tools and data through one common interface, so a capability built once can be used by many compliant clients; often compared to a USB-C port for AI.',
        'It is not Claude-specific. The current specification, dated 2026-07-28, uses stateless, self-contained requests with capabilities negotiated on each request.'),
    _fc('f1082', _TO, 'MCP server',
        'A program that exposes tools, resources and prompts over the protocol so any compliant client can use them, built, deployed and maintained independently of the applications that connect to it.',
        'Local servers usually run as subprocesses; shared or remote ones run over HTTP. Treat third-party servers as untrusted code.'),
    _fc('f1083', _TO, 'MCP host and client',
        'The consuming-side roles: the host is the AI application that starts connections and talks to the model, and a client is the connector inside the host that maintains the link to exactly one server.',
        'Claude Code and Claude Desktop are hosts; each configured server gets its own client connection.'),
    _fc('f1084', _TO, 'MCP tools (model-controlled)',
        'The server primitive for functions the model itself decides to call to take actions or fetch information, each described by a name, a description and an input schema; execution failures are reported inside the result so the model can adapt.',
        'Discovered with a list request and invoked with a call request. A human should be able to approve invocations.'),
    _fc('f1085', _TO, 'MCP resources (application-controlled)',
        'The server primitive for read-only context, such as file contents, schemas or records identified by a URI, which the host application chooses to attach to the conversation rather than the model deciding to call it.',
        'Think data to read, as opposed to functions that act. The Messages API connector supports tool calls only.'),
    _fc('f1086', _TO, 'MCP prompts (user-controlled)',
        'The server primitive for reusable, parameterized prompt templates that a person picks deliberately, for example through a slash command or a menu entry.',
        'Control hierarchy to remember: prompts are chosen by the user, resources by the application, tools by the model. In Claude Code, server prompts appear as commands.'),
    _fc('f1087', _TO, 'stdio transport',
        "The local transport in which the client launches the server as a subprocess and they exchange newline-delimited JSON-RPC messages over the process's standard input and output; nothing else may be written to standard output, and logs go to standard error.",
        'Typical for single-user local tools. A stray print() to standard output corrupts the protocol stream.'),
    _fc('f1088', _TO, 'Streamable HTTP transport',
        'The standard remote transport in which every client message is an HTTP POST to a single endpoint and the server answers with plain JSON or a per-request event stream; servers must validate the Origin header and, when local, bind to localhost only.',
        'It replaced the older HTTP+SSE transport, now deprecated. Authenticate every connection.'),
    _fc('f1089', _TO, 'MCP connector',
        'A beta Messages API feature that connects Claude to remote servers directly from a request, by listing the servers and a toolset to enable, without building a client of your own; it supports tool calls only and needs publicly reachable HTTP endpoints.',
        'A local subprocess server cannot be attached this way; use Claude Code, the Agent SDK or client-side helpers instead.'),
    _fc('f1090', _TO, 'MCP configuration scopes',
        'The three places Claude Code stores server definitions: local (private to you in one project, the default), project (a .mcp.json file committed for the team, which needs approval) and user (private across all your projects).',
        'When a name is defined in several places the more specific scope wins. Project scope is how a team shares one setup.'),
    _fc('f1091', _TO, 'MCP tool execution error',
        'A failure inside a tool call, such as bad input or an API outage, reported in the normal result with the error flag set and an actionable message, as opposed to a protocol-level error for malformed or unknown requests.',
        'Return execution errors the model can act on, saying what to fix, so it self-corrects. Protocol errors are unlikely to be recoverable by the model.'),
    _fc('f1092', _TO, 'Agent Skill',
        'A folder containing a SKILL.md file with a name and a description of what it does and when to use it, plus optional scripts and reference files; only the short description is always in context, the body loads when the task matches, and extra files load on demand.',
        'This progressive disclosure keeps many skills nearly free. Skills teach how and when; an MCP server provides the connection.'),
    _fc('f1093', _TO, 'Built-in tool',
        "A capability that ships with the product or API and needs enabling rather than building, such as Claude Code's file and shell tools or the API's web search and code execution tools.",
        'Prefer them for standard operations. They do not reach arbitrary internal systems, which is where custom tools or MCP servers come in.'),
    _fc('f1094', _TO, 'Custom tool (user-defined)',
        'A tool you specify with a name, a description and an input schema whose handler is your own code, used for business logic and internal systems that no built-in tool covers.',
        'The cheapest option for one application. If several applications need the same capability, an MCP server avoids duplicating handlers.'),
    _fc('f1095', _TO, 'Extension mechanism selection',
        'Choosing among built-in tools, custom tools, skills and servers for a need: standard operations use built-ins, app-specific logic uses a custom tool, reusable procedures and know-how use a skill, and shared access to external systems uses a protocol server.',
        'They combine: a server provides the connection and a skill teaches the team\'s way of using it. Rules that must always hold belong in hooks.'),
]

QUESTIONS = []

LESSONS = []
MADLIBS = []
SEQUENCES = []
CASE_STUDIES = []
COMPARE = []
# Placeholder so the build validates while content is written; replace with the real sections.
CHEAT_SHEET = [{'heading': 'Placeholder B', 'points': ['Placeholder one', 'Placeholder two']}]
