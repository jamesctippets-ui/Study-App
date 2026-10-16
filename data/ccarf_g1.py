"""ccarf group 1: Domain 3 (Claude Code Configuration and Workflows), task statements 3.1-3.6 (20%).

Group writer ccarf_g1 owns the lessons, case studies, CLI challenges, games and cheat sheet of the `claudecode`
category. Its flashcards (f1001-f1061) and questions (q1001-q1043, msq1001-msq1010, tf1001-tf1016) were written in
ccarf_b1 and are referenced here by id. Written against the official exam guide (version 1.0, effective July 2026)
and checked against the current Claude Code documentation (October 2026).
"""


def _cq(cid, n, qtype, question, explanation, options=None, correct=None, answer=None):
    """A case-study question: id is '<case id>-q<n>'."""
    q = {'id': '%s-q%d' % (cid, n), 'type': qtype, 'question': question, 'explanation': explanation}
    if qtype in ('mc', 'ms'):
        q['options'] = options
        q['correct'] = correct
    else:
        q['answer'] = answer
    return q


_CC = 'claudecode'

FLASHCARDS = []
QUESTIONS = []
LESSONS = []
MADLIBS = []
SEQUENCES = []
CASE_STUDIES = []
COMPARE = []
CLI_CHALLENGES = []
CHEAT_SHEET = []


LESSONS.extend([
    {
        'id': 'claude-md-hierarchy-rules-and-imports',
        'title': 'CLAUDE.md Hierarchy, Imports and Path-Scoped Rules',
        'summary': 'Covers task statements 3.1 and 3.3: where instruction files live and who receives them (user, project, directory), how they combine, @import and .claude/rules/ for modular organization, and path-scoped rules that load only for matching files.',
        'diagram': None,
        'vocabIds': ['f1002', 'f1003', 'f1004', 'f1007', 'f1008', 'f1009', 'f1030', 'f1031', 'f1032'],
        'quizIds': ['q1001', 'q1003', 'q1007', 'q1016', 'q1018', 'msq1005'],
        'reading': (
            "This lesson covers task statements 3.1 and 3.3. Claude Code starts every session knowing nothing about your team, and CLAUDE.md is how you tell it: a plain markdown file of build and test commands, naming conventions and architecture notes, read when a session starts. Two facts frame everything. It is guidance, not enforced configuration, so a line that forbids an action does not block it (use a hook or a deny rule for a guarantee). And every line costs context in every session, so placement matters as much as wording.\n\n"
            "Know three levels. The user-level file, ~/.claude/CLAUDE.md, follows you into every project but lives outside any repository, so teammates never receive it. The project-level file, CLAUDE.md at the repository root or .claude/CLAUDE.md, is committed, so everyone who clones the repository gets the same standards. Directory-level files sit in subdirectories such as packages/api/CLAUDE.md. Files in the working directory and its parents load at launch and are joined rather than overriding, with closer files read later; a subdirectory file loads only when Claude reads or edits a file there. CLAUDE.local.md holds private, gitignored preferences such as a sandbox URL. The classic diagnosis: a new engineer's Claude ignores conventions everyone else sees, because a senior colleague saved them in the user-level file. Move them into the committed project file.\n\n"
            "The opposite failure is a monolith: in a 600-line file individual rules get followed less reliably, so aim for under about 200 lines and split by topic. An @import line pulls another file in: writing @docs/standards.md inside packages/payments/CLAUDE.md loads packages/payments/docs/standards.md with it, so each package imports only the standards its maintainers need. Relative paths resolve from the importing file, and imports may nest up to four hops. Imports organize instructions; they do not shrink them, because the imported text loads at launch. The second tool is the .claude/rules/ directory: one small markdown file per topic (testing.md, api-conventions.md, deployment.md) in place of one big file. A rule without frontmatter loads at launch.\n\n"
            "Path-scoped rules save context. Give a rule file YAML frontmatter with a paths field of glob patterns, for example paths: [\"terraform/**/*\"], and it loads only when Claude reads, writes or edits a matching file, so Terraform conventions stay out while someone edits CSS. A glob follows a file type wherever it lives: **/*.test.tsx catches every test file in the repository, whereas directory-level files would need a copy in dozens of folders and would miss the next new one. Use a directory-level file for a convention that belongs to one package, a glob rule for one that cuts across directories. The paths field is the only frontmatter key Claude Code reads in a rule.\n\n"
            "When behavior differs between sessions, check what loaded before rewording anything. /memory lists the instruction files in play and opens them for editing; /context shows what fills the window, including the memory files loaded at launch. After /compact the project-root file is re-read from disk, but a path-scoped rule or nested file that arrived mid-session is folded into the summary and returns only when Claude next touches a matching file."
        ),
        'fundamentalsLabel': 'New to CLAUDE.md? See the everyday analogy',
        'fundamentals': 'Picture a company that gives every new hire a welcome binder. The binder kept at the office (the project file) is identical for everyone, while the sticky notes in your own desk drawer (the user-level file) are yours alone and a new colleague never sees them. Each department also keeps a short folder of its own rules (directory-level files), and the safety rules for the workshop floor are handed out only at the workshop door (path-scoped rules). A binder of 600 pages is one that nobody reads.',
        'keyTerms': ['user-level file', 'project-level file', 'Directory-level files', 'CLAUDE.local.md', '@import', '.claude/rules/', 'paths field', 'path-scoped rule', '/memory'],
        'commonTraps': [
            'Conventions saved in the user-level file never reach teammates; team standards belong in the committed project file.',
            'An instruction file is advice delivered as context. A bold line that says never to touch a folder does not block anything; a hook or a deny rule does.',
            '@import organizes a large file but does not reduce context, because imported text loads at launch. Path-scoped rules are what keep irrelevant conventions out.',
            'A convention that follows a file type across many folders is best written once as a glob rule, not copied into a directory-level file per folder.',
            'A rule is matched by its paths patterns, never by its own file name or folder; a rule with no paths field applies to everything.',
        ],
        'scenario': 'A payments team shares one monorepo between a web app and an API, and its root CLAUDE.md has grown to 550 lines. A new hire reports that Claude ignores the naming rules everyone else sees, because a senior engineer saved them in a home-directory file. The team moves the shared rules into the committed project file, splits the rest into .claude/rules/testing.md and api-conventions.md, scopes the testing rule to **/*.test.ts, and has packages/payments/CLAUDE.md import the payments standards document.',
        'onTheJob': 'Treat the instruction file like code: review changes to it, keep it short and delete rules that no longer apply, because contradictory lines may be followed arbitrarily. When Claude breaks a rule twice, first check whether the rule was loaded (/memory or /context) before rewording it. Put anything with serious consequences into a hook or a permission rule instead of a bolder sentence. Keep personal sandbox URLs in CLAUDE.local.md and add that file to .gitignore.',
    },
    {
        'id': 'skills-commands-and-plan-mode',
        'title': 'Skills, Slash Commands and Plan Mode',
        'summary': 'Covers task statements 3.2 and 3.4: project and personal commands and skills, SKILL.md frontmatter (context: fork, allowed-tools, argument-hint), choosing a skill over CLAUDE.md, and when to use plan mode, direct execution and the Explore subagent.',
        'diagram': None,
        'vocabIds': ['f1019', 'f1021', 'f1022', 'f1023', 'f1024', 'f1027', 'f1035', 'f1036', 'f1037'],
        'quizIds': ['q1008', 'q1010', 'q1011', 'q1021', 'q1024', 'msq1007'],
        'reading': (
            "This lesson covers task statements 3.2 and 3.4. A custom slash command is a markdown file whose name becomes the command: .claude/commands/review.md creates /review. Committed in the repository it reaches the whole team; kept in ~/.claude/commands/ it is personal. Commands have since been merged into skills, folders such as .claude/skills/review/SKILL.md with optional extras. Both forms create /review, old command files keep working, and the skill wins if the names clash. Skills have the same scopes plus organization-deployed enterprise skills; if a name exists in several places, enterprise beats personal and personal beats project. To adapt a team skill without changing teammates' copy, save a variant under a different name in ~/.claude/skills/.\n\n"
            "YAML frontmatter at the top of SKILL.md configures behavior. The description is what Claude reads to decide when the skill applies; descriptions stay in context while the full body loads only on use. context: fork runs the skill in a separate subagent that starts without your conversation, so a codebase analysis that prints thousands of lines, or a brainstorm of alternatives, leaves only its result behind. The body must contain a real task, because guidelines alone give the subagent nothing to do; the agent field picks the subagent type. allowed-tools lists tools Claude may use without asking while the skill runs, for example Bash(git add *) and Bash(git commit *). In current Claude Code it pre-approves and does not remove other tools, so forbid something with disallowed-tools, a deny rule or a restricted agent. argument-hint shows a hint such as [issue-number] in autocomplete, and what the user types arrives as $ARGUMENTS. disable-model-invocation: true stops Claude from starting the skill on its own, the right setting for /deploy.\n\n"
            "Skill or CLAUDE.md? Standards that must hold in every session, such as 'use pnpm and run the typecheck before finishing', belong in CLAUDE.md, which is always loaded. A twelve-step release checklist needed twice a month belongs in a skill, so it costs context only when invoked.\n\n"
            "Task statement 3.4 is about matching ceremony to uncertainty. Plan mode lets Claude read files, run exploratory commands and write a plan without editing source until you approve; enter it with Shift+Tab, a /plan prefix or claude --permission-mode plan. Choose it for large changes, architectural decisions, several valid approaches and multi-file edits: splitting a service, upgrading a library across about 45 files, or picking WebSockets or polling when each needs different infrastructure. Choose direct execution for well-scoped changes, such as adding one validation check to one function or fixing a bug whose stack trace points at one line. A useful test: if you could describe the diff in one sentence, skip the plan.\n\n"
            "The two combine: plan to investigate and design, approve the plan (you can edit it first), then let the same session carry it out. Discovery that would flood the window, such as tracing authentication across a large service, goes to the Explore subagent, a fast, read-only agent with its own context. The files it reads stay there and only a summary comes back, which keeps the main conversation usable through a multi-phase task."
        ),
        'fundamentalsLabel': 'New to skills and plan mode? See the everyday analogy',
        'fundamentals': 'A skill is a recipe card in the kitchen drawer: it comes out when that dish is on the menu, while the rules on the wall poster (CLAUDE.md) apply to every dish. A forked skill is sending a sous-chef to the stockroom to inventory everything and bring back one summary sheet instead of narrating each shelf. Plan mode is the architect walking the site with a clipboard before any wall comes down, and direct execution is changing a lightbulb without drawing a blueprint.',
        'keyTerms': ['slash command', 'context: fork', 'allowed-tools', 'argument-hint', 'disable-model-invocation', 'Plan mode', 'direct execution', 'Explore subagent', 'SKILL.md'],
        'commonTraps': [
            'In current Claude Code, allowed-tools pre-approves tools for the turn; it does not remove the unlisted ones. To prevent a tool, use disallowed-tools, a deny rule or a restricted agent type.',
            'A command in ~/.claude/commands/ is personal. Only files committed to the repository, under .claude/commands/ or .claude/skills/, reach teammates.',
            'context: fork needs an actionable task in the body. A skill that only lists guidelines returns nothing useful from its subagent.',
            'Plan mode for everything is as wrong as direct execution for everything; scale the ceremony to the uncertainty and to the number of files touched.',
            'The Explore subagent is read-only and keeps raw findings out of the main window; it is for discovery, not for making the edits.',
        ],
        'scenario': 'A platform team ships three workflows. /release-notes reads dozens of merged pull requests and prints long intermediate output, so it is a skill with context set to fork. /deploy sets disable-model-invocation to true so that it runs only when a person types it, and /fix-issue declares an argument-hint of [issue-number]. When the team must replace a message broker used by forty services, it starts in plan mode and lets the Explore subagent map the usage, approves the plan, then executes it; renaming one config key, it simply asks Claude to do it.',
        'onTheJob': 'Write skill descriptions for a colleague skimming a list: put the key use case first, because long descriptions are cut off. Keep SKILL.md focused (under roughly 500 lines) and move reference material into supporting files. Commit shared skills so the team receives them through version control, and test a forked skill by checking what comes back to the main conversation. Scale planning to risk: ask whether you could describe the diff in one sentence; if so, skip the plan, and if not, plan and let the Explore subagent do the reading.',
    },
    {
        'id': 'iterative-refinement-and-ci-pipelines',
        'title': 'Iterative Refinement and Claude Code in CI/CD',
        'summary': 'Covers task statements 3.5 and 3.6: input/output examples, test-driven iteration, the interview pattern and interacting versus independent issues; then running Claude Code in pipelines with -p, --output-format json, --json-schema, CLAUDE.md context, prior findings and independent review.',
        'diagram': None,
        'vocabIds': ['f1043', 'f1044', 'f1045', 'f1046', 'f1050', 'f1051', 'f1052', 'f1056', 'f1058'],
        'quizIds': ['q1027', 'q1033', 'q1034', 'q1035', 'q1036', 'msq1010'],
        'reading': (
            "This lesson covers task statements 3.5 and 3.6. Iterative refinement is the craft of getting from a first attempt to a correct one. When a prose description is read differently on each run, show the transformation instead: give two or three concrete input/output pairs, such as '(555) 010-9999' becoming '+15550109999'. Prefer test-driven iteration: write tests for expected behavior, edge cases and performance first, ask Claude to implement, then paste the failing output back and repeat. Tests give Claude a check it can run instead of a vague sense of being done. To fix one edge case, hand over a specific case with input and expected output, for example a migration row with a null in a legacy column and the result you want.\n\n"
            "In unfamiliar territory you may not know what to ask for. Use the interview pattern: have Claude question you before it builds. For a cache it might ask about invalidation, staleness limits and failure behavior; your answers become a spec, ideally executed in a fresh session. For feedback, separate interacting problems from independent ones. If a rounding bug, a currency-order bug and a discount-stacking bug all change each other's results, describe them together in one detailed message so Claude can design one coherent fix; independent problems are fixed one after another. And once you have corrected the same point more than twice, the context is cluttered with failed attempts: clear the session and restart with a sharper prompt.\n\n"
            "Task statement 3.6 puts Claude Code in a pipeline. A CI job has no human, so any prompt would hang it. The -p (or --print) flag runs non-interactively: it processes the prompt, prints the result and exits, with a non-zero exit code on failure. Add --output-format json to receive one JSON object with the result, session id and usage metadata, and add --json-schema with a schema to receive validated data in the structured_output field. A review job can request an array of findings, each with file, line, severity and message, that a script posts as inline pull-request comments. Scraping free-form prose with regular expressions breaks whenever the wording changes.\n\n"
            "Give the run context and limits. Testing standards, fixture conventions and review criteria belong in CLAUDE.md, which a plain claude -p run loads. The --bare option skips hooks, skills, MCP servers, auto memory and CLAUDE.md for reproducible runs; if you use it, supply that guidance yourself, for example with --append-system-prompt-file. Pre-approve exactly what the job needs with --allowedTools and rule syntax such as Bash(git diff *), and consider --permission-mode dontAsk, which denies anything not pre-approved.\n\n"
            "Two quality rules finish the topic. Independence: the session that wrote code is a weak reviewer of it, because it still carries its own reasoning, so review in a fresh instance that sees only the diff and the criteria. No repetition: when a review reruns after new commits, include the earlier findings and ask for only new or still-unaddressed issues, or developers see the same nine comments again. Likewise, include existing test files when generating tests so that scenarios are not duplicated."
        ),
        'fundamentalsLabel': 'New to iterative refinement and CI? See the everyday analogy',
        'fundamentals': 'Think of a tailor. Describing the fit in words (a bit looser) gets a different garment each time, but laying two finished suits on the table (examples) settles it, and the fitting-room mirror (tests) shows exactly where the cloth pulls. The interview is the tailor asking about occasions and weather before cutting. A CI run is the night shift in a locked shop: nobody can answer the phone, so the tailor works from written instructions and leaves a report in a fixed form, and a different tailor inspects the suit instead of the one who sewed it.',
        'keyTerms': ['input/output pairs', 'test-driven iteration', 'interview pattern', 'interacting problems', '--output-format', '--json-schema', '--bare', 'earlier findings', 'fresh instance'],
        'commonTraps': [
            'Without -p, a pipeline step can sit waiting for input that never arrives; the flag is what makes the run non-interactive.',
            'Prose findings cannot be posted reliably as inline comments; request --output-format json with --json-schema so the script receives fields instead of sentences.',
            'The session that generated the code is a weak reviewer of it; independence comes from a fresh instance given only the diff and the criteria.',
            'Re-running a review without the earlier findings repeats comments; pass them in and ask for new or still-unaddressed issues only.',
            'Independent bugs can be fixed one at a time, but interacting bugs need one message; mixing the two up wastes iterations.',
        ],
        'scenario': 'A team builds a pipeline in which Claude Code reviews every pull request and drafts tests. The job runs claude -p with --output-format json and a --json-schema describing findings, and a script posts each finding as an inline comment. CLAUDE.md lists the fixtures and what a worthwhile test looks like, the test prompt includes the existing test files, and on each new commit the review prompt includes the earlier findings and asks only for new or unresolved ones. The review runs in a separate invocation from the one that wrote the code.',
        'onTheJob': 'Define the contract between Claude and your script, then enforce it: validate the structured output and fail the job on a schema error or a non-zero exit code instead of silently posting nothing. Start restrictive, pre-approving only the Bash patterns the job needs and capping turns, and loosen deliberately. Keep CI instructions in the repository, in CLAUDE.md or a prompt file under version control, so changes get reviewed. When iterating by hand, resist long chains of corrections: after two misses, write down what you learned, clear the session and re-prompt with examples and a test.',
    },
])

_CS1 = 'cs-ccarf-code-generation'
_CS2 = 'cs-ccarf-claude-code-ci'

CASE_STUDIES.extend([
    {
        'id': _CS1,
        'cat': _CC,
        'title': 'Larkspur Freight: Claude Code Across a Monorepo',
        'scenario': "Larkspur Freight keeps its route-planning API (TypeScript), customer web app (React) and infrastructure code (Terraform) in one monorepo, and about twenty engineers use Claude Code for features, refactoring, debugging and documentation. Four problems have come up. First, new engineers say Claude ignores the team's naming and error-handling conventions. Investigation shows that those conventions were written into the CLAUDE.md in one senior engineer's home directory, while the repository's own file contains only build commands. Second, the testing conventions (use the shared fixtures, make no network calls) must apply to files ending in .test.ts that sit in dozens of folders, but the 500-line root CLAUDE.md also carries Terraform and React rules, which load for every task. Third, a /release-notes workflow reads fifty merged pull requests and floods the developer's session with intermediate text, while a /deploy workflow must never start unless a person asks for it. Fourth, next sprint the team must replace its in-house job queue with either a hosted queue service or a database-backed queue; each option needs different infrastructure and touches workers, deployment scripts and tests across many modules. A small ticket in the same sprint asks for a fix to an off-by-one error in one pagination helper.",
        'questions': [
            _cq(_CS1, 1, 'mc',
                'Which change gives new engineers the team\'s conventions while keeping each engineer\'s personal preferences private?',
                'The conventions reached only one person because the user-level file lives in a home directory, outside the repository. Committing them in the project-level file gives every clone the same standards, and each engineer\'s own user-level file stays private. Copying files by hand drifts out of date, auto memory is machine-local notes that Claude writes for one user, and pasting the conventions into every session is the manual routine the instruction file exists to remove.',
                options=['Commit the shared conventions in the project-level file and keep personal preferences in the user-level file',
                         'Copy the senior engineer\'s home-directory file onto every new engineer\'s machine during onboarding',
                         'Let auto memory collect the conventions from developers\' corrections, since it keeps shared notes for the whole team',
                         'Ask each new engineer to paste the conventions into the opening prompt of every session they start'],
                correct=0),
            _cq(_CS1, 2, 'mc',
                'How should the testing conventions be delivered so that they apply to test files in any folder and stay out of the way otherwise?',
                'A path-scoped rule loads only when Claude reads or edits a matching file, and the glob follows the file type wherever it sits. A copy in every test folder would be duplicated dozens of times and miss new folders. An @import organizes content but the imported text still loads at launch, and a heading in the root file still costs its tokens in every session.',
                options=['A rule file in .claude/rules/ whose paths pattern matches every file ending in .test.ts',
                         'A copy of the testing conventions in a CLAUDE.md inside each folder that holds tests',
                         'An @import line in the root CLAUDE.md that pulls in the testing conventions document',
                         'A heading in the root CLAUDE.md saying the testing conventions apply only when editing tests'],
                correct=0),
            _cq(_CS1, 3, 'ms',
                'Which two configurations fit the /release-notes and /deploy workflows? (Choose two.)',
                'A skill with context set to fork runs in a separate subagent context, so the long intermediate output stays out of the main session and only the result returns. Setting disable-model-invocation to true on /deploy means the workflow starts only when a person types it. In current Claude Code, allowed-tools pre-approves tools rather than blocking others, so it would make a deploy smoother, not safer. An argument-hint only shows a hint in autocomplete, and procedural steps in the root file cost context in every session.',
                options=['Make /release-notes a skill with context set to fork, so its long intermediate output stays out of the main session',
                         'Set disable-model-invocation to true on /deploy, so that the workflow runs only when a person types the command',
                         'List the deploy commands in the allowed-tools field of /deploy, so that Claude is blocked from running anything else',
                         'Give /deploy an argument-hint, so that Claude cannot start it without a human supplying an argument',
                         'Move the release-notes steps into the root CLAUDE.md, so that they are available in every session'],
                correct=[0, 1]),
            _cq(_CS1, 4, 'mc',
                'Which pairing of workflows best fits the queue replacement and the pagination fix?',
                'The queue decision has architectural and infrastructure consequences across many modules, which is what plan mode is for: explore, compare the options, approve a plan, then execute. The Explore subagent keeps the discovery output out of the main window. The pagination fix is a single-function change with a clear cause, where planning only adds overhead. Applying one mode to both ignores the difference in uncertainty and scope, and the reverse pairing starts the risky change without a design.',
                options=['Plan mode for the queue replacement, using the Explore subagent to map its usage, and direct execution for the pagination fix',
                         'Direct execution for both, because the team reviews every pull request before merging and can catch problems then',
                         'Plan mode for both, so that every change in the sprint follows the same careful and consistent process',
                         'Direct execution for the queue replacement, starting with the hosted service, and plan mode for the pagination fix'],
                correct=0),
        ],
    },
    {
        'id': _CS2,
        'cat': _CC,
        'title': 'Northgate Billing: Claude Code in the Pull Request Pipeline',
        'scenario': "Northgate Billing runs Claude Code in GitHub Actions to review pull requests and to propose tests for new code. The review job calls claude -p with a prose prompt, splits the answer on blank lines with a script and posts it all as one long comment. Reviewers report four problems. Remarks cannot be attached to lines of the diff, because the script has no reliable way to tell which file and line each one concerns. After every push the job posts the earlier remarks again together with the new ones. The test proposals often repeat cases the suite already covers or exercise trivial getters, and they ignore the team's shared fixtures; the repository's CLAUDE.md contains build commands only. In another workflow, the Claude Code session that writes a feature is then asked to approve its own change, and it approves almost every time. Finally, a nightly changelog job was added as the command claude with the prompt as its only argument; it never finishes, because the process sits waiting for input.",
        'questions': [
            _cq(_CS2, 1, 'mc',
                'How can the review job attach each remark to the correct file and line?',
                'A schema turns the output into data: each finding carries fields the script maps directly onto an inline comment, and the CLI returns the validated object in the structured_output field. Asking for a layout in the prompt still depends on the model keeping to the wording, stream-json is a format for streaming events rather than a way to enforce a shape, and a markdown table parsed with a pattern breaks as soon as the layout shifts.',
                options=['Use --output-format json with a --json-schema for findings (file, line, severity, message) and post each entry from structured_output',
                         'Ask in the prompt for every remark to start with the file name and line number, and keep splitting the text with the script',
                         'Switch to --output-format stream-json so that the script receives each remark as a separate event while it is being generated',
                         'Ask Claude for a markdown table with one row per remark, and have the script parse each row with a regular expression'],
                correct=0),
            _cq(_CS2, 2, 'mc',
                'What is the best way to stop old remarks from being posted again after each push?',
                'Giving Claude the findings that are already posted, and asking for only new or still-unaddressed issues, fixes the cause: the model knows what has been said and what has been fixed. An exact-match filter in the script misses remarks that are reworded, a cap on remarks hides the repetition without removing it, and skipping later pushes leaves new code unreviewed.',
                options=['Pass the findings already posted into the prompt and ask Claude to report only new or still-unaddressed issues',
                         'Have the script drop any remark whose text exactly matches an earlier comment on the same pull request',
                         'Cap the job at three remarks per run, so that any repeated remarks matter less to the developers',
                         'Review only the first push of each pull request, and skip the review for every push that follows it'],
                correct=0),
            _cq(_CS2, 3, 'ms',
                'Which two changes would most improve the test proposals? (Choose two.)',
                'Existing test files in the prompt let Claude see which scenarios the suite already covers, and documenting the testing standards, what a worthwhile test looks like and the fixtures in CLAUDE.md steers the output toward valuable tests that use them. Asking for more tests invites the trivial ones, --bare skips CLAUDE.md so it would remove the guidance, and a higher turn limit only lets the job run longer.',
                options=['Include the existing test files in the prompt, so that Claude can see which scenarios the suite already covers',
                         'Document the testing standards, what makes a test worth writing and the available fixtures in CLAUDE.md',
                         'Ask for as many tests as possible in each run, so that no possible scenario is ever missed',
                         'Add --bare to the command, so that project-specific guidance cannot distract the model during generation',
                         'Raise the turn limit, so that Claude can keep generating more tests until it runs out of ideas'],
                correct=[0, 1]),
            _cq(_CS2, 4, 'ms',
                'Which two changes address the self-approving reviews and the nightly job that never finishes? (Choose two.)',
                'A session that wrote the change still holds its own reasoning and tends to defend it, so an independent instance given only the diff and the criteria is the better reviewer. The command claude with a prompt opens an interactive session that waits for input; -p makes the run non-interactive, so it prints the result and exits. Asking the writing session to be more critical keeps the bias, a longer timeout with retries only repeats the hang, and bypassing permission checks removes safeguards without touching the cause.',
                options=['Run the review in a separate, fresh Claude Code invocation given only the diff and the review criteria',
                         'Add the -p flag to the nightly command, so that Claude Code prints the result and exits',
                         'Ask the writing session to review its work again, this time telling it to be as critical as possible',
                         'Give the nightly job a much longer timeout and an automatic retry whenever it runs out of time',
                         'Run both jobs with all permission checks bypassed, so that nothing can ever wait for a person'],
                correct=[0, 1]),
        ],
    },
])

CLI_CHALLENGES.extend([
    {
        'id': 'cli-claude-101', 'cat': _CC, 'tool': 'claude',
        'prompt': 'Run Claude Code non-interactively so that it answers the question "What does the auth module do?", prints the answer and exits.',
        'verb': 'claude',
        'command': 'claude -p "What does the auth module do?"',
        'altCommands': ['claude --print "What does the auth module do?"'],
        'requiredFlags': ['-p'],
        'explanation': 'The -p (or --print) flag makes Claude Code process the prompt, write the result to standard output and exit, with a non-zero exit code if the run fails. It is what keeps an automated step from hanging on interactive input.',
    },
    {
        'id': 'cli-claude-102', 'cat': _CC, 'tool': 'claude',
        'prompt': 'Run a non-interactive query "Summarize this project" whose output is a single JSON object holding the result text together with the session id and usage metadata.',
        'verb': 'claude',
        'command': 'claude -p "Summarize this project" --output-format json',
        'requiredFlags': ['-p', '--output-format json'],
        'explanation': 'In print mode --output-format accepts text (the default), json and stream-json. The json form returns one object with the answer in the result field plus metadata such as the session id and cost estimate, which a script can read with a tool like jq. stream-json is for newline-delimited events while the answer is generated.',
    },
    {
        'id': 'cli-claude-103', 'cat': _CC, 'tool': 'claude',
        'prompt': 'Run the non-interactive request "Extract the main function names from auth.py" so that the answer comes back as JSON validated against a schema (an object with a required "functions" array of strings).',
        'verb': 'claude',
        'command': 'claude -p "Extract the main function names from auth.py" --output-format json --json-schema \'{"type":"object","properties":{"functions":{"type":"array","items":{"type":"string"}}},"required":["functions"]}\'',
        'requiredFlags': ['-p', '--output-format json', '--json-schema'],
        'explanation': '--json-schema works in print mode only. Combined with --output-format json, the validated result arrives in the structured_output field next to the usual metadata. This is the CI pattern for machine-parseable findings, for example a list with file, line, severity and message that a script posts as inline pull-request comments.',
    },
    {
        'id': 'cli-claude-104', 'cat': _CC, 'tool': 'claude',
        'prompt': 'Run the non-interactive request "Look at my staged changes and create an appropriate commit", pre-approving git diff, git log, git status and git commit commands (use the --allowedTools flag) so that no permission prompt appears.',
        'verb': 'claude',
        'command': 'claude -p "Look at my staged changes and create an appropriate commit" --allowedTools "Bash(git diff *),Bash(git log *),Bash(git status *),Bash(git commit *)"',
        'requiredFlags': ['-p', '--allowed', 'git commit'],
        'explanation': '--allowedTools takes permission-rule patterns; the space and asterisk at the end of Bash(git diff *) give prefix matching. It pre-approves the listed calls without a prompt but does not remove any other tool. To restrict the built-in tools Claude can use, pass --tools, and to deny calls use --disallowedTools or a deny rule. The hyphenated spelling --allowed-tools is accepted as well.',
    },
    {
        'id': 'cli-claude-105', 'cat': _CC, 'tool': 'claude',
        'prompt': 'For a reproducible CI run, summarize README.md non-interactively while skipping the automatic loading of hooks, skills, plugins, MCP servers, auto memory and CLAUDE.md, and pre-approve only the Read tool.',
        'verb': 'claude',
        'command': 'claude --bare -p "Summarize README.md" --allowedTools "Read"',
        'requiredFlags': ['--bare', '-p', '--allowed'],
        'explanation': '--bare starts Claude Code without auto-discovery of hooks, skills, plugins, MCP servers, auto memory and CLAUDE.md, so a scripted run behaves the same on every machine. Because CLAUDE.md is skipped, anything the job needs must be supplied explicitly, for example with --append-system-prompt-file or --settings. Bare mode also never reads subscription logins, so with the Anthropic API it expects an API key, for example in ANTHROPIC_API_KEY.',
    },
    {
        'id': 'cli-claude-106', 'cat': _CC, 'tool': 'claude',
        'prompt': 'Start an interactive Claude Code session that begins in plan mode, so that Claude can explore the code and propose a plan without editing files until you approve it.',
        'verb': 'claude',
        'command': 'claude --permission-mode plan',
        'requiredFlags': ['--permission-mode', 'plan'],
        'explanation': '--permission-mode sets the mode a session starts in: default (also called manual), acceptEdits, plan, auto, dontAsk or bypassPermissions. Inside a session, Shift+Tab cycles the modes and a /plan prefix switches for one prompt. In plan mode Claude reads, explores and writes a plan, and edits wait for your approval.',
    },
    {
        'id': 'cli-claude-107', 'cat': _CC, 'tool': 'claude',
        'prompt': 'Start an interactive session and give it the display name "auth-refactor", so that it is easy to find in the resume picker and can be resumed by name later.',
        'verb': 'claude',
        'command': 'claude --name "auth-refactor"',
        'altCommands': ['claude -n "auth-refactor"', 'claude -n auth-refactor', 'claude --name auth-refactor'],
        'requiredFlags': ['-n', 'auth-refactor'],
        'explanation': '--name (short form -n) sets a display name for the session, shown in the /resume picker and the terminal title. A named session can later be reopened with claude --resume followed by the name. Inside a running session, the /rename command changes the name.',
    },
    {
        'id': 'cli-claude-108', 'cat': _CC, 'tool': 'claude',
        'prompt': 'Resume the session named "auth-refactor" and send it the prompt "Finish this PR".',
        'verb': 'claude',
        'command': 'claude --resume auth-refactor "Finish this PR"',
        'altCommands': ['claude -r "auth-refactor" "Finish this PR"', 'claude -r auth-refactor "Finish this PR"', 'claude --resume "auth-refactor" "Finish this PR"'],
        'requiredFlags': ['-r', 'auth-refactor'],
        'explanation': '--resume (short form -r) reopens a specific session by ID or by name, and shows an interactive picker when you give no argument. A prompt after it is sent as the next message. By contrast, --continue (-c) reopens the most recent conversation in the current directory.',
    },
    {
        'id': 'cli-claude-109', 'cat': _CC, 'tool': 'claude',
        'prompt': 'Resume the session "auth-refactor" but branch it into a new session ID, so that the original conversation stays untouched while you try a different approach.',
        'verb': 'claude',
        'command': 'claude --resume auth-refactor --fork-session',
        'altCommands': ['claude -r auth-refactor --fork-session', 'claude -r "auth-refactor" --fork-session', 'claude --resume "auth-refactor" --fork-session'],
        'requiredFlags': ['-r', 'auth-refactor', '--fork-session'],
        'explanation': '--fork-session, used together with --resume or --continue, creates a new session ID instead of reusing the original, so two approaches can start from the same history while the original session is left as it was. The Agent SDK counterpart is the fork_session option (forkSession in TypeScript).',
    },
    {
        'id': 'cli-claude-110', 'cat': _CC, 'tool': 'claude',
        'prompt': 'Register the remote HTTP MCP server "notion" at https://mcp.notion.com/mcp so that its configuration is written to the project\'s .mcp.json and shared with teammates through version control. Use the long option names.',
        'verb': 'claude mcp add',
        'command': 'claude mcp add --transport http notion --scope project https://mcp.notion.com/mcp',
        'requiredFlags': ['--transport http', '--scope project', 'notion'],
        'explanation': 'claude mcp add takes --transport (http is the recommended choice for remote servers) and --scope. Local scope is the default: private, this project only. Project scope writes .mcp.json at the repository root so teammates share it, and Claude Code asks each person to approve project servers before using them. User scope makes a private server available in all your projects. The short forms are -t and -s.',
    },
])

MADLIBS.extend([
    {
        'id': 'ml-ccarf-101', 'cat': _CC,
        'scenario': 'Instructions saved in the {b1} file in your home directory apply to you in every project but are never shared with teammates, so team standards belong in the {b2} file that is committed to the repository. A convention that applies only to files of one type, such as every test file, can be written once as a rule under .claude/rules/ whose {b3} frontmatter field lists glob patterns, so it loads only when Claude touches a matching file.',
        'blanks': [
            {'key': 'b1', 'options': ['user-level CLAUDE.md', 'project-level CLAUDE.md', 'directory-level CLAUDE.md'], 'correct': 0},
            {'key': 'b2', 'options': ['project-level CLAUDE.md', 'user-level CLAUDE.md', 'managed policy CLAUDE.md'], 'correct': 0},
            {'key': 'b3', 'options': ['paths', 'scope', 'match'], 'correct': 0},
        ],
        'explanation': 'The user-level file follows you across projects but sits outside any repository, which is why a new teammate does not receive what it contains. The project-level file is committed and reaches everyone who clones. In a rule file, paths is the only frontmatter field Claude Code reads; a rule without it loads at launch for all work.',
    },
    {
        'id': 'ml-ccarf-102', 'cat': _CC,
        'scenario': 'A skill that prints thousands of lines of analysis should set {b1} so that it runs in an isolated subagent and only the result returns to the main conversation. To let a /commit skill run git commands without a prompt each time, list them in {b2}, which pre-approves tools instead of removing the others. The {b3} field shows a hint such as [issue-number] when a developer types the skill name.',
        'blanks': [
            {'key': 'b1', 'options': ['context: fork', 'disable-model-invocation: true', 'user-invocable: false'], 'correct': 0},
            {'key': 'b2', 'options': ['allowed-tools', 'disallowed-tools', 'argument-hint'], 'correct': 0},
            {'key': 'b3', 'options': ['argument-hint', 'description', 'allowed-tools'], 'correct': 0},
        ],
        'explanation': 'context: fork starts a separate subagent without the conversation history, so verbose output stays out of the main session. allowed-tools grants approval for the listed tools during the turn the skill runs; disallowed-tools is the field that removes tools. argument-hint is only an autocomplete hint, and the text the user types reaches the skill body as $ARGUMENTS.',
    },
    {
        'id': 'ml-ccarf-103', 'cat': _CC,
        'scenario': 'A pipeline step that calls Claude Code should use the {b1} flag so that the run processes its prompt, prints the result and exits instead of waiting for input. Adding --output-format json together with {b2} returns schema-validated findings in the structured_output field. For the review itself, use a {b3} Claude instance that sees only the diff and the review criteria, because the session that wrote the code is biased toward its own work.',
        'blanks': [
            {'key': 'b1', 'options': ['-p', '--verbose', '--continue'], 'correct': 0},
            {'key': 'b2', 'options': ['--json-schema', '--input-format', '--max-turns'], 'correct': 0},
            {'key': 'b3', 'options': ['fresh, independent', 'resumed', 'forked'], 'correct': 0},
        ],
        'explanation': '-p (or --print) is the non-interactive mode that prevents a pipeline from hanging. --json-schema, which works in print mode, makes the answer structured and validated. A resumed or forked session carries the earlier conversation, including the reasoning that produced the code, while a fresh instance judges the change on the diff and the criteria alone.',
    },
])

SEQUENCES.extend([
    {
        'id': 'seq-ccarf-101', 'cat': _CC,
        'prompt': 'Put a plan-then-execute workflow for a library migration in order.',
        'steps': [
            'Enter plan mode and let Claude explore the affected code, delegating noisy discovery to the Explore subagent',
            'Ask Claude to propose a migration plan covering the files, the replacement patterns and the risks',
            'Review the plan, editing it or giving feedback until it fits',
            'Approve the plan so that Claude leaves plan mode and starts editing',
            'Run the test suite and fix failures against the plan',
            'Commit the change with a descriptive message',
        ],
        'explanation': 'Plan mode separates investigation from execution: Claude explores and proposes, you steer the plan, and only approval allows edits. The same session then carries out the plan, verifies it with the tests and commits. Editing before the plan is approved would defeat the purpose of the mode.',
    },
    {
        'id': 'seq-ccarf-102', 'cat': _CC,
        'prompt': 'Order the interview pattern followed by test-driven iteration for a feature in an unfamiliar area.',
        'steps': [
            'Describe the feature briefly and ask Claude to interview you about design considerations before it builds anything',
            'Answer the questions, including edge cases and failure modes you had not thought of',
            'Have Claude write the agreed requirements into a spec file',
            'Start a fresh session and write tests from the spec covering behavior, edge cases and performance',
            'Ask Claude to implement the feature and run the tests',
            'Share the failing test output with Claude and repeat until the tests pass',
        ],
        'explanation': 'The interview surfaces considerations the developer had not anticipated and turns them into a spec. A fresh session then starts with clean context focused on the spec, tests define done before any implementation, and each round of failures goes back to Claude as concrete feedback.',
    },
    {
        'id': 'seq-ccarf-103', 'cat': _CC,
        'prompt': 'Order one run of an automated pull-request review built on Claude Code.',
        'steps': [
            'A push to the pull request triggers the workflow, which checks out the code',
            'The job collects the diff and the findings already posted on the pull request',
            'A fresh claude -p run starts with the repository\'s CLAUDE.md and the review criteria, asking for --output-format json with a --json-schema',
            'Claude returns schema-valid findings, reporting only new or still-unaddressed issues',
            'The job reads the structured_output field and checks the exit code',
            'A script posts each finding as an inline comment on the pull request',
        ],
        'explanation': 'The job gathers its context before calling Claude: the diff and the earlier findings. A fresh non-interactive run with the project standards returns machine-parseable findings, which the job validates and only then posts as inline comments.',
    },
])

COMPARE.extend([
    {
        'id': 'cmp-ccarf-101', 'cat': _CC,
        'scenario': 'Kubernetes manifests ending in .k8s.yaml sit in the deploy folder of about thirty services, and every one must follow the same conventions. Developers editing other files should not load these conventions. Which setup is better?',
        'optionA': 'One rule file in .claude/rules/ whose paths field matches **/deploy/*.k8s.yaml',
        'optionB': 'A CLAUDE.md in each service\'s deploy folder that repeats the manifest conventions',
        'better': 'A',
        'why': 'The glob rule is written once, follows the file type into every folder and loads only when Claude touches a matching manifest. Per-folder files are the tempting runner-up because directory-level files also load on demand, but thirty copies drift apart and a new service is missed until someone remembers to add one.',
    },
    {
        'id': 'cmp-ccarf-102', 'cat': _CC,
        'scenario': 'A 3,000-line billing module must be split into separate invoice, payment and tax modules. Callers are spread across the repository and the team has not yet decided where the boundaries go. How should the developer open the session?',
        'optionA': 'Use plan mode: have Claude map the dependencies (using the Explore subagent for the discovery) and propose boundaries, then approve a plan before any edits',
        'optionB': 'Describe the three modules and let Claude start editing at once, correcting boundary mistakes as they appear in review',
        'better': 'A',
        'why': 'The boundaries are an unsettled design decision that touches many callers, which is what plan mode exists for: a plan is cheap to change and edits spread across the repository are expensive to unpick. Starting directly feels faster and suits a change you could state in one sentence, but here the speed is borrowed from rework later.',
    },
    {
        'id': 'cmp-ccarf-103', 'cat': _CC,
        'scenario': 'A pull-request review job reruns on every push, and developers keep seeing remarks they have already read. Which fix is better?',
        'optionA': 'Pass the findings already posted into the prompt and ask Claude to report only new or still-unaddressed issues',
        'optionB': 'Have the script compare each new remark with the posted comments and skip those whose text matches exactly',
        'better': 'A',
        'why': 'Giving Claude the earlier findings lets it recognize the same problem however it would be worded, and also notice which ones have been fixed. The script-side filter is the tempting runner-up because it needs no prompt change, but Claude rarely repeats a remark word for word, so exact matching lets duplicates through and cannot tell resolved issues from open ones.',
    },
])

CHEAT_SHEET.extend([
    {
        'heading': 'CLAUDE.md hierarchy, imports and rules (3.1, 3.3)',
        'points': [
            'Three levels. User-level ~/.claude/CLAUDE.md: only you, every project, never in version control. Project-level CLAUDE.md or .claude/CLAUDE.md: committed and shared with the team. Directory-level CLAUDE.md in a subdirectory: loads when Claude reads or edits files there. Also CLAUDE.local.md (private, gitignored) and an organization-managed policy file.',
            'Files are concatenated, not overridden: the working directory and its parents load at launch (root first, closest last). Contradictory lines may be followed arbitrarily, so prune them. Aim for under about 200 lines per file.',
            'A teammate is missing conventions that everyone else gets? They were saved at user level. Move them into the committed project file.',
            'CLAUDE.md is context, not enforcement: a line that forbids something does not block it. Use a hook or a permission deny rule when you need a guarantee.',
            '@path/to/file imports a file at launch: relative to the importing file, nested up to four hops. It organizes (each package imports only its own standards) but does not reduce context.',
            '.claude/rules/*.md holds one topic per file (testing.md, api-conventions.md, deployment.md), found recursively. A rule with no paths field loads at launch like the main file.',
            'Path-scoped rule: YAML frontmatter paths: ["src/api/**/*.ts"] (a list or a comma-separated string; paths is the only field read). It loads when Claude reads, writes or edits a matching file, which saves context. A glob such as **/*.test.tsx follows a file type across directories, which directory-level files cannot do cheaply.',
            'Diagnose with /memory (lists and edits the instruction files in play, toggles auto memory), /context (what fills the window, including loaded memory files) and /init (drafts a starter file). After /compact the root file reloads; path-scoped rules and nested files return when a matching file is touched again.',
        ],
    },
    {
        'heading': 'Skills, commands and plan mode (3.2, 3.4)',
        'points': [
            'Commands: .claude/commands/ in the repository is shared through version control; ~/.claude/commands/ is personal. Skills (.claude/skills/<name>/SKILL.md, personal ones in ~/.claude/skills/) have absorbed commands: both create /name and the skill wins a name clash. Precedence: enterprise, then personal, then project.',
            'SKILL.md frontmatter: description (when to use it; key use first), context, agent, allowed-tools, disallowed-tools, argument-hint, disable-model-invocation, user-invocable, model. Descriptions stay in context; the body loads only when the skill runs.',
            'context: fork runs the skill in an isolated subagent that starts without your conversation, and only the result returns. Use it for verbose analysis or brainstorming alternatives. The body needs a concrete task, not just guidelines; agent picks the subagent type.',
            'allowed-tools lists tools Claude may use without asking while the skill runs, for example Bash(git commit *). Current docs: it pre-approves and does not remove other tools (restrict with disallowed-tools, deny rules or a restricted agent). The exam guide words it as limiting tool access, so know both framings.',
            'argument-hint is an autocomplete hint such as [issue-number]; what the user types arrives as $ARGUMENTS. disable-model-invocation: true means only a person can start the skill (deploys, commits).',
            'Skill versus CLAUDE.md: standards that always apply go in CLAUDE.md (always loaded); task-specific procedures go in skills (loaded on demand). A personal variant is a copy of a team skill saved under a different name in ~/.claude/skills/.',
            'Plan mode: Claude reads, explores and writes a plan, with no source edits until you approve. Enter with Shift+Tab, a /plan prefix or claude --permission-mode plan. Use it for large or architectural work, multi-file edits and several valid approaches (service split, 45-file library migration, choosing an integration).',
            'Direct execution suits small, well-scoped changes (one validation check, a single-file bug with a clear stack trace). If you could describe the diff in one sentence, skip the plan.',
            'Combine them: plan to investigate and design, approve, then execute in the same session. The Explore subagent is fast, read-only and has its own context, so discovery output stays there and only a summary returns.',
        ],
    },
    {
        'heading': 'Iterative refinement, headless mode and CI (3.5, 3.6)',
        'points': [
            'Refinement toolkit: two or three concrete input/output examples when prose is read inconsistently; tests first (behavior, edge cases, performance) and then share the failures; one specific edge-case example, such as a null value and its expected result, to fix a bug.',
            'Interview pattern: in an unfamiliar area, have Claude ask you questions (cache invalidation, failure modes), capture a spec, then build, preferably in a fresh session.',
            'Interacting problems go in one detailed message; independent problems are fixed one after another. After about two failed corrections, clear the session and restart with a better prompt.',
            'Non-interactive mode: claude -p "prompt" (or --print) processes the prompt, prints the result and exits; a non-zero exit code means failure. Without -p a pipeline step can hang waiting for input. Piped stdin is capped at 10 MB.',
            'Structured output: --output-format text, json or stream-json. json returns the result with session id and usage; add --json-schema (print mode only) to get validated data in the structured_output field, which a script can post as inline pull-request comments.',
            'Context for CI: CLAUDE.md (testing standards, fixtures, review criteria) loads in a plain claude -p run. --bare skips CLAUDE.md, hooks, skills, MCP servers and auto memory for reproducibility, so pass guidance with --append-system-prompt-file or --settings.',
            'Permissions in CI: --allowedTools "Bash(git diff *),Read" pre-approves (it does not restrict); --permission-mode dontAsk denies whatever is not pre-approved. GitHub Action: anthropics/claude-code-action@v1. With a prompt input it runs automatically; without one it answers @claude mentions. Keep keys in GitHub Secrets.',
            'Quality rules: review in a fresh, independent instance, not the session that wrote the code; on reruns include prior findings and ask for only new or unaddressed issues; include existing tests when generating tests; document test standards and fixtures in CLAUDE.md.',
        ],
    },
])
