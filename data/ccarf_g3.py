"""CCAR-F group 3: Domain 5 (Context Management and Reliability), category `context`.

Questions, lessons, games and cheat sheet for task statements 5.1-5.6 of the official Claude Certified
Architect - Foundations exam guide (version 1.0, effective July 2026). The flashcards for this category
live in data/ccarf_b1.py (f1114-f1160). Product facts were checked against the current Claude API,
Claude Code and Agent SDK documentation (October 2026). Group 3 ids: q1301.., msq1301.., tf1301..,
ml-ccarf-301.., seq-ccarf-301.., cmp-ccarf-301...
"""


def _mc(i, cat, question, options, correct, explanation):
    return {'id': i, 'cat': cat, 'type': 'mc', 'question': question, 'options': options, 'correct': correct, 'explanation': explanation}


def _ms(i, cat, question, options, correct, explanation):
    return {'id': i, 'cat': cat, 'type': 'ms', 'question': question, 'options': options, 'correct': correct, 'explanation': explanation}


def _tf(i, cat, question, answer, explanation):
    return {'id': i, 'cat': cat, 'type': 'tf', 'question': question, 'answer': answer, 'explanation': explanation}


_CX = 'context'

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
# QUESTIONS - task statement 5.1: manage conversation context to preserve critical information
# ---------------------------------------------------------------------------
QUESTIONS.extend([
    _mc('q1301', _CX,
        'A support agent summarizes the conversation every few turns to stay within budget. In a long refund chat, the early detail "refund of $84.50 for order A-7731, promised by Friday" has shrunk to "customer wants a refund", and the agent now asks the customer to repeat the amount. What is the best fix?',
        ['Instruct the summarizer to keep every important detail and never to shorten a sentence that contains a number or a date',
         'Summarize more often, so that each summary covers only a handful of turns and drops less detail from each one',
         'Move to a model with a larger context window so that long conversations rarely need summarizing at all',
         'Keep amounts, dates, order numbers and promises in a facts block sent with every prompt, apart from the summarized history'],
        3,
        'Each round of summarizing trades precision for brevity, so figures, dates and promises are the first things to blur. A case facts block holds those transactional facts exactly and puts them in every prompt, while the summary is free to stay loose. Asking the summarizer to be careful still leaves the facts inside a lossy process, summarizing more often means more rounds of loss, and a bigger window does not prevent compression once it happens (accuracy also falls as the context fills).'),
    _mc('q1302', _CX,
        'In a returns workflow, each lookup_order call returns about forty fields, but a return decision needs only the status, the item list, the amounts and the delivery date. After several lookups the agent loses track of earlier details and the cost per conversation is climbing. What is the best change?',
        ['Add a prompt rule telling the agent to ignore every order field that has no bearing on returns',
         'Cut each result down to the return-relevant fields in code before it is added to the conversation',
         'Raise max_tokens so that the long order records fit alongside the agent\'s replies',
         'Keep the full records and have the agent summarize the whole conversation after every lookup'],
        1,
        'A tool result stays in the conversation and is re-read on every later turn, so the cheapest tokens are the ones that never enter it. Filtering to the relevant fields in code (in the tool wrapper or a post-execution hook) cuts cost and distraction at the same time. An instruction to ignore fields leaves every token in place, max_tokens limits the length of the reply rather than the input, and summarizing after each lookup still ingests the whole record and adds a lossy step.'),
    _mc('q1303', _CX,
        'A synthesis agent receives about 30 pages of aggregated findings from five research subagents. Final reports keep leaving out findings that sit in the middle of the input, although the earlier and later sections are well covered. Which change addresses this best?',
        ['Put a short key-findings summary at the start and give each detailed section a clear header',
         'Ask for a longer final report so that every finding has room to appear in the output',
         'End the prompt with a line in capital letters telling the model not to skip the middle sections',
         'Order the sections by the time each subagent finished, so that the layout is the same every run'],
        0,
        'Models tend to use the start and end of a long input more reliably than the middle, so the fix is structural: surface the key findings where they will be read and make the rest navigable with explicit headers. A longer report does not make the model attend to material it overlooks, an emphatic sentence is still a prompt-wording hope, and finishing order is arbitrary, so it does not move important material to a well-read position.'),
    _mc('q1304', _CX,
        'A document-analysis subagent returns several paragraphs of narrative reasoning for each document. The synthesis agent has a limited context budget and runs out of room when it combines five of these results. What is the best way to fix this?',
        ['Cut every incoming result to its first 500 words before it reaches the synthesis agent, whatever it contains',
         'Raise max_tokens on the synthesis agent so that it can read and write at greater length when combining results',
         'Add another agent that rewrites each narrative as one shorter paragraph before synthesis begins',
         'Change the analysis subagent to return key facts, citations and relevance scores in a structured form'],
        3,
        'Fix the producer: when a downstream agent has a small budget, upstream agents should return compact structured data (facts, citations, relevance scores, with dates and source locations) instead of prose and reasoning chains. Cutting at 500 words discards whatever comes later, max_tokens bounds output rather than input, and an extra rewriting step adds one more lossy summary that strips figures and sources.'),
    _mc('q1305', _CX,
        'A customer disputes three separate orders in one long conversation. Near the end, the agent applies the refund amount from the second order to the third and misquotes a delivery date. Which design change best prevents this?',
        ['Keep a structured record for each issue (order ID, amount, status) as a separate context layer included in every prompt',
         'Merge the three disputes into one running narrative so that the agent sees a single coherent story',
         'Ask the customer to restate each order\'s details every few turns so that the agent can refresh its memory',
         'Drop the oldest turns once the customer moves on to the next order, so the context holds only the current dispute'],
        0,
        'In a multi-issue session the facts for each issue must stay separate and exact. A structured per-issue layer outside the running history works as a ledger the model can consult for each dispute. One merged narrative is exactly how details tangle, making customers repeat themselves is poor service and still leans on the transcript, and deleting old turns throws away facts that may be needed again, for example in a final summary.'),
    _ms('msq1301', _CX,
        'A synthesis agent must compare statistics reported by several subagents, and the subagents currently return only a paragraph of prose each. Which two additions to their structured output most help the synthesis agent interpret the figures correctly? (Choose two.)',
        ['The date each figure was published or collected, and where in the source it appears',
         'The subagent\'s full chain of reasoning behind each finding',
         'A note saying which subagent finished its work first',
         'The methodological context, such as the sample size and how the figure was measured',
         'A one-word label describing how confident the source sounds'],
        [0, 3],
        'Dates, source locations and methodological context let downstream synthesis tell a real disagreement from a difference in time, population or method. A reasoning chain adds bulk without helping comparison, finishing order says nothing about the data, and a tone label is not evidence about how a number was produced.'),
    _tf('tf1301', _CX,
        'Telling the model to ignore the irrelevant fields in a long tool result removes those fields from the context window.',
        False,
        'An instruction changes what the model attends to, not what is in the window. The unused tokens stay in the history and are processed again on every later turn, so large results should be trimmed in code before they are appended.'),
    _tf('tf1302', _CX,
        'Models tend to handle material at the start and end of a very long input more reliably than material in the middle, so a key-findings summary placed first and clear section headers can help.',
        True,
        'This position effect is why aggregated inputs should open with the key findings and organize the details under explicit headers. For long documents, the usual guidance is to put the material first and the question last.'),
    _tf('tf1303', _CX,
        'Because the Messages API keeps each conversation on the server, a follow-up request only has to contain the newest user message.',
        False,
        'The API is stateless: Claude knows only what each request contains. To keep a conversation coherent, the request must carry the earlier turns, including tool requests and their results, which is exactly why trimming and structuring what goes into the history matters.'),
])


# ---------------------------------------------------------------------------
# QUESTIONS - task statement 5.2: escalation and ambiguity resolution
# ---------------------------------------------------------------------------
QUESTIONS.extend([
    _mc('q1306', _CX,
        'A customer writes: "I have been charged twice. Please just transfer me to a person." The agent replies that it will first pull up the account and both transactions to see whether it can fix the problem. What should the agent have done?',
        ['Offered to resolve the duplicate charge and transferred the customer only if the request was repeated',
         'Checked the charges first, then transferred the customer if it could not refund the duplicate within a few steps',
         'Transferred the customer to a human agent right away, with a summary of what is already known',
         'Asked the customer to explain why a human is needed, so that it can judge whether a transfer is justified'],
        2,
        'An explicit request for a human is honored immediately: the customer has already made the decision, and investigating first or demanding a justification overrides it. The acknowledge-and-offer pattern is for frustration without such a request. Passing on what is already known keeps the handoff useful.'),
    _mc('q1307', _CX,
        'A customer writes: "This is the third time my parcel is late and I am furious." They do not ask for a person. Under the standard policy the agent can arrange a redelivery or a shipping credit. What is the best response?',
        ['Escalate to a human at once, because strongly negative sentiment is a reliable signal of a serious case that needs a person',
         'Process the standard credit quietly, without mentioning the customer\'s frustration, to keep the reply short',
         'Acknowledge the frustration, offer the redelivery or credit, and escalate only if the customer still wants a person',
         'Ask the customer whether they would like to be transferred to a person before doing anything else for them'],
        2,
        'Frustration alone is not a trigger. When the problem is within the agent\'s reach, acknowledging the feeling and offering a concrete fix resolves it, and a repeated wish for a human is honored at that point. Sentiment does not track difficulty, so escalating on tone sends solvable cases to people; ignoring the emotion is cold, and asking about a transfer first delays the fix.'),
    _mc('q1308', _CX,
        'The price-adjustment policy covers only price drops on the company\'s own site within 14 days of purchase. A customer asks the agent to match a cheaper listing from a competitor, a case the policy does not mention. What should the agent do?',
        ['Escalate to a human with the details, because the policy is silent on this request',
         'Decline the request, since the policy only authorizes adjustments to the company\'s own prices',
         'Grant the price match to keep the customer and record the exception for later review',
         'Ask for a screenshot of the competitor\'s listing and approve the match if it looks genuine'],
        0,
        'When the policy is silent or ambiguous about a request, the agent should not invent policy in either direction: a refusal and an approval are both improvised decisions. A gap, rather than mere difficulty, is the trigger for a human. Asking for a screenshot treats a missing rule as a verification problem.'),
    _mc('q1309', _CX,
        'The get_customer tool returns three accounts for the name "Maria Lopez". The agent picks the account with the most recent activity and begins processing a refund. Which change to the agent\'s instructions is best?',
        ['Rank the matches by order value and pick the account that is most likely to own the disputed order, then proceed',
         'Escalate to a human whenever more than one account matches a name, instead of trying to resolve it',
         'Choose the most recent account but tell the customer which one was used so that they can object',
         'Ask the customer for another identifier, such as an email address or order number, before continuing'],
        3,
        'Choosing among candidates by heuristic risks acting on the wrong person\'s account, which is far worse than one extra question. Asking for an additional identifier resolves the ambiguity cheaply. Ranking by order value is just another heuristic, objecting after the fact happens when the refund is already under way, and escalating turns a routine ambiguity into an unnecessary handoff.'),
    _mc('q1310', _CX,
        'A support lead proposes adding this rule to the escalation policy: "Escalate any message that contains three or more separate problems, because those cases are complex." How should the proposal be judged?',
        ['Adopt it, since complex cases carry the highest risk of mistakes and humans handle them best of all',
         'Drop it and escalate only on a customer request, a policy gap or a lack of progress',
         'Adopt it, but apply it only when the customer\'s tone is negative, to avoid unnecessary handoffs',
         'Adopt it, but skip the escalation whenever the agent reports high confidence in its own answer'],
        1,
        'Complexity by itself is not an escalation trigger: three routine problems can be resolved one by one and answered together. Escalation should follow an explicit request, a policy gap or inability to progress. Adding a tone condition or a self-reported confidence condition brings in two unreliable proxies for difficulty.'),
    _ms('msq1302', _CX,
        'Which three situations justify handing a case from the agent to a human? (Choose three.)',
        ['The customer asks to speak to a person.',
         'A sentiment score for the customer\'s latest message is strongly negative.',
         'The customer\'s request falls into a gap that the written policy does not address.',
         'The agent reports a confidence of 6 out of 10 in its own proposed answer.',
         'Repeated attempts have left the agent unable to make meaningful progress on the issue.'],
        [0, 2, 4],
        'The three sound triggers are an explicit request for a human, a policy gap or ambiguity, and inability to make progress. Detected sentiment and self-reported confidence are weak proxies: sentiment says little about how complex or risky a case is, and a model is often most confident on exactly the cases it gets wrong.'),
    _tf('tf1304', _CX,
        'A model\'s self-reported confidence score is a dependable signal for deciding which cases to escalate to a human.',
        False,
        'Self-reported confidence is poorly calibrated: models are often most confident on exactly the hard cases they get wrong. Escalation should follow explicit criteria (a customer request, a policy gap, inability to progress), and confidence becomes usable for routing only after it has been calibrated against labeled outcomes.'),
    _tf('tf1305', _CX,
        'An agent that has tried its available tools and still cannot make meaningful progress on a request should hand the case to a human, even if the customer has not asked for one.',
        True,
        'Inability to make progress is one of the sound escalation triggers; looping on a stuck request wastes the customer\'s time. The handoff should say what was tried and what is known.'),
])



# ---------------------------------------------------------------------------
# QUESTIONS - task statement 5.3: error propagation across multi-agent systems
# ---------------------------------------------------------------------------
QUESTIONS.extend([
    _mc('q1311', _CX,
        'A research coordinator receives two reports. The patent subagent says: "Query ran against the patent database; 0 matches." The regulatory subagent says: "Request to the regulatory database timed out after 30 seconds; no data returned." How should the coordinator treat them?',
        ['Treat both as "no information available", since neither source returned any data, and leave both sources out of the final report',
         'Treat the patent result as a real "nothing found" and the regulatory result as a gap needing a retry or another source',
         'Treat both as failures and rerun both subagents until each of them returns at least one result',
         'Treat both as successful searches, since neither subagent raised an unhandled exception in its code'],
        1,
        'A valid empty result is an answer: the source was reached and had nothing to offer. An access failure is missing information: the source was never reached, so absence cannot be concluded. Only when the two are reported differently can the coordinator choose well (retry, alternative source, or a coverage note if the gap remains). Merging them hides gaps, and forcing a result out of a legitimately empty search never ends.'),
    _mc('q1312', _CX,
        'A web-search subagent occasionally receives a brief 503 error from its search provider, and a retry a second later nearly always succeeds. How should the subagent handle this?',
        ['Report every such error to the coordinator immediately, so that the coordinator decides about every retry and every skip',
         'Retry locally with a short backoff, and report upward only if that fails, with the attempts and any partial results',
         'Retry without any limit until the call succeeds, so that the coordinator never has to see a failure of any kind',
         'Skip the query and return an empty result so that the research continues without any delay to the other agents'],
        1,
        'Transient failures are cheapest to fix where they happen. The subagent recovers locally and escalates only what it cannot resolve, with the attempts and partial results needed for a decision. Forwarding every blip floods the coordinator, endless retries can hang a run on a permanent fault, and an empty result silently suppresses the error.'),
    _mc('q1313', _CX,
        'Two of five planned sources, both paywalled journals, could not be accessed during a research run. The other three produced solid findings. How should the synthesized report handle this?',
        ['Present the findings as complete, since the missing journals would most likely have agreed with the three that were read',
         'Open every report with a general line saying that results may be incomplete, without naming any gaps',
         'Annotate coverage: mark which findings are well supported and which areas have gaps because sources were unavailable',
         'Withhold the report until every planned source has been reached, however long that takes, so nothing is partial'],
        2,
        'A coverage annotation lets readers rely on the strong sections and see exactly where the weak ones are. Presenting partial work as complete misleads, a boilerplate warning does not say which areas are affected, and refusing to deliver wastes the findings that are solid (and may wait forever on a source that stays unavailable).'),
    _mc('q1314', _CX,
        'A document-analysis subagent processes 40 PDFs. The 23rd file is corrupted and throws an exception; the orchestration code catches it at the top level and stops the whole research workflow, discarding 22 finished analyses. What is the best redesign?',
        ['Record a structured error for that file and carry on, so the coordinator can retry or note the gap',
         'Return an empty analysis for the corrupted file and mark it successful so that the workflow keeps going',
         'Retry the corrupted file in a loop until it parses, and only then continue with the remaining files',
         'Check all 40 files in advance and refuse to start the run unless every single one of them opens correctly'],
        0,
        'One bad input should not erase the value of the other 39. Containing the failure and reporting it as structured error context lets the coordinator decide what to do (retry, try an alternative extraction route, or skip with a note). An empty success hides the problem, a corrupted file will never parse however often it is retried, and demanding perfect inputs only moves the abort earlier.'),
    _mc('q1315', _CX,
        'A research report states that "no published studies exist" on a topic, yet a manual search finds plenty. The logs show that the search subagent timed out on every query and returned an empty list with the status "success". What is the right fix?',
        ['Tell the synthesis agent to double-check every empty result by running its own searches before it writes the report',
         'Raise the search timeout to two minutes so that queries are much less likely to fail in the first place, whatever the load',
         'Add a rule to the report template that forbids absolute claims such as "no studies exist"',
         'Return a timeout as a structured failure with the attempted query and partial results, not as an empty success'],
        3,
        'The defect is upstream: an access failure was reported as a valid empty result, so neither the coordinator nor the synthesis agent could know that anything had gone wrong. Fixing the report at its source makes recovery possible. Downstream verification duplicates work and still cannot tell failure from absence, a longer timeout only reduces how often the bug fires, and a template rule hides the symptom.'),
    _ms('msq1303', _CX,
        'A reviewer is auditing the error handling of a multi-agent research pipeline. Which two behaviors should be fixed because they weaken recovery? (Choose two.)',
        ['A subagent retries a transient timeout locally before it reports a failure',
         'A subagent returns an empty result marked as successful after its source timed out',
         'A failure report includes the attempted query and the partial results gathered so far',
         'A single failed subagent call terminates the whole workflow and discards the finished work',
         'The final report notes which topic areas lacked sources'],
        [1, 3],
        'Silent suppression hides that anything went wrong, and aborting on one failure throws away recoverable work; both remove the coordinator\'s ability to choose a sensible response. Local retries, informative failure reports and coverage notes are the recommended behaviors.'),
    _tf('tf1306', _CX,
        'A search that runs successfully and finds no matching documents should be reported to the coordinator as an error, so that the coordinator can retry the query.',
        False,
        'A valid empty result is a legitimate answer, not a failure. Reporting it as an error would trigger pointless retries and blur it with real access failures such as timeouts. The two outcomes should be distinguishable.'),
    _tf('tf1307', _CX,
        'A subagent should handle transient failures such as brief timeouts itself and propagate only the errors it cannot resolve.',
        True,
        'Local recovery keeps the coordinator focused on decisions that need its wider view. What does travel upward should include what was attempted and any partial results.'),
])


# ---------------------------------------------------------------------------
# QUESTIONS - task statement 5.4: manage context in large codebase exploration
# ---------------------------------------------------------------------------
QUESTIONS.extend([
    _mc('q1316', _CX,
        'Three hours into mapping a legacy accounting system, an agent starts to answer with lines like "a typical layered design would put posting logic in a service class" instead of naming the LedgerPostingService it found in the first hour. What is the best way to counter this?',
        ['Have the agent record key findings (class names, paths, call chains) in a scratchpad file and reread it when needed',
         'Add a reminder to every question telling the agent to name specific classes instead of typical patterns and to be precise',
         'Start a fresh conversation for each new question and let the agent rediscover the code every single time it is asked',
         'Switch to a model with a larger context window so that the early discoveries stay in range for the rest of the session'],
        0,
        'In long sessions, early specifics blur into generic patterns. A scratchpad moves the key findings outside the window, where they can be reread exactly whenever a question needs them. A reminder cannot restore details the model no longer uses reliably, restarting throws away hours of discovery, and a larger window does not stop recall from degrading as the context fills.'),
    _mc('q1317', _CX,
        'In a repository with thousands of files, an engineer asks the main agent to find every test file and then to trace the dependencies of the refund flow. The raw search output is filling the main conversation. What is the most effective approach?',
        ['Run the searches in the main conversation and clear it with /clear once the answer has been found and noted',
         'Cap every search at its first twenty matches so that the output stays small enough for the main conversation',
         'Delegate each question to a subagent whose verbose output stays in its own context, returning only a summary',
         'Tell the agent to remember only the file names and to forget the rest of each result as soon as it has read it'],
        2,
        'A subagent works in a separate context window, so the bulky reads never reach the main conversation; the main agent keeps the high-level picture and receives a compact answer. Clearing discards the findings, a twenty-match cap can miss files, and an instruction to forget has no mechanism behind it.'),
    _mc('q1318', _CX,
        'A codebase review runs in two phases. In phase one, subagents map the modules and their dependencies. In phase two, a new set of subagents will examine the riskiest modules in depth. How should the phase-two agents benefit from phase one?',
        ['Rely on the phase-two agents to inherit the phase-one conversation automatically',
         'Have the phase-two agents rediscover the structure themselves so that their conclusions stay independent',
         'Pass the complete phase-one transcripts to every agent so that nothing is left out',
         'Summarize the key findings of phase one and place that summary in each phase-two agent\'s starting prompt'],
        3,
        'Subagents start with an empty context, so earlier findings must be put in their prompt. A concise summary of what phase one learned avoids both rediscovery and the cost of dragging whole transcripts forward. Automatic inheritance does not exist, rediscovery is slow and duplicative, and full transcripts bring back the verbosity that delegation was meant to keep out.'),
    _mc('q1319', _CX,
        'A multi-agent analysis of a large codebase crashes four hours in. When restarted, the coordinator begins from scratch and repeats all the earlier work. Which design best supports recovery?',
        ['Increase the timeout of every agent in the system so that long-running work is much less likely to crash before it has finished',
         'Have each agent export state to a known location; on resume the coordinator loads a manifest and injects the state',
         'Keep all agent state in memory and rely on the model to recall the earlier progress after a restart, however long ago it was made',
         'Store the raw transcript of every agent and replay all of them into one prompt on restart so nothing is missing'],
        1,
        'Recovery needs durable, structured state outside any agent\'s memory: each agent writes its state to an agreed place, and the coordinator reads a manifest to learn what is finished and what remains, then injects the relevant state into the resumed agents. Longer timeouts only postpone failure, in-memory state is lost in a crash, and replaying raw transcripts is huge and would refill the context with the very bulk that caused trouble.'),
    _mc('q1320', _CX,
        'During a long Claude Code session exploring a payments module, the context is filling with verbose discovery output and replies are becoming less precise. The engineer wants to keep working on the same task. What is the best action?',
        ['Run /clear and ask Claude to explore the module again from the start, so that the context is clean',
         'Run /compact with a focus on the payment classes and call paths, then keep going in the same session',
         'Paste the conversation so far into a new session so that nothing is lost, then continue the exploration there',
         'Keep working until automatic compaction runs, and accept whatever it decides to keep from the session so far'],
        1,
        '/compact summarizes the session so far and continues it, freeing space, and a focus instruction steers the summary toward what you still need. /clear discards the conversation and forces rediscovery, pasting the transcript into a new session recreates the bloat, and waiting leaves the choice of what to keep to the automatic pass.'),
    _ms('msq1304', _CX,
        'An agent built directly on the Claude API runs long, tool-heavy tasks, and stale tool results are filling its context window. Which two features directly help manage that growth? (Choose two.)',
        ['Prompt caching, which stops cached tokens from counting toward the context window',
         'Context editing\'s tool result clearing, which removes the oldest tool results once a threshold is passed',
         'Server-side compaction, which replaces earlier turns with a summary so that the conversation can continue',
         'Raising max_tokens, which enlarges the room available for the conversation history',
         'Strict tool use, which keeps the output of each tool smaller'],
        [1, 2],
        'Tool result clearing removes stale tool output by rule, and server-side compaction (currently in beta) replaces older turns with a model-written summary. Prompt caching changes what repeated prefixes cost, but cached tokens still occupy the window; max_tokens limits the length of a reply, not the room for history; and strict tool use guarantees schema-valid tool inputs without shrinking anything.'),
    _ms('msq1305', _CX,
        'A developer plans a long Claude Code session and expects to use /compact. Which two statements about compaction are accurate? (Choose two.)',
        ['Optional focus instructions steer what the summary keeps',
         'Instructions given only in a chat message are guaranteed to survive word for word',
         'Compaction deletes the conversation and starts again with an empty context',
         'The project-root CLAUDE.md is re-read from disk afterward, so its instructions keep applying',
         'Every file the session read is restored in full, exactly as it was'],
        [0, 3],
        'A focus such as "/compact focus on the auth bug fix" tells the summarizer what matters, and the project-root CLAUDE.md is re-injected from disk, which is why standing instructions belong there rather than in a one-off message. Chat-only instructions are summarized like the rest of the conversation, deleting everything is what /clear does, and only a few recently modified files are re-read after compaction.'),
    _tf('tf1308', _CX,
        'A subagent that investigates a question should return its full raw search output to the main agent so that no detail is lost.',
        False,
        'The point of delegation is to keep verbose exploration output inside the subagent\'s own context. The main agent should receive a concise, structured summary, which leaves its window free for coordination.'),
    _tf('tf1309', _CX,
        'In Claude Code, /compact summarizes the conversation so far and continues the same session, whereas /clear starts again with an empty context.',
        True,
        'Compaction frees space while keeping a summary of the work; clearing discards the conversation, which suits unrelated tasks or a restart after repeated failed corrections.'),
])



# ---------------------------------------------------------------------------
# QUESTIONS - task statement 5.5: human review workflows and confidence calibration
# ---------------------------------------------------------------------------
QUESTIONS.extend([
    _mc('q1321', _CX,
        'An invoice-extraction pipeline reports 97% field accuracy across all documents, and management wants to drop human review. A breakdown shows 99% on typed invoices (80% of volume), 96% on scanned receipts (15%) and 68% on handwritten forms (5%). What is the best next step?',
        ['Remove review everywhere, since 97% exceeds the target and the weak segment is only 5% of the volume',
         'Automate the segments that meet the target and keep human review for the weak one while it improves',
         'Keep human review for all documents until overall accuracy reaches 100%, because anything less is a risk',
         'Take a random sample of 3% of all documents and decide from the overall error rate that sample shows'],
        1,
        'An overall figure averages away weak segments, so accuracy has to be validated by document type and field before review is reduced. Segments that pass can be automated while the failing one stays under review. Dropping review everywhere would let about a third of handwritten forms through wrong, demanding perfection is impractical, and a flat random sample is dominated by easy typed invoices, so it would barely see the problem.'),
    _mc('q1322', _CX,
        'A team auto-approves every extraction with a confidence above 0.9 and no longer reviews them. Three months later a supplier changes its invoice layout, and the resulting errors go unnoticed until a customer complains. Which practice would have caught the problem earlier?',
        ['Review every extraction rated above 0.9 as well, so that nothing in the pipeline is automated any more',
         'Lower the auto-approval threshold from 0.9 to 0.8 so that a larger share of documents is reviewed by people',
         'Review a stratified random sample of the auto-approved extractions every week and track errors by segment',
         'Ask the model to explain, for every extraction it approves, why it is confident in the values it extracted'],
        2,
        'Automation removes the checking that would reveal a new failure pattern. Regular stratified random sampling of high-confidence outputs keeps measuring their true error rate by segment, such as supplier or document type, and surfaces new patterns like a layout change. Reviewing everything defeats the purpose of automating, a lower threshold still trusts the model\'s confidence on layouts it misreads, and a self-explanation is not an independent measurement.'),
    _mc('q1323', _CX,
        'An extraction prompt now asks the model to report a confidence score for each field. How should the team choose the thresholds that decide which fields go to human review?',
        ['Use 0.9 for every field, because that is the conventional cut-off for high confidence in extraction work',
         'Ask the model to justify its scores and set each threshold where the justification sounds convincing enough',
         'Copy the thresholds from another team\'s pipeline, since confidence scores mean the same thing everywhere',
         'Calibrate against a labeled validation set and set thresholds from how often each field is right at each level'],
        3,
        'A raw score is only the model\'s opinion. It becomes a routing signal once it is checked against labeled data: if fields scored 0.9 are right nine times in ten, then 0.9 means something. A conventional cut-off, a persuasive justification and borrowed thresholds all skip that measurement, and scores differ by model, prompt, field and document mix.'),
    _mc('q1324', _CX,
        'Reviewers can check about 500 extractions per day, but 1,200 land in the review queue. Which prioritization makes the best use of reviewer time?',
        ['Review in order of arrival until the day\'s capacity is used, so that no document waits longer than another',
         'Review the lowest calibrated confidence first, with documents whose sources conflict or are ambiguous',
         'Review a random 500 each day, so that every document has an equal chance of being checked by a person',
         'Review the largest documents first, since they contain the most fields that could be wrong in them'],
        1,
        'With limited capacity, reviewers should see the extractions most likely to be wrong first: low calibrated confidence, or ambiguous or contradictory source documents. Arrival order and random selection ignore risk, and size is a weak proxy for it. A separate stratified sample of confident outputs still runs alongside to catch what the scores miss.'),
    _mc('q1325', _CX,
        'Two documents attached to the same insurance claim state different dates of loss. The extraction model outputs one of the dates with a confidence of 0.96. What should the pipeline do?',
        ['Accept the date, since 0.96 is above the review threshold and the pipeline can send the claim straight on',
         'Reject the claim automatically and ask the customer to resubmit documents that are consistent with each other',
         'Route the claim to human review, because the sources contradict each other whatever the confidence',
         'Keep the date from the document that was uploaded most recently, as it is probably the corrected one'],
        2,
        'Contradictory or ambiguous sources belong with a person: a high score cannot settle a disagreement between documents, and choosing either date is a guess. Accepting by score, choosing by upload time or rejecting automatically each skip the human judgement that the conflict needs.'),
    _ms('msq1306', _CX,
        'A team wants to know whether it is safe to expand the automated acceptance of extractions. Which two measures give the most reliable evidence? (Choose two.)',
        ['A single overall accuracy figure computed across every document',
         'Accuracy broken down by document type and by field on a labeled set',
         'Accuracy measured only on the extractions that the model scored as low confidence',
         'The model\'s own written assessment of how reliable its extractions have been',
         'Ongoing review of stratified random samples of the high-confidence extractions'],
        [1, 4],
        'Per-segment accuracy reveals the weak document types and fields that an average hides, and ongoing stratified sampling measures the true error rate among the outputs that automation no longer checks while exposing new patterns. An overall figure masks weak segments, sampling only low-confidence items says nothing about the confident ones being accepted, and self-assessment is not independent evidence.'),
    _tf('tf1310', _CX,
        'A 97% overall accuracy figure shows that every document type and every field is also close to 97% accurate.',
        False,
        'An overall number is an average weighted by volume, so a large, easy segment can hide a small, weak one. Accuracy has to be checked by document type and field before human review is reduced.'),
    _tf('tf1311', _CX,
        'Stratified random sampling draws samples separately from each segment, such as each document type, so that small segments are represented in the measurement of error rates.',
        True,
        'Sampling within each stratum guarantees that rare but important segments are checked, which a single pooled random sample might skip. It supports ongoing error-rate measurement and the detection of new failure patterns.'),
])


# ---------------------------------------------------------------------------
# QUESTIONS - task statement 5.6: information provenance and uncertainty in multi-source synthesis
# ---------------------------------------------------------------------------
QUESTIONS.extend([
    _mc('q1326', _CX,
        'Two credible sources report different 30-day readmission rates for heart-failure patients: a national registry says 21% and an insurer\'s claims analysis says 24%. What should the synthesis agent do?',
        ['Report the registry\'s figure alone, because registries are generally regarded as more authoritative sources',
         'Report the average, 22.5%, as the best single estimate of the true readmission rate for these patients',
         'Report both figures, each labeled with its source and, if known, its method, and flag that they differ',
         'Leave the statistic out of the report altogether, because the sources disagree about what the rate is'],
        2,
        'When credible sources conflict, the honest output keeps both values with attribution, so the reader can weigh them; differences often come from definitions, populations or years. Silently choosing one hides the disagreement, an average is a number that no source reported, and omitting the statistic discards useful evidence.'),
    _mc('q1327', _CX,
        'A synthesis agent flags a "contradiction": one source says 12% of firms use a technology, another says 31%. The 12% figure comes from a 2021 survey and the 31% figure from a 2025 survey, but the subagents\' outputs did not show dates. Which change best prevents false contradictions like this?',
        ['Require subagents to include the publication or data-collection date in each structured finding',
         'Instruct the synthesis agent to always prefer the most recent figure and ignore older ones',
         'Have each subagent settle disagreements with the other subagents before returning its findings',
         'Tell the synthesis agent never to describe any difference between sources as a contradiction'],
        0,
        'Without dates, a change over time looks like a conflict. With a date on every finding, the synthesis agent can present the figures as a trend, 12% in 2021 and 31% in 2025. Always preferring the newest figure hides that trend, subagents work in isolation and cannot see each other\'s findings, and banning the word contradiction would also hide real conflicts.'),
    _mc('q1328', _CX,
        'To fit a downstream budget, an intermediate agent condenses 60 findings into 15 bullets. Three of the findings made the same claim, each from a different report. Which representation of the merged claim best preserves provenance?',
        ['The claim once, with a note that three sources agree',
         'The claim once, with the source of only the first finding, to keep the bullet short',
         'The claim once, with no sources, because corroboration makes citations unnecessary',
         'The claim once, with all three source URLs and a supporting excerpt from each'],
        3,
        'Claim-source mappings must be preserved and merged when findings are combined: the merged record keeps every source and its excerpt, so each can be audited and the corroboration is visible. A bare count cannot be traced, one source throws away the other two, and dropping sources removes the very thing that makes a claim checkable.'),
    _mc('q1329', _CX,
        'A final report covers 20 findings. Twelve are supported by several agreeing sources, and eight involve sources that disagree on method or numbers. How should the report be structured?',
        ['Rank all 20 findings in one list by publication date, newest first, so that readers see recent work at the top',
         'Include only the twelve established findings so that the report speaks with one clear and confident voice',
         'Present all 20 in a single list and add hedging words such as "some say" to each of the disputed ones',
         'Separate established from contested findings, keeping each source\'s own characterization and methods'],
        3,
        'Separating established from contested findings shows readers where confidence is high and where it is not, and keeping the sources\' own wording and methods lets them weigh the disagreement. A date-ordered list mixes the two, omitting the contested eight conceals the uncertainty, and hedging words do not say who disagrees or why.'),
    _mc('q1330', _CX,
        'A synthesis agent converts everything it finds into bullet points. Quarterly revenue figures for four companies become hard to compare, and a news story loses its narrative thread. What is the best fix?',
        ['Render each type in its natural form: financial data as tables, news as prose, technical findings as structured lists',
         'Present all content as tables, because tables are the most precise way to show any kind of information to a reader',
         'Present all content as continuous prose, so that the whole report reads as a single coherent narrative from start to end',
         'Output everything as JSON and leave the decision about how to display it to a downstream formatter at a later stage'],
        0,
        'Different kinds of content carry their information differently, so forcing one uniform format destroys some of it. Tables suit comparisons of numbers, prose suits narrative, and structured lists suit technical points. A single table format flattens stories, prose buries numbers, and passing the decision to a hypothetical formatter leaves the problem unsolved.'),
    _ms('msq1307', _CX,
        'A document-analysis subagent finds two different values for the same metric in two reports. Which two actions fit the recommended pattern? (Choose two.)',
        ['Include both values in its structured output, each annotated with its source and date',
         'Keep only the value from the report with more pages, since it is probably more thorough',
         'Let the coordinator decide how to reconcile the values before the findings go to synthesis',
         'Average the two values and report the result as the finding',
         'Leave the metric out entirely, since the reports disagree'],
        [0, 2],
        'The analysis agent reports the conflict openly, with both values annotated; the coordinator, which sees the whole task, decides how to reconcile it before synthesis. Picking by page count, averaging and omitting the metric each resolve the disagreement silently, on weak grounds, or by throwing the evidence away.'),
    _tf('tf1312', _CX,
        'When two credible sources give different figures for the same statistic, the synthesis step should choose one value so that the report reads cleanly.',
        False,
        'Silently choosing hides a real disagreement. The report should keep both values, annotate each with its source (and method or date where known), and let the reader or coordinator reconcile them.'),
    _tf('tf1313', _CX,
        'Requiring publication or data-collection dates in subagents\' structured outputs helps the synthesis step tell a real conflict from a change over time.',
        True,
        'A statistic that moved between 2021 and 2025 describes a trend, not a contradiction. Dates on every finding let the synthesis step interpret differences correctly.'),
])



# ---------------------------------------------------------------------------
# LESSONS - Domain 5 (context): task statements 5.1-5.6
# ---------------------------------------------------------------------------
LESSONS.extend([
    {
        'id': 'context-facts-escalation-and-errors',
        'title': 'Context Facts, Escalation and Error Reports',
        'summary': "Covers task statements 5.1, 5.2 and 5.3: keeping exact facts alive in long conversations, trimming and ordering what enters the context window, when an agent should hand a case to a human, and how failures travel from subagents to a coordinator.",
        'diagram': None,
        'vocabIds': ['f1114', 'f1115', 'f1116', 'f1118', 'f1124', 'f1125', 'f1127', 'f1132', 'f1133'],
        'quizIds': ['q1301', 'q1302', 'q1306', 'q1308', 'q1311', 'q1314'],
        'reading': (
            "This lesson covers task statements 5.1 to 5.3. Everything Claude knows during a task sits in its context window: instructions, conversation, tool results and pasted documents. It is working memory, and more is not automatically better: accuracy and recall slip as it fills (context rot). The Messages API is also stateless, so every request must carry the history, or the agent forgets.\n\n"
            "The first danger is progressive summarization. Long support chats are compressed to fit the budget, and each round trades precision for brevity: \"refund of $84.50 for order A-7731, promised by Friday\" becomes \"customer wants a refund\", and the agent can no longer keep the promise. The cure is a case facts block, a short structured list of amounts, dates, order numbers, statuses and the customer's stated expectations, placed in every prompt outside the summarized history. With three disputed orders in one chat, keep one record per issue so that figures never mix. Summarize the talk, never the numbers.\n\n"
            "The second danger is bulk. A lookup_order call may return forty fields when a return decision needs five. That result is re-read on every later turn, so trim it in code (in the tool wrapper or a post-execution hook); telling the model to ignore the other fields leaves the tokens in place. Position matters too: models read the start and end of a very long input more reliably than the middle, so open an aggregated input with a key-findings summary, give each section a clear header, and put long documents before the question. If a downstream agent has a small budget, change the producer: upstream agents return key facts, citations and relevance scores, with dates and source locations, not prose.\n\n"
            "Task statement 5.2 asks when an agent should hand over. Three triggers are sound: the customer asks for a human, the policy is silent or ambiguous about the request (a competitor price match, when the policy covers only own-site prices), and the agent cannot make meaningful progress. A request for a person is honored at once, without investigating first. Mere frustration is different: if the problem is within reach, the agent acknowledges the feeling, offers the fix, and escalates only if the customer then asks for a person. Sentiment and self-reported confidence are poor triggers: anger does not mean difficulty, and models are often most sure when wrong. Write explicit criteria with examples of both outcomes into the system prompt; if a lookup returns several matches, ask for another identifier.\n\n"
            "Task statement 5.3 follows a failure through a multi-agent system. A subagent that meets a transient error such as a timeout retries locally and reports upward only what it cannot fix, as structured context: the failure type, the query attempted, any partial results and possible alternatives, so the coordinator can retry, switch source or carry on. Keep two outcomes apart: an access failure (the database never answered) and a valid empty result (it answered and found nothing). Two anti-patterns recur: silent suppression (an empty list passed off as success, so a gap looks like a finding) and aborting the whole workflow over one failed step. The final report marks which areas are well supported and which have gaps because a source was unavailable."
        ),
        'fundamentalsLabel': 'New to context management? See the everyday analogy',
        'fundamentals': "Picture a hotel front-desk clerk who works a long shift with only a small notepad. At the end of each hour she rewrites it as short notes, and over the day \"Mr. Okafor wants the 6:30 airport taxi charged to his room\" shrinks to \"guest needs a taxi\". A smarter clerk keeps a separate card per guest with room number, amounts and promised times, and never rewrites the cards. She knows which requests she may grant herself, passes on at once any guest who asks for the manager, and calls the manager when a request falls outside the hotel's written rules. When the kitchen line is dead she does not tell a guest that no food exists; she says the kitchen cannot be reached and offers alternatives.",
        'keyTerms': ['Progressive summarization risk', 'Case facts block', 'Tool output trimming', 'Lost in the middle', 'Escalation triggers', 'Policy-gap escalation', 'Ambiguous-match clarification', 'Structured error context', 'Valid empty result versus access failure'],
        'commonTraps': [
            "A bigger context window, more frequent summaries or a \"be careful\" instruction does not stop summarization from blurring exact figures; keep the facts in a block that is never summarized.",
            "Telling the model to ignore fields leaves the tokens in the window; trim the tool result in code before it is appended.",
            "An explicit request for a human is honored at once, whereas plain frustration earns an acknowledgment and an offer first; sentiment, self-reported confidence and mere complexity are not escalation triggers.",
            "An empty result marked as success after a timeout, and aborting everything after one failed step, are both anti-patterns; return structured error context and let the coordinator decide.",
        ],
        'scenario': "A retailer's support agent handles a customer who disputes three orders in one chat. A facts block records each order's ID, amount, status and promised delivery date, trimmed from forty-field lookup results to five fields. When the customer asks for \"a real person\" about the second order, the agent transfers at once with those facts. In the nightly research pipeline, a subagent that times out on a pricing database retries twice, then reports the failure type, the query and the partial results, and the final report marks pricing coverage as incomplete.",
        'onTheJob': "Decide what is a fact and what is conversation before you build anything: facts (amounts, dates, IDs, statuses, promises) go into a structure you rebuild from tool results, and only the talk may be summarized. Measure how many tokens each tool returns and trim the biggest offenders first; one noisy lookup often accounts for most of the growth. Write escalation criteria from real transcripts, including cases that should not escalate, and review a sample of both outcomes every month. Give every subagent a standard error shape so the coordinator never has to guess whether silence means nothing found or could not look.",
    },
    {
        'id': 'long-sessions-human-review-and-provenance',
        'title': 'Long Sessions, Human Review and Provenance',
        'summary': "Covers task statements 5.4, 5.5 and 5.6: keeping a long codebase exploration coherent with scratchpads, subagents, manifests and compaction, designing human review with calibrated confidence and sampling, and preserving sources and dates through multi-source synthesis.",
        'diagram': None,
        'vocabIds': ['f1137', 'f1138', 'f1139', 'f1141', 'f1142', 'f1149', 'f1151', 'f1154', 'f1156'],
        'quizIds': ['q1316', 'q1319', 'q1321', 'q1322', 'q1326', 'q1327'],
        'reading': (
            "This lesson covers task statements 5.4, 5.5 and 5.6. They share one theme: keeping an agent system trustworthy when the work is long, the volume is high and the answer is assembled from many sources.\n\n"
            "In a long exploration of an unfamiliar codebase, context degrades. Hours in, the agent gives inconsistent answers and talks about \"typical patterns\" instead of the actual classes it found at the start. Four habits counter this. A scratchpad file: the agent writes key findings (class names, paths, call chains) to a notes file and rereads it when a later question needs them. Delegation: a narrow question such as \"find every test file\" goes to a subagent, whose verbose output stays in its own context while only a summary returns. Phase summaries: subagents inherit nothing, so the findings of one phase are summarized into the starting prompt of the next. Recoverable state: each agent exports its state to a known place and the coordinator loads a manifest on resume, so a crash does not mean starting over. In Claude Code, /compact summarizes the session and keeps going (add a focus, such as /compact focus on the payment module), while /clear starts empty. For agents you build on the API, server-side compaction (beta) summarizes older turns, tool result clearing drops the oldest stale tool results, and the memory tool lets Claude keep files in a /memories directory that your application controls.\n\n"
            "Task statement 5.5 puts people in the loop. An extraction pipeline can report 97% accuracy overall and still get only 68% on handwritten forms, because a big easy segment drowns out a small hard one. Before reducing review, measure accuracy by document type and by field, and automate only the segments that pass on their own. Have the model output a confidence score per field, then calibrate: run a labeled validation set, check how often each confidence level was right, and set review thresholds from those rates. A raw score is not a probability. Send low-confidence fields, and documents whose sources conflict or are ambiguous, to reviewers first, since their time is limited. Keep checking the confident ones too: a weekly stratified random sample from each segment measures the true error rate and catches new problems, such as a supplier's new template.\n\n"
            "Task statement 5.6 protects provenance, the trail from a claim back to its source. Attribution disappears when findings are summarized without their sources, so subagents return claim-source mappings (the claim, the URL or document name, a short excerpt and the publication or collection date), and every later step preserves and merges them: if three findings make the same claim, the merged record lists all three sources. When credible sources disagree, say 21% versus 24% for a readmission rate, keep both values with source, method and date, and let the coordinator decide how to reconcile them; do not pick one or average. Dates often dissolve a conflict, since a 2021 figure and a 2025 figure may describe a trend. Finally, structure the report to separate well-established findings from contested ones, keep the sources' own wording about methods, and render each kind of content naturally: financial figures as tables, news as prose, technical findings as structured lists."
        ),
        'fundamentalsLabel': 'New to long-running agents? See the everyday analogy',
        'fundamentals': "A detective working a case for weeks keeps an evidence board and a case notebook, because memory fades and key facts belong on the board. For a narrow question, such as who bought a ticket that night, she sends a junior colleague, who comes back with one page rather than a box of receipts. If the office floods, the filing system shows which boxes were already examined, so work resumes where it stopped. The captain does not close the case because 97 percent of the paperwork checked out; she asks which kinds of paperwork were wrong, and pulls a few certain-looking files at random to be sure. In the final report every claim carries its source and date, and when two witnesses disagree, both statements appear.",
        'keyTerms': ['Context degradation', 'Scratchpad file', 'Exploration subagent delegation', 'Crash-recovery manifest', '/compact command', 'Stratified random sampling', 'Confidence calibration', 'Claim-source mapping', 'Conflict annotation'],
        'commonTraps': [
            "An overall accuracy of 97% says nothing about each document type or field; validate the segments separately before reducing review.",
            "A raw confidence score needs calibration against labeled data before it can route review, and sampling only the low-confidence items never reveals errors among the confident ones.",
            "Subagents inherit nothing: findings from an earlier phase must be summarized into their prompts, and a long multi-agent run needs a manifest to resume.",
            "Choosing one of two conflicting figures, or averaging them, silently destroys evidence; keep both with source and date and let the coordinator reconcile.",
        ],
        'scenario': "An engineering team maps a million-line billing system with a coordinator and five exploration subagents. Each agent writes findings to a notes file and exports its state to a manifest; when the run crashes on day two, the coordinator loads the manifest and injects the saved state into the agents that must continue. Their invoice extractor reports 97% overall, but a per-type breakdown shows handwritten forms at 68%, so those stay under review while a weekly stratified sample audits the auto-approved rest. The research summary lists both a 21% and a 24% readmission rate, each with its source and year.",
        'onTheJob': "Treat the scratchpad as part of the design, not an afterthought: agree a file name and a simple structure (finding, file, evidence) and require agents to update it as they learn. Prefer several narrow subagent questions over one broad one, and ask for short structured answers. For review, build the labeled validation set before the dashboard, track accuracy per segment from the first day, and schedule sampling as a recurring job so that it survives a busy quarter. For research output, make claim, source, excerpt and date required fields in the schema the subagents return, so that a missing citation fails validation instead of reaching the report.",
    },
])



# ---------------------------------------------------------------------------
# MADLIBS
# ---------------------------------------------------------------------------
MADLIBS.extend([
    {
        'id': 'ml-ccarf-301', 'cat': _CX,
        'scenario': 'Exact amounts, dates and order numbers belong in a {b1} that is sent with every prompt, apart from the summarized history, because repeated {b2} turns precise figures into vague phrases. Models read the {b3} of a very long input more reliably than the middle, so aggregated findings should open with a key-findings summary.',
        'blanks': [
            {'key': 'b1', 'options': ['sentiment score', 'case facts block', 'tool description'], 'correct': 1},
            {'key': 'b2', 'options': ['validation', 'caching', 'summarization'], 'correct': 2},
            {'key': 'b3', 'options': ['beginning and end', 'middle third', 'longest sections'], 'correct': 0},
        ],
        'explanation': 'A case facts block keeps transactional facts exact in every prompt, because each round of summarization trades precision for brevity. Because models handle the start and end of a long input better than the middle, key findings go first and the detailed sections get explicit headers.',
    },
    {
        'id': 'ml-ccarf-302', 'cat': _CX,
        'scenario': 'A timeout is an {b1} failure, whereas a query that ran and found nothing is a valid {b2} result. When credible sources disagree, the synthesis presents {b3}, each labeled with its source.',
        'blanks': [
            {'key': 'b1', 'options': ['access', 'empty', 'validation'], 'correct': 0},
            {'key': 'b2', 'options': ['partial', 'empty', 'error'], 'correct': 1},
            {'key': 'b3', 'options': ['the larger value', 'the average', 'both values'], 'correct': 2},
        ],
        'explanation': 'An access failure means the source was never reached, so absence cannot be concluded; a valid empty result means the source answered with nothing. The coordinator needs the two reported differently. Conflicting credible values are kept side by side with their sources instead of being replaced by a choice or an average.',
    },
])


# ---------------------------------------------------------------------------
# SEQUENCES
# ---------------------------------------------------------------------------
SEQUENCES.extend([
    {
        'id': 'seq-ccarf-301', 'cat': _CX,
        'prompt': 'Order the steps of recovering a long multi-agent codebase analysis after a crash, using a manifest.',
        'steps': [
            'Each agent exports its state to a known location as it completes work',
            'The run is interrupted and the coordinator restarts',
            'The coordinator loads the manifest of exported agent states',
            'The coordinator works out which agents finished and which work remains',
            'The saved state is injected into the prompts of the agents that must continue',
            'The resumed agents carry on with the remaining work only',
            'The coordinator merges the earlier and the new results into the final output',
        ],
        'explanation': 'State must be written before the crash, in a place that outlives any single agent. On resume the coordinator reads the manifest, decides what is left and injects the saved state into the resumed agents, because subagents start with an empty context. Only the remaining work is repeated, and the results are merged at the end.',
    },
    {
        'id': 'seq-ccarf-302', 'cat': _CX,
        'prompt': 'Order the steps of building confidence-based human review for an extraction pipeline.',
        'steps': [
            'Have the model output a confidence score for each extracted field',
            'Run the extractor on a labeled validation set',
            'Compare the scores with the actual accuracy by document type and field',
            'Set review thresholds from the accuracy observed at each confidence level',
            'Route low-confidence fields and conflicting source documents to human reviewers',
            'Review stratified random samples of the high-confidence extractions',
            'Use the sample results to spot new error patterns and adjust the thresholds',
        ],
        'explanation': 'Scores are only an opinion until they are checked against labeled data, so calibration comes before routing. Once thresholds exist, reviewers see the doubtful items first, and continuing stratified sampling of the confident ones measures the true error rate and feeds back into the thresholds.',
    },
])


# ---------------------------------------------------------------------------
# COMPARE
# ---------------------------------------------------------------------------
COMPARE.extend([
    {
        'id': 'cmp-ccarf-301', 'cat': _CX,
        'scenario': 'A customer writes: "Honestly, get me a real person, I am done with chatbots." The issue is a simple address change that the agent could handle. Which response is better?',
        'optionA': 'Transfer the customer to a human agent immediately, passing along a summary of what is already known.',
        'optionB': 'Acknowledge the frustration and offer to complete the address change in one step, since the problem is simple.',
        'better': 'A',
        'why': 'An explicit request for a human is honored at once, however easy the issue is. The offer is tempting because the fix really is simple, and it is the right pattern when a customer is only frustrated; here it overrides what the customer asked for.',
    },
    {
        'id': 'cmp-ccarf-302', 'cat': _CX,
        'scenario': 'An agent must map a repository with thousands of files before a refactor, and answer follow-up questions for several hours. Which approach to context is better?',
        'optionA': 'Let the main agent read everything itself in one session and rely on automatic compaction to make room.',
        'optionB': 'Send narrow questions to subagents that return short summaries, and keep key findings in a scratchpad file.',
        'better': 'B',
        'why': 'Delegation keeps bulky reads out of the main window, and the scratchpad keeps findings exact, which counters the drift toward generic answers in long sessions. Relying on compaction alone is tempting because it is automatic, but a summary of hours of raw reading loses the specific classes and paths that later questions need.',
    },
    {
        'id': 'cmp-ccarf-303', 'cat': _CX,
        'scenario': 'A team wants to cut human review of invoice extractions. Which evidence should they rely on before doing so?',
        'optionA': 'Accuracy by document type and field on a labeled set, plus ongoing stratified samples of the confident extractions.',
        'optionB': 'One overall accuracy figure above the target, checked on a random sample drawn from all invoices together.',
        'better': 'A',
        'why': 'Segment-level results show which document types and fields are safe to automate, and continuing stratified sampling catches new patterns after review is reduced. A single pooled figure is tempting because it is simple and often high, but it is dominated by the largest, easiest segment and hides the weak ones.',
    },
])


# ---------------------------------------------------------------------------
# CHEAT SHEET
# ---------------------------------------------------------------------------
CHEAT_SHEET.extend([
    {
        'heading': 'Context facts, escalation and error propagation (5.1, 5.2, 5.3)',
        'points': [
            'Context is working memory: accuracy and recall fall as it fills (context rot), so curate what enters. The Messages API is stateless, so every request carries the full history.',
            'Progressive summarization blurs amounts, dates, order numbers and promises. Keep a case facts block (and one structured record per issue in multi-issue sessions) in every prompt, outside the summarized history.',
            'Tool results pile up and are re-read every turn: trim to the relevant fields in code (tool wrapper or PostToolUse hook), for example 5 of 40 fields. A prompt telling the model to ignore fields leaves the tokens in place.',
            'Position effects ("lost in the middle"): put a key-findings summary first, use explicit section headers, and place long documents before the question. Upstream agents return key facts, citations, relevance scores, dates and source locations instead of prose.',
            'Escalate on an explicit request for a human (at once, no investigation first), a policy gap or ambiguity, or no meaningful progress. Do not escalate on sentiment, self-reported confidence or mere complexity.',
            'Frustration without a request and a fixable issue: acknowledge, offer the resolution, escalate only if the customer repeats the wish. Several lookup matches: ask for another identifier and never pick by heuristic.',
            'Wrong escalation calibration: fix it first with explicit criteria plus few-shot examples of escalating and of resolving in the system prompt. Classifiers and confidence thresholds are heavier and less reliable.',
            'Errors: retry transient failures locally and propagate only what cannot be fixed, as structured context (failure type, attempted query, partial results, alternatives). An access failure (could not look) differs from a valid empty result (looked, found nothing).',
            'Anti-patterns: an empty result marked as success (silent suppression), a generic "unavailable" status, and aborting the whole workflow on one failure. Final reports carry coverage annotations: well-supported findings versus gaps from unavailable sources.',
        ],
    },
    {
        'heading': 'Long sessions, human review and provenance (5.4, 5.5, 5.6)',
        'points': [
            'Long sessions degrade: inconsistent answers and "typical patterns" instead of specific classes. Counter with scratchpad files that are reread, subagents for narrow questions (only summaries return) and phase summaries injected into the next agents\' prompts.',
            'Crash recovery: each agent exports state to a known location, and the coordinator loads a manifest on resume and injects the state into the agents\' prompts. Subagents inherit nothing.',
            'Claude Code: /compact (optionally with a focus) summarizes and continues the session; /clear starts empty. The project-root CLAUDE.md is re-read from disk after compaction; instructions given only in chat can be lost.',
            'API tools for long runs: server-side compaction (beta) summarizes older turns; context editing clears old tool results or thinking blocks by rule; the client-side memory tool stores files under /memories. Prompt caching changes cost, not what occupies the window.',
            'A 97% overall accuracy can hide 68% on one document type. Validate accuracy by document type and field before cutting review, and automate only the segments that pass on their own.',
            'Field-level confidence is calibrated on a labeled validation set. Route low-confidence fields and ambiguous or contradictory sources to reviewers first, and keep ongoing stratified random sampling of high-confidence outputs to measure error rates and catch new patterns.',
            'Provenance: subagents return claim-source mappings (claim, URL or document, excerpt, publication or collection date) and synthesis preserves and merges them. Prose summaries are where attribution disappears.',
            'Conflicting credible figures: keep both with source, method and date, and let the coordinator reconcile; never silently pick or average. Dates often explain an apparent conflict (a 2021 figure versus a 2025 one).',
            'Structure reports as established versus contested findings, and render content by type: financial data as tables, news as prose, technical findings as structured lists.',
        ],
    },
])
