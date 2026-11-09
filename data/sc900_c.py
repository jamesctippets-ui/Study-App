"""SC-900 part C: Microsoft compliance solutions (Service Trust Portal, privacy, Purview) plus the
cross-topic games: Mad Libs, Sequences, Compare pairs and a case study.

Part A (sc900_a.py) owns CATEGORIES. This file never defines CATEGORIES.
IDs: flashcards f201+, questions q201+/tf201+/msq201+, madlibs ml-sc900-*, sequences seq-sc900-*,
compare cmp-sc900-*, case study cs-sc900-adatum.
"""

COM = 'compliance'
CON = 'concepts'
ENT = 'entra'
SEC = 'security'


def fc(n, front, back, detail):
    return {'id': f'f{n}', 'cat': COM, 'front': front, 'back': back, 'detail': detail}


def mc(qid, question, options, correct, explanation, why=None):
    q = {'id': qid, 'cat': COM, 'type': 'mc', 'question': question, 'options': options, 'correct': correct, 'explanation': explanation}
    if why:
        q['whyTested'] = why
    return q


def tf(qid, question, answer, explanation):
    return {'id': qid, 'cat': COM, 'type': 'tf', 'question': question, 'answer': answer, 'explanation': explanation}


def ms(qid, question, options, correct, explanation):
    return {'id': qid, 'cat': COM, 'type': 'ms', 'question': question, 'options': options, 'correct': correct, 'explanation': explanation}


FLASHCARDS = [
    # ---- Service Trust Portal and privacy ----------------------------------------------
    fc(201, 'Service Trust Portal',
       'Microsoft\'s portal for compliance and trust documents: audit reports, certifications (for example ISO and SOC), compliance guides, penetration test and security assessment results, whitepapers and data protection resources for Microsoft cloud services.',
       'It is where you get evidence of how Microsoft meets standards, for example to give your own auditor. You sign in with a Microsoft account, and some documents need an agreement.'),
    fc(202, 'Microsoft privacy principles',
       'Six principles: control (you choose how your data is used), transparency (clear about what is collected and why), security (strong protection), strong legal protections (respecting local privacy laws and legal rights), no content-based targeting (customer email, chat, files are not used for advertising), and benefits to you (value in return for data collected).',
       'A recall aid: control, transparency, security, strong legal protection, no content-based targeting, benefits to you.'),
    fc(203, 'Microsoft Priva',
       'A privacy management solution that helps find personal data, assess privacy risks, and handle subject rights requests such as a person asking for a copy of their data.',
       'Priva appears in the title of the Learn path for this domain, so know its purpose. The skills outline itself focuses on the Service Trust Portal and privacy principles.'),

    # ---- Purview portal, Compliance Manager --------------------------------------------
    fc(205, 'Microsoft Purview portal',
       'The unified portal for Microsoft Purview solutions: data security, data governance and risk and compliance. Administrators use it for Compliance Manager, information protection, DLP, retention, insider risk, eDiscovery and audit.',
       'It replaced the earlier standalone compliance portal.'),
    fc(206, 'Compliance Manager',
       'A Purview tool that helps you assess, track and improve your compliance with regulations and standards such as GDPR, ISO 27001 and HIPAA. It provides assessment templates, controls, and improvement actions with recommended steps.',
       'It turns a regulation into a to-do list and a score.'),
    fc(207, 'Compliance score',
       'A measure of overall progress toward completing improvement actions. Completing actions that you or Microsoft manage earns points, and the score helps you prioritize the work that reduces risk the most.',
       'It is a guide, not proof of compliance with a regulation.'),
    fc(208, 'Improvement actions and assessments',
       'An assessment groups the controls of one regulation or standard. Each control has improvement actions, either managed by Microsoft or by you, with implementation guidance and testing status.',
       'Microsoft-managed actions already count toward your score.'),

    # ---- Information protection ---------------------------------------------------------
    fc(210, 'Data classification',
       'Identifying and tagging data by type and sensitivity so it can be protected appropriately. Purview supports built-in and custom sensitive information types, exact data match, and trainable classifiers that learn what a category of document looks like.',
       'You cannot protect what you have not found. Classification feeds labels, DLP and retention.'),
    fc(211, 'Sensitive information types (SITs)',
       'Pattern-based definitions that detect sensitive data such as credit card numbers, passport numbers and national IDs, using patterns, keywords and checksums. Custom SITs can be created.',
       'DLP policies commonly use SITs to decide what to protect.'),
    fc(212, 'Trainable classifiers',
       'Machine-learning models that recognize categories of content by examples, such as contracts or resumes, rather than by a fixed pattern. Microsoft provides prebuilt ones and you can train your own.',
       'Use them when content is defined by what it is, not by a number format.'),
    fc(213, 'Content explorer',
       'Shows a current snapshot of the items in your organization that are classified as sensitive or carry a label, including the location and, for authorized users, the content itself.',
       'Content explorer = where is it and what is in it right now.'),
    fc(214, 'Activity explorer',
       'Shows a timeline of what happened to labeled content, such as labels applied or changed, files copied, printed or shared, so you can see how data is being handled over time.',
       'Activity explorer = what has been done to it. Content explorer = what is there.'),
    fc(215, 'Sensitivity labels',
       'Labels that classify and protect content, such as Public, Internal and Confidential. A label can add encryption, visual markings like headers and watermarks, and access restrictions, and it stays with the file, email, or meeting wherever it goes.',
       'Labels apply to Office files, email, Teams meetings and also to groups and sites. They can be applied manually or automatically.'),
    fc(216, 'Sensitivity label policies',
       'Publish labels to chosen users or groups and set behavior such as a default label, mandatory labeling, and justification for lowering a label. A label is not visible to users until it is published by a policy.',
       'Label = what protection; label policy = who gets it and how it behaves.'),
    fc(217, 'Data loss prevention (DLP)',
       'Policies that detect sensitive content and stop it from leaving inappropriately: they can show a policy tip, block sharing, allow an override with a justification, or send an alert. DLP covers locations such as Exchange, SharePoint, OneDrive, Teams and endpoint devices.',
       'Labels classify and protect; DLP stops risky sharing.'),
    fc(218, 'Endpoint DLP',
       'Extends DLP to Windows and macOS devices so that actions on sensitive files, such as copying to USB, uploading to a website, or printing, can be monitored and blocked.',
       'It covers what happens on the device itself, not only in the cloud.'),

    # ---- Data lifecycle management and records management --------------------------------
    fc(220, 'Data lifecycle management',
       'Keeping the content you need and deleting what you no longer need, using retention policies and retention labels. It reduces risk and storage while meeting legal and business requirements.',
       'It is the umbrella for retention and deletion.'),
    fc(221, 'Retention policy',
       'A policy that applies automatically to a whole location, such as all Exchange mailboxes or SharePoint sites, to retain content, delete it after a period, or retain then delete.',
       'It works at the location level and users do not choose it.'),
    fc(222, 'Retention label',
       'A label applied to individual items such as a document or email that sets how long to retain or delete that item, and can mark it as a record. It can be applied manually, automatically, or by default for a library.',
       'It is more granular than a retention policy.'),
    fc(223, 'Retention label policy',
       'A policy that publishes retention labels to locations and users so they can apply them, or that auto-applies labels based on conditions.',
       'Like sensitivity labels, a retention label needs a policy to be available.'),
    fc(224, 'Retention policy vs. retention label',
       'A retention policy applies broadly to all content in chosen locations with the same rule. A retention label applies to specific items and can differ item by item, including declaring a record.',
       'Think blanket versus tag.'),
    fc(225, 'Records management',
       'Managing business-critical content as records using a file plan, retention labels and disposition reviews. A record is locked against edits and deletion, and disposition provides proof of deletion at the end of its retention.',
       'Regulatory records are stricter: even administrators cannot remove the label.'),

    # ---- Insider risk, eDiscovery and audit ---------------------------------------------
    fc(230, 'Insider risk management',
       'Helps detect, investigate and act on risky activities inside the organization, such as data theft by departing employees, data leaks and security policy violations. Policies built from templates use indicators to raise alerts that become cases.',
       'Privacy is built in: usernames are pseudonymized by default and access is role-based.'),
    fc(231, 'Insider risk policy and indicators',
       'A policy selects users and the indicators to look at, such as copying files to USB or sending to personal email. Activities score risk, and alerts are triaged into cases with actions like a notice or escalation.',
       'Insider risk is about people already inside, not outside attackers.'),
    fc(232, 'Communication compliance',
       'Monitors communications such as email and Teams chats for policy violations, such as harassment or sharing sensitive information, so reviewers can investigate and remediate.',
       'It is a different solution than insider risk management, though both sit under Purview.'),
    fc(233, 'eDiscovery',
       'The process of identifying, preserving, collecting, reviewing and exporting electronic content for legal, regulatory or internal investigations. Cases, searches and legal holds are the core pieces.',
       'A legal hold keeps content from being deleted while a case is open.'),
    fc(234, 'eDiscovery Standard vs. Premium',
       'Standard provides cases, searches, holds and export. Premium adds custodian management, collection and review sets, advanced analytics such as near-duplicate detection and email threading, and support for larger and more complex cases.',
       'Premium is for large, complex legal matters.'),
    fc(235, 'Purview Audit (Standard)',
       'Records user and admin activities across Microsoft services so you can search them. It is on by default and keeps audit records for 180 days.',
       'Audit answers who did what and when.'),
    fc(236, 'Purview Audit (Premium)',
       'Includes Standard and adds audit log retention policies, longer retention (one year by default for Entra, Exchange, OneDrive and SharePoint records for properly licensed users, with up to 10 years with an add-on), higher API bandwidth and intelligent insights such as MailItemsAccessed.',
       'Longer retention and crucial forensics events point to Premium.'),
    fc(237, 'Microsoft Purview data governance',
       'Solutions that help you discover, catalog and manage data across your estate, so people can find trusted data and owners can govern it responsibly.',
       'The skills outline lists data governance in a heading but with no separate bullet points, so expect only light coverage.'),
]

QUESTIONS = [
    # ---- Service Trust Portal and privacy ----
    mc('q201', 'An auditor asks for Microsoft\'s ISO 27001 certificate and SOC reports for Azure. Where can you find these?',
       ['Service Trust Portal', 'Microsoft Defender portal', 'Azure Key Vault', 'Microsoft Entra admin center'], 0,
       'The Service Trust Portal hosts audit reports, certifications and compliance documentation. The others are security and identity management tools.'),
    mc('q202', 'Which Microsoft privacy principle states that customer email, chat and files are not used for advertising targeting?',
       ['No content-based targeting', 'Transparency about what is collected', 'Benefits to you from data collected', 'Control over how data is used'], 0,
       'No content-based targeting means Microsoft does not use what is in your content to target ads. Control and transparency concern choices and clarity, and benefits to you concern value in return for data.'),
    mc('q203', 'Which of these is NOT one of Microsoft\'s six privacy principles?',
       ['Strong legal protections', 'Security', 'Monetizing customer content', 'Transparency'], 2,
       'The six principles are control, transparency, security, strong legal protections, no content-based targeting and benefits to you. Monetizing customer content contradicts them.'),
    tf('tf201', 'The Service Trust Portal provides audit reports and compliance documentation about Microsoft cloud services.', True,
       'It is the central location for audit reports, certifications, compliance guides and whitepapers.'),

    # ---- Compliance Manager ----
    mc('q211', 'An organization wants templates and step-by-step improvement actions to help it comply with GDPR. Which tool should it use?',
       ['Compliance Manager in Microsoft Purview', 'Azure Bastion for remote access', 'Microsoft Defender for Endpoint on devices', 'Microsoft Entra Verified ID credentials'], 0,
       'Compliance Manager provides assessments for regulations and improvement actions with guidance. The others do not track regulatory compliance.'),
    mc('q212', 'What does the compliance score in Compliance Manager measure?',
       ['Progress toward completing improvement actions', 'The number of users licensed in the organization', 'The amount of data stored in SharePoint sites', 'Whether the organization is legally compliant'], 0,
       'The score reflects completed improvement actions, helping you prioritize work. It is not a legal certification of compliance.'),
    mc('q213', 'In Compliance Manager, who can perform improvement actions?',
       ['Microsoft for some actions and the customer for others', 'Only Microsoft can perform any of the actions', 'Only the customer can perform any of the actions', 'Only external auditors can perform the actions'], 0,
       'Some improvement actions are managed by Microsoft and others by the customer; both contribute to the score.'),
    tf('tf211', 'A high compliance score guarantees that an organization meets all legal obligations.', False,
       'The score is a guide to progress on improvement actions. It does not constitute a guarantee or certification of compliance.'),
    ms('msq211', 'Which two items are part of Compliance Manager? (Choose two.)',
       ['Assessments for regulations and standards', 'Improvement actions with implementation guidance', 'Safe Attachments', 'Cloud Discovery'], [0, 1],
       'Assessments and improvement actions are core. Safe Attachments belongs to Defender for Office 365 and Cloud Discovery to Defender for Cloud Apps.'),

    # ---- Information protection ----
    mc('q221', 'A compliance team wants to find documents that contain credit card numbers anywhere in the organization. Which Purview capability identifies them?',
       ['Sensitive information types', 'Safe Links in Defender for Office 365', 'Access reviews in Entra ID Governance', 'Network security groups on subnets'], 0,
       'Sensitive information types detect patterns such as credit card numbers. The others belong to other solutions.'),
    mc('q222', 'The team needs to see a list of where labeled or sensitive items currently exist and, for authorized users, view their content. Which tool provides this?',
       ['Content explorer', 'Activity explorer', 'Audit (Standard)', 'Compliance score'], 0,
       'Content explorer gives a current view of classified items. Activity explorer shows what happened to them over time.'),
    mc('q223', 'Which tool shows a history of actions on labeled content, such as when a label was changed or a file was copied?',
       ['Activity explorer', 'Content explorer', 'Trainable classifiers', 'Records management'], 0,
       'Activity explorer provides a timeline of labeling and handling activities.'),
    mc('q224', 'Which feature adds encryption and a "Confidential" watermark that stays with a document when it is emailed outside the company?',
       ['Sensitivity label', 'Retention policy', 'Conditional Access', 'Azure Firewall'], 0,
       'Sensitivity labels can encrypt and mark content, and the protection follows the file.'),
    mc('q225', 'Administrators created a sensitivity label, but users do not see it in Word. What is most likely missing?',
       ['A sensitivity label policy publishing the label to the users', 'A data loss prevention policy for email', 'An access review of group members', 'A retention label for records'], 0,
       'Labels become available to users only after they are published through a label policy.'),
    mc('q226', 'A policy must block users from emailing documents that contain social security numbers to outside recipients, showing a policy tip first. Which solution fits?',
       ['Data loss prevention', 'Entra Password Protection', 'Azure Bastion', 'Defender Vulnerability Management'], 0,
       'DLP detects sensitive content and enforces actions such as policy tips and blocking sharing.'),
    mc('q227', 'Which feature prevents sensitive files from being copied to a USB drive on company laptops?',
       ['Endpoint DLP', 'Retention labels', 'Safe Attachments', 'Entra Verified ID'], 0,
       'Endpoint DLP monitors and restricts actions on sensitive files on Windows and macOS devices.'),
    mc('q228', 'A law requires all Exchange mailboxes to be kept for seven years and then deleted. What is the simplest approach?',
       ['A retention policy applied to Exchange mailboxes', 'A sensitivity label applied to each individual email', 'Manually tagging every email with a retention label', 'Enabling security defaults in Entra ID'], 0,
       'A retention policy applies automatically to every item in a location. Per-item tagging is slower and unnecessary for a blanket rule.'),
    mc('q229', 'Which statement best distinguishes a retention label from a retention policy?',
       ['A label is applied to individual items and can declare a record; a policy applies to whole locations', 'A label applies to whole locations; a policy is applied to single items and records', 'They are identical and the terms can be used interchangeably', 'A label only encrypts files and has no retention settings'], 0,
       'Labels are item-level and can mark content as a record. Policies apply broadly to the locations they target.'),
    mc('q230', 'An organization needs documents that cannot be edited or deleted for the duration of their retention period, with proof of disposal at the end. Which capability fits?',
       ['Records management', 'Content explorer snapshots', 'Compliance score in Compliance Manager', 'Safe Links protection'], 0,
       'Records management uses retention labels to lock content as a record and supports disposition review with proof of deletion.'),
    tf('tf221', 'A sensitivity label can apply encryption that stays with the file.', True,
       'Label protection settings include encryption and access control that persist with the content.'),
    tf('tf222', 'Retention policies must be applied by each user to every individual document.', False,
       'Retention policies are applied by administrators to locations, so users do not tag documents themselves. Item-level labels are the option users can apply.'),
    ms('msq221', 'Which two actions can a DLP policy take when it detects sensitive content? (Choose two.)',
       ['Show a policy tip to the user', 'Block the sharing', 'Rotate Key Vault secrets', 'Join the device to the domain'], [0, 1],
       'DLP can warn users with policy tips, block, allow justified overrides and raise alerts. The others are unrelated.'),
    ms('msq222', 'Which two are used by Purview to classify data? (Choose two.)',
       ['Sensitive information types', 'Trainable classifiers', 'Network security groups', 'Safe Links'], [0, 1],
       'SITs and trainable classifiers identify content. NSGs and Safe Links belong to network and email security.'),

    # ---- Insider risk, eDiscovery, audit ----
    mc('q241', 'A company wants to detect employees who copy large amounts of files to personal cloud storage shortly before they resign. Which solution fits?',
       ['Insider risk management', 'eDiscovery', 'Azure DDoS Protection', 'Microsoft Entra Domain Services'], 0,
       'Insider risk management uses indicators and policy templates such as data theft by departing users to raise alerts.'),
    mc('q242', 'How does insider risk management help protect user privacy?',
       ['Usernames are pseudonymized by default and access is role-based', 'It never records any user activity at all', 'It publishes every alert to all employees for transparency', 'It disables auditing for the monitored users'], 0,
       'Privacy is built in through pseudonymization and role-based access to alerts and cases.'),
    mc('q243', 'Legal counsel needs to preserve and collect mailbox and file content for a lawsuit, placing a hold on it. Which Purview solution is used?',
       ['eDiscovery', 'Compliance Manager', 'Sensitivity labels', 'Insider risk management'], 0,
       'eDiscovery lets you create cases, place legal holds, search, review and export content.'),
    mc('q244', 'Which eDiscovery edition adds custodian management, review sets and near-duplicate detection?',
       ['Premium', 'Standard', 'Basic', 'Free'], 0,
       'Premium extends Standard with custodians, review sets and advanced analytics for complex cases.'),
    mc('q245', 'An investigator needs to find who deleted a file in SharePoint last month. Which solution provides this?',
       ['Microsoft Purview Audit', 'Content explorer for labeled items', 'Compliance Manager assessments', 'Azure Bastion sessions'], 0,
       'Audit records user and admin activities so you can search for who did what and when.'),
    mc('q246', 'Which feature distinguishes Audit (Premium) from Audit (Standard)?',
       ['Audit log retention policies and longer retention', 'Being able to search audit logs at all', 'Being turned on by default for the tenant', 'Exporting audit records to a CSV file'], 0,
       'Premium adds retention policies, one-year default retention for key services and up to 10 years with an add-on. The other items exist in both.'),
    mc('q247', 'What is the default audit log retention for Audit (Standard)?',
       ['180 days', '30 days', '10 years', 'Records are never kept'], 0,
       'Audit (Standard) keeps records for 180 days. Longer retention needs Audit (Premium) and the right licensing.'),
    tf('tf241', 'Insider risk management is designed mainly to stop external attackers who have no access to the organization.', False,
       'It focuses on risky activity by people who already have legitimate access, such as employees and contractors.'),
    tf('tf242', 'eDiscovery can place a legal hold so that content is preserved while a case is investigated.', True,
       'Holds preserve content, even if users try to delete it, while the matter is open.'),
    ms('msq241', 'Which two are Audit (Premium) capabilities? (Choose two.)',
       ['Audit log retention policies', 'Intelligent insights such as MailItemsAccessed', 'Disabling auditing', 'Replacing sensitivity labels'], [0, 1],
       'Premium adds retention policies and high-value events. The other options are not audit features.'),
    ms('msq242', 'Which two solutions sit under Microsoft Purview? (Choose two.)',
       ['Insider risk management', 'eDiscovery', 'Azure Bastion', 'Microsoft Entra Connect'], [0, 1],
       'Both are Purview solutions. Bastion is an Azure networking service and Entra Connect is identity synchronization.'),
]

LESSONS = [
    {
        'id': 'service-trust-privacy',
        'title': 'Service Trust Portal, Privacy and Compliance Manager',
        'summary': 'Where to find Microsoft\'s audit evidence, the privacy principles, the Purview portal and compliance score.',
        'diagram': None,
        'vocabIds': ['f201', 'f202', 'f203', 'f205', 'f206', 'f207', 'f208'],
        'quizIds': ['q201', 'q202', 'q203', 'tf201', 'q211', 'q212', 'q213', 'tf211', 'msq211'],
        'reading': """Compliance starts with trust. The Service Trust Portal is Microsoft's library of compliance evidence: audit reports, certifications such as ISO and SOC, compliance guides, penetration test results and whitepapers. Customers use it to show their own auditors how Microsoft meets standards.

Microsoft states six privacy principles: control, transparency, security, strong legal protections, no content-based targeting and benefits to you. Microsoft Priva is the privacy management product that helps find personal data and handle subject rights requests.

Day to day, administrators work in the Microsoft Purview portal, which hosts the data security, governance and compliance solutions. Compliance Manager is the tool to assess, track and improve compliance with regulations such as GDPR, ISO 27001 and HIPAA. An assessment holds controls, each with improvement actions that either Microsoft or you must carry out. Completing them raises the compliance score, a measure of progress that helps prioritize work. It is a guide, not a certificate: a high score does not prove legal compliance.""",
        'fundamentalsLabel': 'New to compliance? See the everyday analogy',
        'fundamentals': """Compliance Manager is like a fitness tracker for regulations: it sets the targets (assessments), lists the exercises (improvement actions) and gives a score for how far along you are. The Service Trust Portal is the landlord's inspection certificates you show a bank.""",
        'keyTerms': ['Service Trust Portal', 'privacy principles', 'Microsoft Priva', 'Microsoft Purview portal', 'Compliance Manager', 'compliance score', 'assessment', 'improvement action'],
        'commonTraps': [
            'Compliance score measures progress on improvement actions; it does not prove compliance.',
            'The Service Trust Portal is for Microsoft\'s documents, not for classifying your own data.',
            'Some improvement actions are managed by Microsoft and still count toward the score.',
        ],
        'scenario': 'A healthcare provider preparing for an audit downloads Microsoft\'s ISO 27001 and SOC reports from the Service Trust Portal, then uses Compliance Manager\'s HIPAA assessment. It assigns improvement actions to teams and watches its compliance score rise as each action is completed.',
        'onTheJob': 'Auditors want evidence, not scores. Keep screenshots and documents attached to each improvement action, and use the Service Trust Portal to answer "what does Microsoft do?" so your team only has to evidence its own part.',
    },
    {
        'id': 'information-protection',
        'title': 'Information Protection and Data Lifecycle Management',
        'summary': 'Classification, content and activity explorer, sensitivity labels, DLP, retention and records management.',
        'diagram': None,
        'vocabIds': ['f210', 'f211', 'f212', 'f213', 'f214', 'f215', 'f216', 'f217', 'f218', 'f220', 'f221', 'f222', 'f223', 'f224', 'f225'],
        'quizIds': ['q221', 'q222', 'q223', 'q224', 'q225', 'q226', 'q227', 'q228', 'q229', 'q230', 'tf221', 'tf222', 'msq221', 'msq222'],
        'reading': """Protecting data begins with knowing what you have. Data classification finds and tags content using sensitive information types (patterns such as credit card numbers), exact data match and trainable classifiers that learn what a category of document looks like. Content explorer then shows where classified or labeled items currently are, and activity explorer shows the history of what happened to them.

Sensitivity labels turn a classification into protection: a label can encrypt a file, add headers and watermarks, and restrict access, and it travels with the content. Labels reach users only after a sensitivity label policy publishes them, and the policy can set a default label, require labeling and demand justification to lower one. Data loss prevention (DLP) policies detect sensitive content and stop risky sharing with policy tips, blocks and alerts across Exchange, SharePoint, OneDrive, Teams and, with Endpoint DLP, devices.

Data lifecycle management decides how long to keep content. A retention policy applies broadly to a location, such as every mailbox, and retains, deletes or both. A retention label applies to individual items, is published or auto-applied through a label policy, and can mark an item as a record. Records management uses a file plan and retention labels so records cannot be edited or deleted, with disposition review and proof of disposal.""",
        'fundamentalsLabel': 'New to information protection? See the everyday analogy',
        'fundamentals': """A sensitivity label is a "Confidential" stamp and a lockbox for a document. DLP is the guard at the door who stops confidential papers leaving the building. A retention policy is the office rule that says all invoices are shredded after seven years, and a retention label is a sticky note on one contract saying keep this forever.""",
        'keyTerms': ['sensitive information type', 'trainable classifier', 'content explorer', 'activity explorer', 'sensitivity label', 'label policy', 'DLP', 'Endpoint DLP', 'retention policy', 'retention label', 'record', 'disposition'],
        'commonTraps': [
            'Content explorer shows what exists now; activity explorer shows what happened over time.',
            'A label is not visible to users until a label policy publishes it.',
            'Retention policy = whole location. Retention label = individual item (and can declare a record).',
        ],
        'scenario': 'A law firm creates a "Client Confidential" sensitivity label that encrypts documents, and publishes it with a policy that makes labeling mandatory. A DLP policy blocks emailing labeled files outside the firm, a retention policy keeps all mailboxes for seven years, and a retention label declares signed contracts as records.',
        'onTheJob': 'Start simple. Teams that launch ten labels with complex encryption see users give up or mislabel everything. Run in test mode, check activity explorer to see what really happens, then tighten DLP. Make sure legal agrees retention periods before you turn deletion on.',
    },
    {
        'id': 'insider-ediscovery-audit',
        'title': 'Insider Risk, eDiscovery and Audit',
        'summary': 'Insider risk management, eDiscovery Standard and Premium, and Purview Audit.',
        'diagram': None,
        'vocabIds': ['f230', 'f231', 'f232', 'f233', 'f234', 'f235', 'f236', 'f237'],
        'quizIds': ['q241', 'q242', 'q243', 'q244', 'q245', 'q246', 'q247', 'tf241', 'tf242', 'msq241', 'msq242'],
        'reading': """Insider risk management looks for risky activity by people who already have access, such as copying files before resigning or sending sensitive data to personal email. Policy templates and indicators produce alerts that become cases, with privacy protections such as pseudonymized usernames and role-based access. Communication compliance is a separate solution that reviews messages for policy violations.

eDiscovery supports legal and regulatory investigations: create a case, place a legal hold so relevant content cannot be deleted, search, review and export. Standard covers cases, searches, holds and export, while Premium adds custodian management, review sets and advanced analytics for large or complex matters.

Purview Audit records who did what and when. Audit (Standard) is on by default and keeps records for 180 days. Audit (Premium) adds retention policies and longer retention, one year by default for Entra ID, Exchange, OneDrive and SharePoint records of properly licensed users and up to 10 years with an add-on, along with intelligent insights such as MailItemsAccessed and higher bandwidth to the Management Activity API.""",
        'fundamentalsLabel': 'New to insider risk and eDiscovery? See the everyday analogy',
        'fundamentals': """Audit is the building's security-camera archive. Insider risk management is the analyst who notices a staff member carrying out boxes of files after handing in their notice. eDiscovery is the court-ordered process of freezing, collecting and handing over the relevant evidence.""",
        'keyTerms': ['insider risk management', 'communication compliance', 'eDiscovery', 'legal hold', 'custodian', 'review set', 'Audit (Standard)', 'Audit (Premium)', 'audit log retention policy'],
        'commonTraps': [
            'Insider risk is about trusted people, not outside attackers.',
            'Standard audit retention is 180 days; one-year-plus retention is Premium.',
            'Insider risk management and communication compliance are separate solutions.',
        ],
        'scenario': 'A manufacturer notices an engineer who handed in notice has been copying design files to a personal cloud account. Insider risk management raises an alert and a case. Months later a lawsuit begins: legal counsel opens an eDiscovery case, places holds on the engineer\'s mailbox and OneDrive, and the audit log confirms exactly what was accessed.',
        'onTheJob': 'Involve HR and legal before turning insider risk on, because the signals are about people. Check licensing for the retention you promise to auditors: a one-year Premium default applies only to users with the right license.',
    },
]

MADLIBS = [
    {
        'id': 'ml-sc900-1', 'cat': CON,
        'scenario': 'A team moves a database from a server room to Azure virtual machines. Microsoft still protects the physical datacenter, but the team must patch the guest operating system and protect its accounts and data, because under the {b1} model the customer always keeps data, devices and {b2}. The company also wants every request verified regardless of network location, which is the {b3} model.',
        'blanks': [
            {'key': 'b1', 'options': ['shared responsibility', 'federation', 'consumption', 'hashing'], 'correct': 0},
            {'key': 'b2', 'options': ['firewalls', 'identities', 'hypervisors', 'datacenters'], 'correct': 1},
            {'key': 'b3', 'options': ['Zero Trust', 'perimeter-only', 'single-tenant', 'private cloud'], 'correct': 0},
        ],
        'explanation': 'Shared responsibility says data, devices and accounts and identities always stay with the customer. Zero Trust verifies explicitly, uses least privilege and assumes breach, and does not rely on network location.',
    },
    {
        'id': 'ml-sc900-2', 'cat': CON,
        'scenario': 'A user types a password and approves a prompt on a phone, which is {b1}. The system then checks which files the user may open, which is {b2}. Because the company\'s partner trusts that sign-in for its own apps, the arrangement is called {b3}.',
        'blanks': [
            {'key': 'b1', 'options': ['authentication', 'authorization', 'encryption', 'hashing'], 'correct': 0},
            {'key': 'b2', 'options': ['authentication', 'authorization', 'federation', 'deprovisioning'], 'correct': 1},
            {'key': 'b3', 'options': ['federation', 'segmentation', 'retention', 'disposition'], 'correct': 0},
        ],
        'explanation': 'Authentication proves who you are, authorization decides what you can do, and federation is a trust between identity providers.',
    },
    {
        'id': 'ml-sc900-3', 'cat': ENT,
        'scenario': 'A company wants to require MFA from outside the office. It builds a {b1} policy and tests it first in {b2} mode. Because it also wants sign-in risk to drive the decision, it needs {b3}.',
        'blanks': [
            {'key': 'b1', 'options': ['Conditional Access', 'retention', 'DLP', 'sensitivity label'], 'correct': 0},
            {'key': 'b2', 'options': ['report-only', 'prevention', 'archive', 'hold'], 'correct': 0},
            {'key': 'b3', 'options': ['Entra ID P2 with ID Protection', 'Entra ID Free', 'a network security group', 'a Key Vault'], 'correct': 0},
        ],
        'explanation': 'Conditional Access evaluates signals and enforces controls such as MFA, and report-only mode shows the effect without enforcing. Risk-based conditions need ID Protection, a P2 feature.',
    },
    {
        'id': 'ml-sc900-4', 'cat': ENT,
        'scenario': 'Administrators should hold the Security Administrator role only when needed, so the company uses {b1} to make them {b2} for the role and activate it with justification. Every quarter, managers confirm which guests still need access using {b3}.',
        'blanks': [
            {'key': 'b1', 'options': ['Privileged Identity Management', 'Azure Bastion', 'Safe Links', 'Content explorer'], 'correct': 0},
            {'key': 'b2', 'options': ['eligible', 'permanent', 'blocked', 'federated'], 'correct': 0},
            {'key': 'b3', 'options': ['access reviews', 'DDoS Protection', 'trainable classifiers', 'playbooks'], 'correct': 0},
        ],
        'explanation': 'PIM provides eligible, just-in-time, time-limited privileged access, and access reviews periodically recertify who still needs access.',
    },
    {
        'id': 'ml-sc900-5', 'cat': SEC,
        'scenario': 'A web shop is attacked with injected SQL in form fields, which a {b1} would block. Its public IPs are flooded with traffic, which {b2} mitigates. Administrators reach private VMs through {b3}, so the VMs need no public IP addresses.',
        'blanks': [
            {'key': 'b1', 'options': ['Web Application Firewall', 'network security group', 'Key Vault', 'Bastion'], 'correct': 0},
            {'key': 'b2', 'options': ['DDoS Protection', 'Safe Links', 'eDiscovery', 'a retention label'], 'correct': 0},
            {'key': 'b3', 'options': ['Azure Bastion', 'Azure Firewall Premium', 'Sentinel', 'Content explorer'], 'correct': 0},
        ],
        'explanation': 'WAF defends web apps against exploits like SQL injection, DDoS Protection counters traffic floods, and Bastion provides RDP and SSH without exposing management ports or public IPs.',
    },
    {
        'id': 'ml-sc900-6', 'cat': SEC,
        'scenario': 'A security team connects logs from many sources into {b1}, which acts as both a {b2} and a SOAR. When an alert fires, a {b3} automatically disables the compromised account.',
        'blanks': [
            {'key': 'b1', 'options': ['Microsoft Sentinel', 'Azure Key Vault', 'Compliance Manager', 'Safe Attachments'], 'correct': 0},
            {'key': 'b2', 'options': ['SIEM', 'CASB', 'EDR', 'DLP'], 'correct': 0},
            {'key': 'b3', 'options': ['playbook', 'workbook', 'sensitivity label', 'retention policy'], 'correct': 0},
        ],
        'explanation': 'Sentinel is a SIEM and SOAR; playbooks (Azure Logic Apps) automate responses, while workbooks only visualize.',
    },
    {
        'id': 'ml-sc900-7', 'cat': COM,
        'scenario': 'A company labels contracts as Confidential using a {b1}, which only appears for staff after a {b2} publishes it. To stop confidential files being emailed outside, it adds a {b3} policy.',
        'blanks': [
            {'key': 'b1', 'options': ['sensitivity label', 'retention policy', 'playbook', 'managed identity'], 'correct': 0},
            {'key': 'b2', 'options': ['label policy', 'DDoS plan', 'access package', 'bookmark'], 'correct': 0},
            {'key': 'b3', 'options': ['data loss prevention', 'Conditional Access report-only', 'Bastion', 'workbook'], 'correct': 0},
        ],
        'explanation': 'Sensitivity labels classify and protect, label policies publish them to users, and DLP blocks risky sharing.',
    },
    {
        'id': 'ml-sc900-8', 'cat': COM,
        'scenario': 'The legal team needs to keep all mailboxes for seven years, which a {b1} does for the whole location. A single signed contract must be locked and cannot be deleted, so it is marked as a record with a {b2}. When a lawsuit starts, counsel uses {b3} to place a hold and collect content.',
        'blanks': [
            {'key': 'b1', 'options': ['retention policy', 'sensitivity label', 'trainable classifier', 'playbook'], 'correct': 0},
            {'key': 'b2', 'options': ['retention label', 'WAF rule', 'managed identity', 'NSG'], 'correct': 0},
            {'key': 'b3', 'options': ['eDiscovery', 'Content explorer', 'Safe Links', 'Secure score'], 'correct': 0},
        ],
        'explanation': 'Retention policies apply to locations, retention labels apply to items and can declare records, and eDiscovery provides holds and collection for legal cases.',
    },
]

SEQUENCES = [
    {
        'id': 'seq-sc900-1', 'cat': ENT,
        'prompt': 'Roll out a new Conditional Access policy safely. Put the steps in order.',
        'steps': [
            'Exclude emergency access accounts from the policy',
            'Create the policy with the report-only state',
            'Review sign-in logs to see who would have been affected',
            'Change the policy state to On to enforce it',
        ],
        'explanation': 'Protect the break-glass accounts first, test in report-only mode, check the impact in the logs, and only then enforce so you do not lock people out.',
    },
    {
        'id': 'seq-sc900-2', 'cat': ENT,
        'prompt': 'Activate a privileged role with Privileged Identity Management. Put the steps in order.',
        'steps': [
            'The user is made eligible for the role',
            'The user requests activation and supplies MFA and a justification',
            'An approver approves the request, if approval is required',
            'The role is active for a limited time',
            'The assignment expires automatically',
        ],
        'explanation': 'Eligibility comes first, activation needs proof and sometimes approval, access is temporary, and it ends on its own.',
    },
    {
        'id': 'seq-sc900-3', 'cat': SEC,
        'prompt': 'A threat is detected and handled in Microsoft Sentinel. Put the steps in order.',
        'steps': [
            'Data connectors ingest logs from the environment',
            'An analytics rule detects suspicious activity and raises an alert',
            'Related alerts are grouped into an incident',
            'An automation rule triggers a playbook to respond',
            'An analyst investigates and closes the incident',
        ],
        'explanation': 'Data must be ingested before rules can detect anything, alerts roll up into incidents, and automation and analysts handle the response.',
    },
    {
        'id': 'seq-sc900-4', 'cat': COM,
        'prompt': 'Protect documents with a sensitivity label. Put the steps in order.',
        'steps': [
            'Create the sensitivity label with encryption and markings',
            'Publish the label to users with a label policy',
            'A user (or auto-labeling) applies the label to a document',
            'The protection travels with the document when it is shared',
        ],
        'explanation': 'A label must be created and then published before it can be applied; once applied, the protection stays with the content.',
    },
    {
        'id': 'seq-sc900-5', 'cat': COM,
        'prompt': 'Run a legal investigation in Microsoft Purview eDiscovery. Put the steps in order.',
        'steps': [
            'Create an eDiscovery case',
            'Place legal holds on the relevant content sources',
            'Search for the relevant content',
            'Review the results',
            'Export the content for counsel',
        ],
        'explanation': 'Open the case, preserve the content with holds, search and review it, then export what counsel needs.',
    },
]

CASE_STUDIES = [
    {
        'id': 'cs-sc900-adatum',
        'cat': SEC,
        'title': 'Adatum Health Secures Its Move to the Microsoft Cloud',
        'scenario': (
            "Adatum Health keeps its staff accounts in on-premises Active Directory and wants everyone to use one identity for "
            "Microsoft 365 and for Azure. A web portal for patients runs in Azure and has been probed with SQL injection attempts, "
            "and its public addresses were once flooded with traffic. Administrators currently keep permanent high-level roles, and "
            "the compliance team wants them to receive these only when needed. Staff often email patient documents, and the privacy "
            "officer wants documents containing patient identifiers to be protected and prevented from leaving the company. Lawyers "
            "also need to preserve mailbox content when a claim is filed. Finally, the security operations team wants one place to "
            "collect logs from Azure, Microsoft 365 and a third-party firewall and to automate responses."
        ),
        'questions': [
            {
                'id': 'cs-sc900-adatum-q1',
                'type': 'mc',
                'question': 'Which approach gives staff one identity for Microsoft 365 and Azure while they keep their on-premises accounts?',
                'options': [
                    'Hybrid identity using Microsoft Entra Connect or Cloud Sync',
                    'Creating guest accounts for every employee',
                    'Placing every staff member in a network security group',
                    'Enabling Azure Bastion',
                ],
                'correct': 0,
                'explanation': 'Hybrid identity synchronizes on-premises accounts with Entra ID so people keep a single identity. Guest accounts are for outsiders, and NSGs and Bastion are network features.',
            },
            {
                'id': 'cs-sc900-adatum-q2',
                'type': 'mc',
                'question': 'Which pair of services best addresses the SQL injection attempts and the traffic flood against the patient portal?',
                'options': [
                    'Web Application Firewall and DDoS Protection',
                    'Azure Bastion and Key Vault',
                    'Compliance Manager and Audit',
                    'Safe Links and Safe Attachments',
                ],
                'correct': 0,
                'explanation': 'WAF blocks web exploits such as SQL injection and DDoS Protection mitigates traffic floods. The other pairs address remote access and secrets, compliance, or email.',
            },
            {
                'id': 'cs-sc900-adatum-q3',
                'type': 'mc',
                'question': 'Which Entra capability gives administrators high-level roles only when needed, with justification and a time limit?',
                'options': [
                    'Privileged Identity Management',
                    'Security defaults',
                    'Password writeback',
                    'Entra Verified ID',
                ],
                'correct': 0,
                'explanation': 'PIM provides just-in-time, time-bound activation of eligible roles with approval, justification and MFA options.',
            },
            {
                'id': 'cs-sc900-adatum-q4',
                'type': 'ms',
                'question': 'Which two Purview solutions meet the privacy officer\'s and the lawyers\' requirements? (Choose two.)',
                'options': [
                    'Sensitivity labels with data loss prevention',
                    'eDiscovery with legal holds',
                    'Azure DDoS Protection',
                    'Microsoft Defender Vulnerability Management',
                ],
                'correct': [0, 1],
                'explanation': 'Labels and DLP protect patient documents and stop them leaving, and eDiscovery with holds preserves mailbox content for claims. DDoS Protection and Vulnerability Management are not Purview solutions.',
            },
        ],
    },
]

COMPARE = [
    {
        'id': 'cmp-sc900-1', 'cat': CON,
        'scenario': 'A developer must store user passwords so that the system can verify them at login, but nobody, even with a stolen database, should be able to recover them. Which technique should be used?',
        'optionA': 'Encrypt each password with a shared symmetric key kept in the application settings.',
        'optionB': 'Store a salted hash of each password and compare hashes at login.',
        'better': 'B',
        'why': 'Encryption is reversible by anyone who obtains the key, which is stored right next to the data here. A salted hash is one-way, so the original password cannot be recovered even if the database is stolen.',
    },
    {
        'id': 'cmp-sc900-2', 'cat': CON,
        'scenario': 'A user has just proven who they are with a password and an app prompt. Which concept decides whether they may open the payroll folder?',
        'optionA': 'Authentication',
        'optionB': 'Authorization',
        'better': 'B',
        'why': 'Authentication already finished when the user proved who they were. Deciding what that identity may open is authorization.',
    },
    {
        'id': 'cmp-sc900-3', 'cat': ENT,
        'scenario': 'A help desk technician must be able to reset passwords for users in the directory, and nothing else. Which permission system is the right place to grant this?',
        'optionA': 'A Microsoft Entra role scoped to the task, such as a password or helpdesk administrator.',
        'optionB': 'The Azure RBAC Contributor role on the subscription.',
        'better': 'A',
        'why': 'Resetting directory passwords is a directory task, so an Entra role is needed. Azure RBAC governs Azure resources such as VMs and does not grant directory administration, and Contributor is far too broad anyway.',
    },
    {
        'id': 'cmp-sc900-4', 'cat': ENT,
        'scenario': 'An organization wants administrators to have no standing privileges and instead activate roles for two hours with a justification. Which feature matches?',
        'optionA': 'Access reviews that ask managers every quarter whether admins still need roles.',
        'optionB': 'Privileged Identity Management with eligible role assignments.',
        'better': 'B',
        'why': 'Access reviews recertify access periodically but the admin still holds the role the rest of the time. PIM removes standing access and provides time-limited, just-in-time activation.',
    },
    {
        'id': 'cmp-sc900-5', 'cat': ENT,
        'scenario': 'A security team wants sign-in methods that cannot be captured by a fake login page. Which is better?',
        'optionA': 'A one-time code sent by SMS.',
        'optionB': 'A passkey stored on a FIDO2 security key.',
        'better': 'B',
        'why': 'An SMS code can be typed into a phishing page and relayed. A passkey is bound to the real site, so it will not work on a lookalike page.',
    },
    {
        'id': 'cmp-sc900-6', 'cat': SEC,
        'scenario': 'A company wants a single managed service to control and log all outbound internet traffic from several virtual networks using FQDN rules and threat intelligence. Which fits better?',
        'optionA': 'Azure Firewall deployed centrally.',
        'optionB': 'A network security group on each subnet.',
        'better': 'A',
        'why': 'NSGs are free layer 3 and 4 filters that are managed per subnet and cannot use FQDN rules or threat intelligence. Azure Firewall provides central control with those features.',
    },
    {
        'id': 'cmp-sc900-7', 'cat': SEC,
        'scenario': 'An application is being targeted with cross-site scripting in HTTP requests. Which control is the better fit?',
        'optionA': 'Azure Web Application Firewall on Application Gateway.',
        'optionB': 'Azure DDoS Protection Network Protection.',
        'better': 'A',
        'why': 'DDoS Protection targets floods that exhaust capacity. Cross-site scripting hides in individual requests and needs a WAF that inspects layer 7.',
    },
    {
        'id': 'cmp-sc900-8', 'cat': SEC,
        'scenario': 'Management wants to discover which unsanctioned SaaS apps employees use and risk-score them. Which product fits?',
        'optionA': 'Microsoft Defender for Cloud Apps with Cloud Discovery.',
        'optionB': 'Microsoft Defender for Cloud with Defender CSPM.',
        'better': 'A',
        'why': 'Defender for Cloud Apps is the CASB that discovers shadow IT. Defender for Cloud assesses posture of Azure and multicloud infrastructure, not employee use of SaaS apps.',
    },
    {
        'id': 'cmp-sc900-9', 'cat': SEC,
        'scenario': 'A SOC needs to ingest logs from Azure, Microsoft 365 and a third-party firewall, correlate them, and automate responses. Which is the better answer?',
        'optionA': 'Microsoft Sentinel',
        'optionB': 'Microsoft Defender for Endpoint',
        'better': 'A',
        'why': 'Defender for Endpoint protects and monitors devices. Sentinel is a SIEM and SOAR that collects from many sources, including third-party ones, and automates response.',
    },
    {
        'id': 'cmp-sc900-10', 'cat': COM,
        'scenario': 'The legal department wants every mailbox in the company kept for seven years without users having to do anything. Which is the simpler choice?',
        'optionA': 'A retention policy applied to Exchange locations.',
        'optionB': 'Retention labels that each user applies to individual emails.',
        'better': 'A',
        'why': 'A policy applies automatically to all content in a location. Labels would depend on users tagging each item and would miss what they forget.',
    },
    {
        'id': 'cmp-sc900-11', 'cat': COM,
        'scenario': 'An admin asks, "Which files in our SharePoint sites currently carry the Confidential label, and where are they?" Which tool answers this?',
        'optionA': 'Content explorer',
        'optionB': 'Activity explorer',
        'better': 'A',
        'why': 'Content explorer shows the current snapshot of labeled items and where they are. Activity explorer would show what happened to them, such as when labels were changed.',
    },
    {
        'id': 'cmp-sc900-12', 'cat': COM,
        'scenario': 'Auditors require audit records for SharePoint and Exchange activity to be searchable for one year. Which edition is needed?',
        'optionA': 'Purview Audit (Standard), which is on by default.',
        'optionB': 'Purview Audit (Premium) with properly licensed users.',
        'better': 'B',
        'why': 'Standard retains records for 180 days. Retention of one year by default for those services is a Premium capability, and it applies to users with the right license.',
    },
]

CHEAT_SHEET = [
    {
        'heading': 'Compliance: portals and trust',
        'points': [
            'Service Trust Portal = Microsoft\'s audit reports, certifications and compliance guides. Purview portal = where you manage Purview solutions.',
            'Six privacy principles: control, transparency, security, strong legal protections, no content-based targeting, benefits to you.',
            'Compliance Manager = assessments, controls, improvement actions. Compliance score = progress on improvement actions, not proof of compliance.',
        ],
    },
    {
        'heading': 'Purview: information protection and lifecycle',
        'points': [
            'Classify with sensitive information types, trainable classifiers and exact data match. Content explorer = what exists now. Activity explorer = what happened over time.',
            'Sensitivity label = classify and protect (encrypt, mark) and travels with the content; it must be published with a label policy. DLP = detect and block risky sharing, including Endpoint DLP.',
            'Retention policy = whole location, automatic. Retention label = individual item, can declare a record. Records management = locked content with disposition and proof of deletion.',
        ],
    },
    {
        'heading': 'Purview: insider risk, eDiscovery and audit',
        'points': [
            'Insider risk management = risky activity by trusted people, with pseudonymized usernames. Communication compliance = monitor messages for violations.',
            'eDiscovery = cases, legal holds, search, review, export. Premium adds custodians, review sets and analytics.',
            'Audit (Standard) = on by default, 180 days. Audit (Premium) = retention policies, one year by default for Entra, Exchange, OneDrive and SharePoint (licensed users), up to 10 years with an add-on, and intelligent insights.',
        ],
    },
    {
        'heading': 'Exam-day reminders',
        'points': [
            'Microsoft scores this 0 to 1000 with 700 to pass, not a flat percentage.',
            'Watch for Defender for Cloud (infrastructure) versus Defender for Cloud Apps (SaaS CASB), and Entra roles versus Azure RBAC. They are the most common look-alike traps.',
            'Read for the verb: "classify and protect" = sensitivity label, "stop sharing" = DLP, "keep or delete" = retention, "investigate a legal matter" = eDiscovery, "who did what" = Audit.',
        ],
    },
]
