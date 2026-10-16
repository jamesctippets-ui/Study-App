"""CCAO-F group 1: knowledge questions, lessons, games, case study and cheat sheet for Domains 4 and 5.

Domain 4 Workflow Integration and Solution Design (16%) and Domain 5 Configuration and Knowledge
Management (12%) of the Claude Certified Associate - Foundations exam guide (version 1.0, effective
July 2026). The flashcards (f1001..f1062) and the workflow questions (q1001.., msq1001.., tf1001..)
live in data/ccao_b1.py. This group adds the knowledge questions (q1101.., msq1101.., tf1101..),
one lesson per category, three mad libs, two sequences, three compare items, one workflow case study
and the cheat-sheet sections for both categories.

Product facts were checked in October 2026 against the Claude Help Center (Projects and project
instructions, retrieval for Projects, Skills, plugins, connectors and the Google Workspace
connectors, enterprise search, personalization features, file uploads), the Claude prompting
best-practices documentation, and Anthropic's AI Fluency framework (automation, augmentation and
agency; gradual release). Items avoid dated limits so they stay true as the products change.
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


_WF = 'workflow'
_KN = 'knowledge'

FLASHCARDS = []

QUESTIONS = [
    # ---------------- Domain 5, objective 1: configure Projects with instructions and knowledge ----------------
    _mc('q1101', _KN,
        "A customer-care lead is setting up a Project for her agents. She has a 20-page refund policy, and she wants every draft reply to open with an apology, stay under 150 words and quote the policy section it relies on. How should she set it up?",
        ["Paste the refund policy and the three drafting rules together into the project instructions, so that everything Claude needs is in one place",
         "Upload the refund policy as project knowledge and write the three drafting rules into the project description, where the whole team can read them",
         "Upload the refund policy as project knowledge and write the three drafting rules into the project instructions",
         "Upload the refund policy as project knowledge and ask each agent to type the three drafting rules at the start of every new chat"],
        2,
        "Rules about how to draft belong in the project instructions, which apply to every chat in the Project, while the policy is reference material that belongs in project knowledge. Merging both into the instructions mixes facts with rules and makes the policy hard to update. Claude cannot see a Project's description, so rules placed there are never applied. Retyping the rules in every chat is exactly what standing instructions are meant to avoid, and it invites drift between agents."),
    _mc('q1102', _KN,
        "An HR specialist types 'Always cite the policy section and never promise exceptions' into the description field of her new Project. Claude's replies ignore the rule. What is the best explanation and fix?",
        ["Claude cannot see a Project's name or description, so the rule belongs in the project instructions",
         "Claude cannot see the description, so she should repeat the rule at the start of every chat in the Project",
         "Claude reads the description only after the Project is shared with colleagues, so she should invite one to unlock it",
         "The rule needs its reasons spelled out, so she should extend the description with a paragraph on why exceptions are risky"],
        0,
        "The Help Center states that Claude has no access to a Project's name and description; they are labels for people. Standing rules go in the project instructions, which apply to every chat in the Project. Repeating the rule in each chat has the right diagnosis but depends on every user remembering it. Sharing the Project changes who can see it, not what Claude reads, and giving reasons helps Claude apply a rule only when Claude can see the rule in the first place."),
    _mc('q1103', _KN,
        "In one chat inside a team's Project, an analyst tells Claude to report revenue in thousands of euros. In a new chat in the same Project the next day, Claude reports in plain euros. What is the most reliable way to make the preference apply to everyone who uses the Project?",
        ["Ask Claude at the end of each chat to remember the preference for the next chat in the Project",
         "Ask each analyst to add the preference to their own account-wide instructions as a standing rule",
         "Continue all revenue analysis in the original chat so that the preference stays in view",
         "Add the preference to the project instructions so that every chat in the Project applies it"],
        3,
        "Context from one chat is not shared with the other chats in a Project unless it is added to the Project's knowledge or instructions, so a standing rule belongs in the project instructions. Asking Claude to remember is personal and unreliable rather than a shared configuration. Account-wide instructions would apply to all of that analyst's conversations, including unrelated work, and depend on every person doing it. One endless chat grows unwieldy and leaves everyone else out."),
    _mc('q1104', _KN,
        "A freelance consultant works for two clients. Client A wants formal British English; Client B wants a casual American tone. She also wants every answer, for either client, to define acronyms on first use. Where should she save these rules?",
        ["Each client's style rules in that client's own Project, and the acronym rule in her account-wide instructions",
         "All three rules in her account-wide instructions, each labeled with the client it applies to",
         "Both clients' style rules in one Project, with a line telling Claude which client is being discussed",
         "All three rules as documents in a single Project's knowledge, so that Claude can look up whichever one applies"],
        0,
        "Account-wide instructions apply to every conversation, so they suit only preferences that hold everywhere, such as defining acronyms. Client-specific rules belong in that client's Project, whose instructions apply to its chats alone. Putting conflicting style rules in one place makes Claude guess which applies and lets one client's tone leak into the other's work. Instructions describe behavior while knowledge is reference material, so rules saved as documents are not applied as standing instructions."),
    _mc('q1105', _KN,
        "A policy team's Project now holds several hundred documents, and an indicator shows that Claude is searching the material rather than reading all of it at once. Answers sometimes draw on the wrong policy. Which habit helps most?",
        ["Combine all of the documents into one large file so that Claude has a single document to search",
         "Copy the most important policies into the project instructions so that they are always in view",
         "Name the specific document in each question, and keep clear, descriptive file names",
         "Ask Claude to read every file in full before it answers each question"],
        2,
        "When knowledge is large, retrieval pulls out the passages that matter instead of loading everything, so precise pointers steer it best: naming the document and using descriptive file names. One merged file removes the structure that tells one policy from another. Copying policies into the instructions creates second copies that go stale and crowds the standing context. Reading every file in full is the opposite of how retrieval handles volume."),

    # ---------------- Domain 5, objective 2: manage uploaded knowledge and connectors ----------------
    _mc('q1106', _KN,
        "A benefits Project still contains last year's leave policy alongside the updated policy that was added in the spring. Staff report that Claude sometimes quotes the old entitlements. What is the best fix?",
        ["Add an instruction telling Claude to prefer the most recent information whenever documents disagree",
         "Put the word 'OLD' at the start of the previous policy's file name and leave it in the Project",
         "Ask staff to compare any entitlement Claude quotes with the current policy before relying on it",
         "Remove the outdated policy so that the Project holds one current, clearly named version"],
        3,
        "A Project keeps whatever it is given and Claude cannot tell by itself that a file is outdated, so the reliable fix is a single source of truth. An instruction to prefer newer information depends on Claude judging which document is newer and leaves two conflicting copies in place. A renamed file can still be retrieved and quoted. Asking staff to double-check treats the symptom and puts the burden on every user."),
    _mc('q1107', _KN,
        "An analyst who uses the Google Drive connector asks Claude to summarize the 'Q3 board pack' folder. Claude cannot find it, although a colleague can open the folder. What is the best first step?",
        ["Ask an administrator to give Claude its own account with access to the folder",
         "Check whether her own Google account has been given access to that folder",
         "Ask the colleague to export the folder's documents and upload them to the chat",
         "Disconnect and reconnect the connector until the folder appears"],
        1,
        "Claude inherits the signed-in person's permissions, so it can see only what her own account can open. If a colleague can see the folder and she cannot, the gap is probably her access, which the folder's owner or an administrator can fix. Claude has no separate account to authorize. Passing files around by hand works around the missing permission instead of resolving it and may sidestep the access decision the owner made. Reconnecting does not change what her account is allowed to open."),
    _mc('q1108', _KN,
        "An Owner on a Team plan enables the Google Drive connector for the whole organization. A week later, several members say that Claude still cannot see any of their documents. What is the most likely reason?",
        ["Claude needs several days to process the organization's files after enablement, so members should simply wait",
         "The Owner must first copy each member's documents into a shared Project before they can be read",
         "Enabling made the connector available, but each member still has to sign in to Google with their own account",
         "Only Owners can use connectors, so members must be promoted before they can connect their accounts"],
        2,
        "On Team and Enterprise plans, enablement makes a connector available to the organization but grants nobody access to data. Each person normally authenticates individually, which keeps Claude within that person's own permissions. Waiting changes nothing because no step is pending, no copying into Projects is involved, and members do not need the Owner role to connect their own accounts."),
    _mc('q1109', _KN,
        "An Owner wants staff to let Claude search and read documents in a connected service freely, but wants any change or deletion to need a person's confirmation. What should the Owner do?",
        ["Block the connector for everyone and ask staff to upload the files they need into their chats instead",
         "Allow every action on the connector and train staff to watch closely for unwanted changes",
         "Replace individual sign-in with one shared read-only login so that nobody can change anything",
         "Let reading actions run without asking, and set writing and deleting actions to need approval"],
        3,
        "Owners can set a connector's actions to run freely, need approval or be blocked, and these settings only narrow what the service already permits. Blocking everything throws away the live access that makes the connector useful. Allowing everything and relying on vigilance replaces a configured control with hope. A shared login removes the link to each person's own permissions and can reach whatever that credential can, which widens exposure instead of limiting it."),
    _mc('q1110', _KN,
        "A team member finds a custom connector on a public forum that promises to link Claude to the company's project-tracking tool. She is tempted to add it, reasoning that a connector can only see what she can already open. What is the best course of action?",
        ["Add it to a private Project first, since a Project keeps any problems contained to that workspace",
         "Ask the Owner or IT to review the source first, since Anthropic does not verify custom connectors",
         "Add it, since a connector can only see what she can already open and the risk is therefore removed",
         "Add it for now and remove it later if the team does not find it useful or runs into trouble"],
        1,
        "Anthropic does not verify custom connectors, and the connected service handles data under its own terms, so trust in the publisher has to be checked before anything is connected. Permission inheritance limits what Claude can reach for a person, but an unknown party's connector still handles the data it touches, and one built on a shared credential reaches whatever that credential allows. Making a Project private changes who sees the Project, not what a connector can do, and trying it first exposes data in the meantime."),

    # ---------------- Domain 5, objective 3: create effective system-level instructions ----------------
    _mc('q1111', _KN,
        "A procurement team is writing the standing, system-level instructions for a Project that drafts replies to supplier queries. Which approach is most likely to give consistent, useful replies?",
        ["Describe Claude as a world-class procurement expert and tell it to be thorough, accurate and professional in every reply, whatever the question",
         "Paste the entire supplier handbook into the instructions so that the rules and the facts they rely on sit together in one place",
         "Name the reader and the tone, set a length and layout, point to the file to quote, and say what to do when the answer is missing",
         "Write short commands in capital letters, such as NEVER GUESS and ALWAYS BE ACCURATE, so that no rule can be overlooked"],
        2,
        "Effective standing instructions are specific: the audience and tone, the format, the source to rely on and a fallback for missing information. A grand title and general virtues give Claude nothing to act on. The handbook is reference material that belongs in knowledge, where it can be updated without touching the rules. Anthropic's guidance for current models is to use normal, clear wording rather than shouted commands, which can lead Claude to over-apply a rule."),
    _mc('q1112', _KN,
        "A legal-operations Project answers staff questions from an uploaded contract playbook. Now and then Claude gives confident guidance on a question that the playbook does not cover. Which change to the instructions best reduces this?",
        ["Tell Claude to answer only from the playbook, cite the section it used, and say when the playbook is silent and who to ask",
         "Tell Claude to be extra careful and to double-check every answer before it replies to a staff member",
         "Tell Claude to refuse any question whose topic is not listed in the playbook's table of contents",
         "Add the most common out-of-scope questions, with model answers written by the team, to the instructions"],
        0,
        "A fallback instruction removes the pressure to fill gaps with plausible guesses: it grounds answers in the supplied document, asks for the source, and says what to do when the document does not answer, such as route the question to a named person. 'Be careful' gives Claude nothing concrete to do. Refusing by table of contents blocks questions that the body of the playbook does answer. A growing list of model answers chases examples instead of fixing the rule, and it goes stale."),
    _mc('q1113', _KN,
        "The instructions of a shared reporting Project have grown to forty rules added by different people over a year. They include 'keep every answer under 100 words' and 'always give a full step-by-step explanation'. Replies are now erratic. What is the best fix?",
        ["Add a final rule saying that the most recent rule wins whenever two rules in the list disagree with each other",
         "Review the whole set, merge duplicates, resolve conflicts and explain the reason for each remaining rule",
         "Put the most important rules in capital letters so that they outweigh the others in the list",
         "Delete the instructions entirely and rely on the uploaded files to guide how Claude replies"],
        1,
        "Rules that pull in opposite directions leave Claude to guess, so the cure is to edit the set into one consistent, explained list and then test it. A 'latest rule wins' line assumes Claude can tell which rule is latest, and capitals add pressure without resolving the contradiction. Deleting everything throws away the rules that were working, and uploaded files supply facts, not behavior."),
    _mc('q1114', _KN,
        "A communications team's Project instructions include this month's product prices and promotion end dates, so someone has to rewrite the instructions every month, and an old figure occasionally survives. What is the better design?",
        ["Keep the figures in the instructions but have Claude ask for the current prices at the start of each chat",
         "Move the figures into a named knowledge file that is replaced each month, and have the instructions say to quote it",
         "Move the prices and dates into the account-wide instructions, since they are needed in every conversation",
         "Remove the figures from the Project altogether and ask each writer to paste the current ones into every request"],
        1,
        "Instructions should hold stable behavior; facts that change belong in one knowledge file that can be swapped without touching the rules, with the instructions telling Claude to quote it. Having Claude ask for prices or having writers paste them reintroduces manual steps and errors. Account-wide instructions would push this month's promotions into every unrelated conversation."),

    # ---------------- Domain 5, objective 4: inform, maintain and update configurations ----------------
    _mc('q1115', _KN,
        "The owner of a shared Project wants to change its instructions to fix a tone problem. How should she make the change so that she does not break behavior that works today?",
        ["Make the change in the live Project, then watch for complaints over the next week",
         "Make this change together with the other improvements she has in mind, to save the team repeated updates",
         "Ask Claude whether the new instructions look better and keep them if it agrees",
         "Run a small fixed set of representative requests before and after the change, and compare the results"],
        3,
        "A regression test set shows whether the change fixed the tone and whether anything else got worse, because the same requests, including a few tricky ones, are used each time. Waiting for complaints makes the users the test. Bundling several changes hides which one caused a problem. Claude's opinion of its own instructions is not evidence of how the outputs actually change."),
    _mc('q1116', _KN,
        "Thirty people share a Project. Several of them add their own files and adjust the instructions, and answers have become inconsistent. What should the Project's owner do?",
        ["Post a message asking everyone to stop editing the Project, and trust the team to follow it",
         "Let everyone keep editing but ask them to leave a note in the chat explaining each change they make",
         "Delete the shared Project and have each person maintain a private Project of their own instead",
         "Limit edit rights to a few named maintainers and give everyone else access to view and chat"],
        3,
        "Sharing offers Can view and Can edit roles, so a configuration can be protected by permissions rather than by good intentions: only maintainers who understand the Project's purpose change its instructions and files. A request to stop relies on compliance. Notes in chats are scattered and do not prevent a bad edit. Personal Projects multiply the versions, so each person's answers drift further apart."),
    _mc('q1117', _KN,
        "After a policy update, a Project owner replaced two knowledge files and rewrote part of the instructions. Two days later, staff complain that answers have 'changed without warning', and nobody can say what was altered. What would have prevented this?",
        ["Keeping a change log of what was changed, by whom and why, and telling users about the update",
         "Making all edits outside working hours so that fewer people notice a difference in the answers",
         "Telling Claude to announce at the start of each chat that the Project's settings have been updated",
         "Holding policy updates until the next quarterly review so that changes arrive in one batch"],
        0,
        "A change log records what changed so that a shift in behavior can be traced and reversed, and a short notice tells users what to expect. Editing in quiet hours hides the change instead of explaining it. Claude has no way of knowing what was edited, so an announcement instruction cannot work. Holding a policy update for a quarter leaves stale knowledge in use."),
    _mc('q1118', _KN,
        "A team installed a custom skill for formatting expense summaries, but Claude rarely uses it when someone asks for an expense summary. What is the best first fix?",
        ["Paste the skill's full instructions into every expense request so that Claude always sees them",
         "Rewrite the skill's description to say what it does and when to use it, then retest it with sample requests",
         "Add more reference files to the skill so that it looks more substantial and complete to Claude",
         "Move the skill's instructions into the account-wide instructions so they apply to every conversation"],
        1,
        "Claude first sees only a skill's name and description and decides from them whether to load the rest, so a vague description means the skill is ignored or fires at the wrong time. Sharpening it and retesting with sample requests fixes the cause. Pasting the instructions defeats the purpose of a skill, extra files do not change how a skill is selected, and account-wide instructions would apply the formatting to every conversation, expenses or not."),
    _mc('q1119', _KN,
        "A colleague forwards a skill file from a public website that promises to 'polish any report automatically'. It includes scripts. What should happen before anyone installs it?",
        ["Install it in a personal account first, since a skill can only change how a report looks and cannot reach anything else",
         "Install it and try it on non-sensitive documents only, which removes any risk from an unknown publisher",
         "Have someone who manages the organization's tools review the publisher and scripts first, and add it only if trusted",
         "Install it for the whole team at once so that any problems show up quickly and can be fixed together"],
        2,
        "A skill can carry instructions and code, and the Help Center warns that untrusted skills can expose data through prompt injection or data exfiltration, so skills should come only from trusted sources and be reviewed first. A skill is not limited to appearance. Test data limits the damage but does not make an unknown publisher trustworthy, and rolling it out to everyone multiplies the exposure."),

    # ---------------- Multiple-select ----------------
    _ms('msq1101', _KN,
        "A support team is dividing its material between a Project's instructions and its knowledge. Which TWO items belong in the instructions? (Choose two.)",
        ["Who will read the replies and the tone they should have",
         "The full text of the current returns policy",
         "What Claude should do when the knowledge does not contain the answer",
         "Last quarter's customer-satisfaction survey results",
         "The product catalogue with this month's prices"],
        [0, 2],
        "Instructions hold standing guidance about behavior: the audience and tone, and a fallback for questions the knowledge cannot answer. The returns policy, the survey results and the price list are reference material, which belongs in project knowledge, where it can be replaced when it changes without touching the rules."),
    _ms('msq1102', _KN,
        "A shared Project's knowledge has become unreliable because old and new documents are mixed together. Which THREE practices keep uploaded knowledge trustworthy? (Choose three.)",
        ["Upload every draft as well, in case someone wants to compare versions",
         "Keep one approved version of each document and retire superseded copies",
         "Rely on Claude to notice which documents are out of date and ignore them",
         "Give each file a descriptive name that includes its date or version",
         "Review the files on a schedule and replace any that no longer match current policy"],
        [1, 3, 4],
        "A single source of truth, descriptive names with dates or versions, and a regular review keep a Project current and let both people and retrieval pick the right file. Extra drafts add conflicting copies, and Claude cannot reliably tell that a file is outdated: it quotes what it is given."),
    _ms('msq1103', _KN,
        "Which TWO statements about connecting Claude to services such as Google Drive and Gmail are accurate? (Choose two.)",
        ["Claude can reach only the files and messages that the signed-in person could already open",
         "An Owner's permission settings can give Claude more access than the connected service itself allows",
         "On a Team plan, once an Owner enables a connector, each person still signs in with their own account",
         "Claude reads charts and pictures embedded in a Google Doc in the same way as the text",
         "Enabling a connector lets Claude search every employee's mailbox for the Owner"],
        [0, 2],
        "Claude inherits each person's own permissions, and on Team and Enterprise plans enablement makes a connector available without granting access, so members normally authenticate individually. Owner settings can only narrow what a service allows, never widen it. The Drive connector reads text only, so images inside documents are not seen, and the Gmail connector works within the mail the connected person can already open."),
    _ms('msq1104', _KN,
        "The owner of a shared Project has just edited its instructions. Which TWO steps best protect the people who rely on it? (Choose two.)",
        ["Rerun a fixed set of representative requests and compare the answers with notes on what good looks like",
         "Delete the old chats so that nobody sees answers produced under the earlier instructions",
         "Ask Claude to confirm that the new instructions are an improvement",
         "Record what changed, who changed it and why, and tell users what is different",
         "Wait for users to report problems before checking anything"],
        [0, 3],
        "Rerunning the same test requests shows whether anything got worse, and a change log plus a short notice lets users and colleagues trace and understand shifts in behavior. Deleting chats hides evidence without fixing anything, Claude's agreement is not a measurement of output quality, and waiting for complaints turns users into testers."),
    _ms('msq1105', _KN,
        "Which TWO situations call for building a skill rather than adding more text to a Project's instructions? (Choose two.)",
        ["A fixed report layout must be applied across many chats and Projects, but only when someone asks for that report",
         "The team's current price list must be available to every chat in one shared Project, whoever starts it",
         "A procedure with a template file and a script should be loaded only when a matching request comes up",
         "A personal preference for British spelling should apply to every conversation the person has",
         "A reminder that this quarter's priority is the product launch should shape every reply in one Project"],
        [0, 2],
        "A skill packages a procedure that Claude loads on demand when a request matches, and it works across chats and Projects, which fits a recurring report layout and a procedure with its own template and script. A price list is project knowledge, a preference for every conversation is an account-wide instruction, and a standing priority for one Project's replies is a project instruction."),

    # ---------------- True / false ----------------
    _tf('tf1101', _KN,
        "Claude can read a Project's name and description, so standing rules can safely be written in the description field.",
        False,
        "The Help Center says Claude does not have access to a Project's name or description; they are labels for people. Standing rules belong in the project instructions."),
    _tf('tf1102', _KN,
        "Instructions saved in a Project apply to every chat inside that Project, but not to the person's chats outside it.",
        True,
        "Project instructions are scoped to their own Project. The account-wide setting is the one that follows a person into every conversation."),
    _tf('tf1103', _KN,
        "An Owner's permission settings on a connector can give Claude more access than the connected service itself allows.",
        False,
        "Owner settings such as always allow, needs approval and blocked only narrow what the source system already permits. They never grant more access than the service gives."),
    _tf('tf1104', _KN,
        "With the Gmail connector, Claude works only within the mail that the connected person can already open.",
        True,
        "Claude inherits the signed-in person's permissions in the connected service, so it cannot see other people's mailboxes. When something cannot be found, the first check is the person's own access."),
    _tf('tf1105', _KN,
        "A Google Doc added to a Project from Drive stays linked to the live document, whereas a file uploaded from a computer remains a static copy.",
        True,
        "Docs added from Drive stay in step with the source, so Claude works from the current version. An uploaded file changes only when someone replaces it, which is why uploads of frequently changing documents go stale."),
    _tf('tf1106', _KN,
        "Telling Claude what to do when the knowledge does not contain an answer, for example to say so and name who to ask, reduces confident guessing.",
        True,
        "A fallback instruction gives Claude a sanctioned alternative to inventing a plausible answer, and it works best when paired with a rule to quote the source whenever an answer does exist."),
    _tf('tf1107', _KN,
        "An instruction telling Claude to ignore an old policy file is just as reliable as removing that file from the Project.",
        False,
        "The file stays available and can still be retrieved and quoted. Instructions guide behavior but do not guarantee a document is never used, whereas removing the file leaves a single source of truth."),
    _tf('tf1108', _KN,
        "Claude loads the full contents of every installed skill at the start of each conversation.",
        False,
        "Skills use progressive disclosure: Claude first sees only each skill's name and description and reads the rest only when a request matches, which stops many skills from crowding the context window."),
]

LESSONS = [
    {
        'id': 'workflow-design-integrate-communicate',
        'title': 'Designing, Integrating and Explaining Claude-Assisted Workflows',
        'summary': "How to use Claude to analyze requirements and use cases, support research, planning and process improvement, prototype and iterate on solutions, fit Claude into an existing workflow by augmenting or redesigning it, and explain its value and limits to stakeholders (Domain 4).",
        'diagram': None,
        'vocabIds': ['f1001', 'f1006', 'f1009', 'f1015', 'f1017', 'f1023', 'f1026', 'f1027', 'f1032'],
        'quizIds': ['q1001', 'q1003', 'q1006', 'q1010', 'q1015', 'q1019'],
        'reading': (
            "A workflow is a repeatable chain of steps that turns an input into a result: interview notes into a requirements list, customer emails into replies, figures into a report. Start with analysis. When sales asks for 'better lead tracking', paste in your interview notes and have Claude list each requirement with its source, flag conflicts and assumptions, and rewrite vague words such as 'fast' as measurable proposals. The people who own the need still confirm the result. Then judge use-case fit: work that recurs often, is text-heavy, can be checked quickly and costs little if wrong makes a strong first pilot, while decisions about individuals, exact payroll figures and restricted data do not."
            "\n\n"
            "Claude can also support research, planning and process improvement, but it knows only what you tell it. For research, state the decision the findings feed and the sources allowed, ask for findings in a table by source and date, then open the sources yourself. Describe how a process really runs, with steps, owners and timings, and ask for a process map and the likely bottleneck, the step where work queues up. Speeding up any other step does not raise output, and Claude's candidate comes from your description, so confirm it with timing data. For plans, give the goal, deadline, team capacity and constraints and ask for a work breakdown structure and a risk register, and run a pre-mortem: assume the launch failed and list why. Compare options in a decision matrix whose weights your stakeholders set."
            "\n\n"
            "For solution design, build something small and let people react. Ask Claude for a working prototype as an artifact, such as a shift-coverage calculator, let three colleagues try it and revise where they stumble. Each round is a feedback loop. Anything that must connect to company systems, handle sensitive records or run at scale is a technical implementation: describe the problem, the data and your prototype, and escalate it to Claude Developers or Architects."
            "\n\n"
            "To integrate Claude, choose an integration point, one step with a defined input, output and receiver. Anthropic's AI Fluency framework names three modes: automation, where Claude carries out a task you define; augmentation, where you and Claude work as thinking partners and you decide; and agency, where Claude is set up in advance to act for you and needs the clearest limits. Most Associate work follows the draft-review-approve pattern: Claude drafts a reply from the ticket and approved answers, the agent edits it, and only then is it sent. If a step exists only because of an old limit, such as retyping handwritten notes, redesign the workflow rather than bolting Claude on. Record a short standard operating procedure: inputs, instructions, reviewer, destination and failure handling."
            "\n\n"
            "Stakeholders will ask whether it works, so bring evidence. Record a baseline first, such as minutes per report and corrections needed, run a pilot with a small group and compare. A value case states the measured gain, the cost, the known limits and the review that stays with people. Set expectations early: Claude can state inaccurate specifics and knows only what you tell it. Widen access in stages (gradual release) and plan for adoption with training, a named owner and a place to report problems."
        ),
        'fundamentalsLabel': 'New to workflow design? See the everyday analogy',
        'fundamentals': "Think of a busy restaurant kitchen that hires a fast, tireless prep cook who has never seen your menu. You would not hand over the whole dinner service on day one. You would decide which station suits the newcomer, write down the recipe, taste each dish before it leaves the pass, try them on one quiet shift and compare the numbers with the week before. Adding Claude to a team process works the same way: pick the step, give clear instructions, keep a person checking the result, pilot it small and measure against what you had.",
        'keyTerms': ['Requirements analysis', 'Use-case fit', 'Bottleneck', 'Prototype', 'Augmentation, automation and agency', 'Draft-review-approve', 'Baseline measurement', 'Value case', 'Escalation to specialists'],
        'commonTraps': [
            "Claude's lists of requirements, bottlenecks and risks are hypotheses built from what you told it, so stakeholders and real data must confirm them.",
            "Speeding up a step that is not the bottleneck changes little, and changing several things at once makes it impossible to tell what helped.",
            "Dropping the review stage after a good first week turns assistance into unchecked automation; relax controls in stages and never where errors are costly.",
            "Connections to company systems, authentication, sensitive records or scale are for Claude Developers and Architects, who need your clear problem statement rather than a finished build.",
            "A value case resting on Claude's own time estimate, one impressive example or login counts is weaker than measured results against a baseline recorded before the pilot.",
        ],
        'scenario': "An operations analyst at a regional retail chain spends two days each month turning store managers' emails into a performance summary for executives. She asks Claude to turn a sample of the emails into a table of each store's issue, the evidence given and the owner, flagging gaps. She maps the current process, notices that chasing late emails takes longer than the writing, and has Claude draft a reminder template. After a four-week pilot in two regions she shows the executives the time per summary and the corrections needed before and after, plus two errors that review caught and how they were fixed.",
        'onTheJob': "Start small and keep score. Pick one step, write down today's numbers before you change anything, and keep a short log of what you changed and what happened. Ask Claude for hypotheses, then go and check them with the people who do the work. When you present, lead with measured results and say plainly where Claude needed correcting and which reviews stay with people; that candor keeps a sponsor's trust after the first visible mistake. When a request involves company systems, credentials or customer records at scale, stop prototyping and hand specialists a one-page problem statement with your evidence.",
    },
    {
        'id': 'knowledge-projects-instructions-connectors',
        'title': 'Configuring Projects, Instructions and Connected Knowledge',
        'summary': "How to configure Projects with instructions and knowledge sources, write effective standing instructions, manage uploaded files and connectors such as Google Drive and Gmail, and keep configurations current, tested and trusted (Domain 5).",
        'diagram': None,
        'vocabIds': ['f1033', 'f1034', 'f1035', 'f1039', 'f1041', 'f1043', 'f1047', 'f1051', 'f1060'],
        'quizIds': ['q1102', 'q1104', 'q1106', 'q1107', 'q1112', 'q1115'],
        'reading': (
            "Claude offers several places to store what it should know and how it should behave. Account-wide instructions (Settings, 'Instructions for Claude') apply to every conversation, so keep them for preferences true everywhere, such as defining acronyms. A Project is a workspace with its own chats, instructions and knowledge: project instructions apply to every chat in that Project and nowhere else, and project knowledge is the files and text Claude can draw on in each of those chats. A skill is a procedure Claude loads on demand. Two traps: Claude cannot see a Project's name or description, so a rule typed there is ignored, and one chat's context is not shared with the others unless it goes into the instructions or knowledge."
            "\n\n"
            "Keep behavior and reference material apart: instructions say how to act, while knowledge says what is true and can be replaced without touching the rules. A support team's instructions might read: 'You draft replies for non-technical retail customers. Keep them under 150 words and quote the relevant section of the refund policy file. If the policy does not cover the question, say so and suggest asking a team lead.' The last sentence is a fallback instruction: it stops Claude guessing when the knowledge is silent. Keep rules consistent, say what to do as well as what to avoid, explain why, skip the shouting, and never put passwords or API keys in instructions."
            "\n\n"
            "Claude cannot tell that a file is outdated, so if last year's and this year's leave policy both sit in the Project, it may quote either. Keep a single source of truth: one approved version of each document, replaced when it changes, with a descriptive name such as 'Leave policy 2026-07'. On paid plans, when stored knowledge nears the context limit, retrieval switches on automatically and an indicator appears: Claude searches for the relevant passages instead of holding everything in view, and clear file names and naming the document in your question help it. A Google Doc added from Drive stays synced with the live file; an uploaded file is a static copy."
            "\n\n"
            "A connector links Claude to a service such as Google Drive or Gmail. Claude inherits the signed-in person's permissions, so it cannot open a folder you cannot open; if it cannot find a file, check your own access first. On Team and Enterprise plans an Owner enables a connector for the organization, which makes it available but grants nobody access: each person normally signs in with their own account. Owners can set actions to run freely, need approval or be blocked, which only narrows what the service allows; read what Claude proposes before approving a send or share. Custom connectors are not verified by Anthropic, so add connectors, skills and plugins only from sources you trust, since a bad one can expose data."
            "\n\n"
            "Name an owner for each shared Project or skill, give Can edit only to maintainers and Can view to everyone else, and keep a change log of what changed, who changed it, when and why. Before editing instructions, keep a regression test set, a handful of representative and tricky requests with notes on good answers, and run it before and after, changing one thing at a time. Tell users what changed, and review on a schedule, retiring stale files and unneeded connectors and shares."
        ),
        'fundamentalsLabel': 'New to Projects and connectors? See the everyday analogy',
        'fundamentals': "Imagine hiring a temp for a department. The briefing you give on day one ('our customers are retailers, keep replies short, pass refund disputes to a team lead') is the instructions. The binder of policies on the desk is the knowledge. The temp's building badge decides which rooms they can enter, which is how a connector works: it opens only the doors the signed-in person is allowed through. If the binder holds last year's policy next to this year's, the temp may follow either, so someone has to keep the binder current and tell the temp what changed.",
        'keyTerms': ['Project instructions', 'Project knowledge', 'Account-wide instructions', 'Fallback instruction', 'Single source of truth', 'Retrieval (RAG)', 'Permission inheritance', 'Skill', 'Regression test set'],
        'commonTraps': [
            "A Project's name and description are not visible to Claude, so standing rules written there are never applied; they belong in the project instructions.",
            "Account-wide instructions apply to every conversation, so client- or task-specific rules placed there leak into unrelated work.",
            "Enabling a connector for the organization grants no one access, and no setting can give Claude more than the signed-in person can already open.",
            "Leaving old and new versions of a document in a Project invites Claude to quote either; an instruction to prefer the newest does not replace removing the stale copy.",
            "Changing several rules at once, with no test requests and no log, makes it impossible to tell which change caused a problem.",
        ],
        'scenario': "A training manager sets up a Project for her team of eight to draft answers to client questions about the company's services. She uploads the current service guide and pricing sheet as knowledge, and writes instructions that name the readers, set a 150-word limit, require a quote from the service guide, and tell Claude to say so and route the question to her when the guide is silent. She gives two colleagues Can edit and everyone else Can view. When prices change in the spring, she replaces the pricing file instead of adding a second copy, reruns ten saved test questions, notes the change in a log and posts a two-line update to the team.",
        'onTheJob': "Treat a shared Project like a small product with an owner. Keep a page that states the Project's purpose, a list of the files with their dates, and about ten test questions, including two that the knowledge cannot answer. When behavior shifts, check the log first. Try changes in a private test Project where you can. Before connecting a new service or installing a skill, ask who published it, what it can reach and whether the Owner has approved it, and remove access when the task ends. If a rule keeps being ignored, it is usually in the wrong place, vague, or contradicted by another rule.",
    },
]

MADLIBS = [
    {
        'id': 'ml-ccao-101',
        'cat': _WF,
        'scenario': "Before a team pilots Claude on its weekly client report, the coordinator records how long the report takes and how many corrections it needs; this is a {b1}. In the new workflow Claude writes the first version, an account manager checks and edits it, and only then is it sent, a pattern called {b2}. After the pilot she presents the measured gain, the cost, the known limits and the review that stays with people, which together form the {b3}.",
        'blanks': [
            {'key': 'b1', 'options': ['regression test set', 'baseline measurement', 'risk register'], 'correct': 1},
            {'key': 'b2', 'options': ['draft-review-approve', 'gradual release', 'impact-effort prioritization'], 'correct': 0},
            {'key': 'b3', 'options': ['assumption log', 'decision matrix', 'value case'], 'correct': 2},
        ],
        'explanation': "Recording how long the work takes and how many corrections it needs before Claude is involved gives a baseline measurement, the only fair yardstick for the pilot. Claude drafts, a responsible person reviews, and only then is the work released: the draft-review-approve pattern, whereas gradual release means widening Claude's scope in stages. The measured gain, cost, limits and remaining review form a value case; a decision matrix scores options and an assumption log tracks unproven beliefs.",
    },
    {
        'id': 'ml-ccao-102',
        'cat': _KN,
        'scenario': "For one team's reply-drafting Project, the audience, the tone and what to do when the answer is missing are standing rules, so they go in {b1}. The current refund policy is reference material, so it goes in {b2}. A preference that should hold in every conversation a person has, such as spelling out acronyms on first use, belongs in {b3}.",
        'blanks': [
            {'key': 'b1', 'options': ['the project description', 'project instructions', 'project knowledge'], 'correct': 1},
            {'key': 'b2', 'options': ['project instructions', 'account-wide instructions', 'project knowledge'], 'correct': 2},
            {'key': 'b3', 'options': ['account-wide instructions', 'project knowledge', 'a skill'], 'correct': 0},
        ],
        'explanation': "Standing rules about audience, tone and fallback behavior belong in the project instructions; Claude cannot see a Project's description. Reference documents such as a policy belong in project knowledge, where they can be replaced without touching the rules. A preference that is true in every conversation is what account-wide instructions are for, while a skill loads only when a request matches it.",
    },
    {
        'id': 'ml-ccao-103',
        'cat': _KN,
        'scenario': "When the leave policy changes, the Project owner replaces the old file instead of adding a second copy, so that the Project keeps a {b1}. The new file is named 'Leave policy 2026-07', a {b2} that helps both people and retrieval pick the right document. Before editing the instructions, she runs a {b3}, a fixed set of representative requests, so that she can see whether answers got worse.",
        'blanks': [
            {'key': 'b1', 'options': ['single source of truth', 'separate copy for each team', 'backup of every earlier version'], 'correct': 0},
            {'key': 'b2', 'options': ['fallback instruction', 'descriptive file name', 'skill description'], 'correct': 1},
            {'key': 'b3', 'options': ['pre-mortem', 'gap analysis', 'regression test set'], 'correct': 2},
        ],
        'explanation': "Replacing the old file rather than adding a copy leaves one approved version, a single source of truth. A name that states the content and date is a descriptive file name. A fixed set of requests rerun before and after a change is a regression test set; a pre-mortem and a gap analysis are planning tools for other jobs.",
    },
]

SEQUENCES = [
    {
        'id': 'seq-ccao-101',
        'cat': _WF,
        'prompt': "Put the steps for bringing Claude into an existing team process in the order they are usually done.",
        'steps': [
            "Map how the process works today, with its steps, owners and handoffs",
            "Choose one step that suits Claude and define what goes in, what comes out and who receives it",
            "Record a baseline for that step: the time it takes and how often the output needs correction",
            "Write the instructions or template and decide who reviews the output",
            "Pilot with a small group for a fixed period",
            "Compare the pilot with the baseline, gather feedback and fix what went wrong",
            "Document the procedure and widen access in stages",
        ],
        'explanation': "You cannot pick a good integration point until you understand the process. The baseline measures the step you chose, so it follows that choice and must be taken before Claude changes anything. Instructions and the review step are settled before users try the workflow, the pilot is judged against the baseline, and documentation and staged release come last, once the workflow has earned them.",
    },
    {
        'id': 'seq-ccao-102',
        'cat': _KN,
        'prompt': "Put the steps for safely changing the instructions of a shared Project in the order they should happen.",
        'steps': [
            "Describe the problem and save a copy of the current instructions",
            "Run the fixed set of test requests on the current version and note the results",
            "Make one change to the instructions",
            "Rerun the same test requests and compare the answers with the notes on good output",
            "Keep the change if results improved and nothing got worse; otherwise revert it",
            "Record the change in the change log and tell users what is different",
        ],
        'explanation': "Saving the current version first makes reverting easy, and a run before the change gives you something to compare with. Making one change at a time shows what caused any difference. The decision to keep or revert follows the comparison, and the log entry and user notice come last so that they describe what is actually live.",
    },
]

COMPARE = [
    {
        'id': 'cmp-ccao-101',
        'cat': _WF,
        'scenario': "An operations team's timing data show that purchase requests wait about three days for a budget check by the approving manager, while keying a request into the system takes ten minutes. The team lead wants Claude to speed things up. Which plan is better?",
        'optionA': "Have Claude draft the text entered with each request, because data entry is the most repetitive, text-heavy step.",
        'optionB': "Have Claude assemble the budget lines, prior spend and policy flags into a one-page brief for the approving manager, who still decides.",
        'better': 'B',
        'why': "Output is limited by the step where work queues up, so improving a step that is not the constraint changes little: shaving minutes off a ten-minute task will not shorten a three-day wait. Preparing the brief targets the measured bottleneck while the manager keeps the decision. Data entry is the tempting runner-up because it looks like the easiest, most text-heavy win.",
    },
    {
        'id': 'cmp-ccao-102',
        'cat': _WF,
        'scenario': "A team has built a Claude-assisted workflow for weekly status summaries and now wants colleagues to use it. Which launch plan is better?",
        'optionA': "Email the written procedure and a recorded demo to everyone, ask them to start next Monday, and review usage figures after a quarter.",
        'optionB': "Run a short hands-on session where staff try the workflow on their own reports, name a go-to person for questions and collect feedback after two weeks.",
        'better': 'B',
        'why': "Adoption depends on trust, skills and support, which a hands-on session, a named contact and an early feedback check provide, and problems surface while they are cheap to fix. The email-and-demo launch is the tempting runner-up because it is cheap and documented, but passive material leaves people stuck at the first awkward step, and a quarterly review finds out far too late.",
    },
    {
        'id': 'cmp-ccao-103',
        'cat': _KN,
        'scenario': "Finance updates a forecast spreadsheet in the company's shared drive every morning, and an analyst wants Claude's answers to reflect the latest figures. Her Owner has enabled the Google Drive connector and she can open the file. Which approach is better?",
        'optionA': "Upload a fresh copy of the spreadsheet to the chat each morning before asking questions.",
        'optionB': "Use the Google Drive connector so that Claude reads the live file within her own permissions.",
        'better': 'B',
        'why': "A connector reaches the live file on demand within her permissions, so answers follow the daily updates without a manual step to forget. Uploading is the tempting runner-up because it gives her control over exactly what Claude sees, but every upload is a static copy that is out of date the moment finance edits the original, and a missed upload quietly produces stale answers.",
    },
]

CASE_STUDIES = [
    {
        'id': 'cs-ccao-harbour-street-quotes',
        'cat': _WF,
        'title': 'Harbour Street Conferences: Faster Quotes with Claude',
        'scenario': "Harbour Street Conferences manages meeting venues. Its events team of eight coordinators receives booking requests by email, retypes the details into a tracking sheet and drafts a quote from a price list, and a senior planner checks every quote before it goes to the client. The planner is the only person who knows which discounts are allowed. Coordinators estimate that a quote takes about two hours, and the planner sends roughly one in six back because of pricing mistakes. Lena, the operations lead, has a paid Claude plan and wants quotes produced faster without more errors. The price list is a spreadsheet that finance updates each quarter. The managing director wants a proposal by the end of the month and has asked what Claude can and cannot be trusted with. A senior executive suggests connecting Claude to the booking database so that quotes are generated and emailed to clients the moment a request arrives. Lena has no technical background, and the IT team is small and busy. She has two weeks and four coordinators who are willing to try a new approach.",
        'questions': [
            {
                'id': 'cs-ccao-harbour-street-quotes-q1',
                'type': 'mc',
                'question': "Which design best fits Lena's situation?",
                'options': [
                    "Claude drafts each quote and emails it straight to the client, and the planner reviews a sample of sent quotes each week",
                    "Claude drafts and double-checks each quote itself, so that the planner's review can be dropped to save time",
                    "Claude drafts each quote from the request and the price list, a coordinator edits it, and the planner approves it before it is sent",
                    "Claude designs a new booking process from scratch and all eight coordinators switch to it at the start of next month",
                ],
                'correct': 2,
                'explanation': "The draft-review-approve pattern removes the retyping and drafting effort while the planner's check stays where pricing errors are costly. Emailing quotes directly or dropping the planner's review removes the control that now catches roughly one error in six, and Claude cannot know which discounts are allowed. Switching all coordinators to a redesigned process at once skips the pilot that would show whether it works.",
            },
            {
                'id': 'cs-ccao-harbour-street-quotes-q2',
                'type': 'ms',
                'question': "Which TWO steps will most strengthen Lena's proposal to the managing director? (Choose two.)",
                'options': [
                    "Ask Claude to estimate the hours the whole team would save and present that figure as the expected result",
                    "Time a sample of current quotes and count the returns before the pilot, so that there is a baseline to compare with",
                    "Show the three best quotes Claude produced and leave out the ones that needed corrections, to keep the message simple",
                    "Pilot with the four coordinators, then report measured time and returns, Claude's mistakes and the checks that stay with people",
                    "State that Claude is accurate enough that the planner's review can be dropped once the pilot ends",
                ],
                'correct': [1, 3],
                'explanation': "The coordinators' two-hour figure is an estimate, not a measurement, so timing a sample and counting returns first creates the baseline that makes any improvement visible. A pilot report that includes Claude's mistakes and the review that remains is what builds credibility. Claude's own savings estimate, hand-picked best examples and a promise that review can be dropped are claims the managing director has no reason to trust.",
            },
            {
                'id': 'cs-ccao-harbour-street-quotes-q3',
                'type': 'mc',
                'question': "How should Lena respond to the executive's suggestion to connect Claude to the booking database and email quotes automatically?",
                'options': [
                    "Ask the executive for the database login so that Claude can connect to the booking system during the pilot",
                    "Write up the goal, the data involved and the pilot results, and take it to IT or Claude Developers and Architects to design",
                    "Decline the idea outright, because Claude cannot be used with the company's booking data in any form",
                    "Have Claude write the connection code and put it into use if it runs without errors in testing",
                ],
                'correct': 1,
                'explanation': "Generating quotes straight from a company database and emailing clients automatically is a technical integration involving authentication, security and reliability, which is beyond Associate scope and belongs with Developers and Architects. Lena's contribution is a clear problem statement and evidence from the pilot. Handing out credentials or deploying untested generated code creates security risk, and refusing outright ignores a legitimate need that specialists can address safely.",
            },
        ],
    },
]

CHEAT_SHEET = [
    {
        'heading': 'Workflow integration and solution design (Domain 4)',
        'points': [
            "Analyze before you build: give Claude interview notes and ask for requirements with sources, conflicts and assumptions, plus an ambiguity check that turns words like 'fast' into measurable targets. Stakeholders confirm; Claude only drafts.",
            "Use-case fit: frequent, text-heavy, easy-to-check, low-consequence work with data you may share is a strong first pilot. Decisions about individuals, exact payroll or legal figures and restricted data are poor fits. Rank ideas by impact versus effort, using criteria the team sets.",
            "Process work: map the real steps (owner, input, output), find the bottleneck, confirm it with timing data, change one thing at a time and compare with the baseline. Speeding up a step that is not the bottleneck changes little.",
            "Planning aids Claude can draft from facts you supply: work breakdown structure, risk register, pre-mortem (assume failure, list the causes), assumption log, gap analysis (needs both today's state and the target state) and decision matrix (people set the weights).",
            "Prototype in an artifact, let users try it and iterate on their feedback. Anything needing company-system integration, authentication, sensitive records or scale is escalated to Claude Developers or Architects with a clear problem statement.",
            "Modes (AI Fluency): automation = Claude executes a task you define; augmentation = thinking partners, the person decides; agency = configured in advance to act independently, which needs the clearest limits. Most Associate work is augmentation.",
            "Integrate at one integration point with a defined input, output and receiver. Draft-review-approve keeps a person accountable. Redesign, not an add-on, when a step exists only because of an old limit such as retyping notes. Write an SOP: inputs, instructions or template, reviewer, destination and failure handling.",
            "Prove and explain value: record a baseline, run a pilot, compare, then present a value case with measured gain, cost, limits and the review that stays. Avoid Claude's own estimates, one best example and activity counts. Set expectations early, release gradually and plan for adoption (training, an owner, a feedback channel).",
        ],
    },
    {
        'heading': 'Projects, instructions and knowledge (Domain 5)',
        'points': [
            "Where things live: account-wide instructions ('Instructions for Claude' in Settings) apply to every conversation; project instructions apply to all chats in that Project only; project knowledge is reference material for every chat in that Project; skills load on demand when a request matches.",
            "Claude cannot see a Project's name or description, so rules written there are ignored. Context from one chat is not shared with the other chats in a Project unless it is added to the knowledge or instructions.",
            "Instructions = behavior (role and audience, tone, format, source rule, fallback). Knowledge = facts and documents. Do not paste documents into instructions or bury rules in a document; keep volatile facts such as prices in a replaceable knowledge file.",
            "Effective instructions are specific and consistent, explain why, say what to do, name the audience, require a quote from the source and include a fallback for missing information (say so, name who to ask). Use normal wording rather than shouting, and never include passwords or API keys.",
            "Knowledge hygiene: a single source of truth, one approved version per document, descriptive names with dates or versions, superseded files retired, and a scheduled review. Claude cannot tell that a file is outdated, and an instruction to 'prefer the newest' does not replace removing the stale copy.",
            "Retrieval (RAG) on paid plans switches on automatically as knowledge nears the context limit, with a visual indicator, so a Project can hold far more material. Help it with descriptive names, related files kept together, and the document named in the question.",
            "Sharing (Team and Enterprise): Can view lets members read the Project and chat in it; Can edit lets them change its instructions and knowledge. Give edit rights only to the maintainers.",
        ],
    },
    {
        'heading': 'Connectors, skills and keeping configurations healthy (Domain 5)',
        'points': [
            "Connectors link Claude to services such as Google Drive and Gmail. Claude inherits the signed-in person's permissions and cannot reach what that person cannot open; if a file is missing, check the person's own access first.",
            "On Team and Enterprise plans an Owner enables a connector (available, but no one gets access by that step) and each person normally signs in with their own account. Owner permission levels (allow, needs approval, blocked) can only narrow access. Read each proposed action before approving it.",
            "A Google Doc added from Drive stays synced with the live file; an uploaded file is a static copy. The Drive connector reads text only, so images inside documents are not seen. Enterprise search is a permission-aware project that searches connected tools for each person.",
            "Skills are folders of instructions, scripts and resources loaded by progressive disclosure: name and description first, full content only when relevant, so the description decides whether a skill is used. Try several sample prompts and sharpen the description if it does not trigger. Build one when you keep re-explaining the same format. A plugin bundles skills and connectors.",
            "Trusted-source rule: add connectors, skills and plugins only from sources you trust and need. Custom connectors are not verified by Anthropic, and untrusted skills risk prompt injection and data exfiltration, so review the contents first.",
            "Maintain: a named configuration owner; edit rights for maintainers only; a change log (what, who, when, why); a regression test set run before and after each change, one change at a time; tell users what changed; and an access review that removes unused connectors and shares.",
        ],
    },
]

CLI_CHALLENGES = []
