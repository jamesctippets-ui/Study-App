"""Track metadata: which certs exist, whether they are visible, and exam parameters.

EXAM_CONFIG entries may carry an optional `experience` block describing the
work experience a certification asks for (shown on the track pickers, the Path
header, the Exam tab and the Profile plan):

    'experience': {
        'level': 'required' | 'recommended' | 'none',
        'years': 5,                       # headline number of years (0 for none)
        'summary': 'One sentence on what the years must be spent doing',
        'waivers': ['Ways the requirement can be reduced', ...],   # optional
        'associate': 'What happens if you pass without the experience',  # optional
    }
"""

STORAGE_KEY = 'cert-study-progress'

TRACKS = [
    {'key': 'itil', 'label': 'ITIL', 'subtitle': 'Foundation, Version 5'},
    {'key': 'az900', 'label': 'AZ-900', 'subtitle': 'Azure Fundamentals'},
    {'key': 'ab650', 'label': 'AB-650', 'subtitle': 'M365 & AI Services Administrator'},
    {'key': 'az104', 'label': 'AZ-104', 'subtitle': 'Azure Administrator'},
    {'key': 'dp900', 'label': 'DP-900', 'subtitle': 'Azure Data Fundamentals'},
    {'key': 'dp300', 'label': 'DP-300', 'subtitle': 'Azure Database Administrator'},
    {'key': 'az305', 'label': 'AZ-305', 'subtitle': 'Azure Solutions Architect Expert'},
    {'key': 'az802', 'label': 'AZ-802', 'subtitle': 'Windows Server Administrator'},
    {'key': 'az140', 'label': 'AZ-140', 'subtitle': 'Azure Virtual Desktop Specialty'},
    {'key': 'md102', 'label': 'MD-102', 'subtitle': 'Endpoint Administrator'},
    {'key': 'sc300', 'label': 'SC-300', 'subtitle': 'Identity & Access Administrator'},
    {'key': 'sc200', 'label': 'SC-200', 'subtitle': 'Security Operations Analyst'},
    {'key': 'sc500', 'label': 'SC-500', 'subtitle': 'Cloud & AI Security Engineer'},
    {'key': 'cloudplus', 'label': 'Cloud+', 'subtitle': 'CompTIA Cloud+ (CV0-004)'},
    {'key': 'ehrintegration', 'label': 'EHR Integration', 'subtitle': 'Healthcare Interoperability Concepts (not a certification)'},
    {'key': 'ccna', 'label': 'CCNA', 'subtitle': 'Cisco Certified Network Associate (200-301)'},
    {'key': 'isc2cc', 'label': 'ISC2 CC', 'subtitle': 'Certified in Cybersecurity'},
    {'key': 'sscp', 'label': 'SSCP', 'subtitle': 'ISC2 Systems Security Certified Practitioner'},
    {'key': 'cissp', 'label': 'CISSP', 'subtitle': 'ISC2 Certified Information Systems Security Professional'},
    {'key': 'ccsp', 'label': 'CCSP', 'subtitle': 'ISC2 Certified Cloud Security Professional'},
    {'key': 'cgrc', 'label': 'CGRC', 'subtitle': 'ISC2 Governance, Risk and Compliance'},
    {'key': 'csslp', 'label': 'CSSLP', 'subtitle': 'ISC2 Certified Secure Software Lifecycle Professional'},
]

EXAM_CONFIG = {
    'itil': {
        'length': 40, 'minutes': 60, 'passPct': 65, 'passLabel': 'Real pass mark: 26/40 (65%)',
        'resources': [
            {'label': 'PeopleCert: ITIL Foundation (Version 5)', 'url': 'https://www.peoplecert.org/browse-certifications/it-governance-and-service-management/ITIL-1/itil-5-foundation-version-50-4154'},
        ],
    },
    'az900': {
        'length': 50, 'minutes': 45, 'passPct': 75, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 75%+ here as a safe buffer, not an exact predictor.',
        'resources': [
            {'label': 'Microsoft Learn: official AZ-900 study guide', 'url': 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-900'},
            {'label': 'Microsoft Learn: Azure Fundamentals certification', 'url': 'https://learn.microsoft.com/en-us/credentials/certifications/azure-fundamentals/'},
        ],
    },
    'ab650': {
        'length': 52, 'minutes': 100, 'passPct': 70, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 70%+ here as a safe buffer, not an exact predictor. This is a beta exam as of late 2026, expected to reach general availability in October 2026.',
        'resources': [
            {'label': 'Microsoft Learn: official AB-650 study guide', 'url': 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/ab-650'},
            {'label': 'Microsoft Learn: M365 & AI Services Administrator certification', 'url': 'https://learn.microsoft.com/en-us/credentials/certifications/ai-services-administrator-associate/'},
        ],
    },
    'az104': {
        'length': 50, 'minutes': 100, 'passPct': 75, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 75%+ here as a safe buffer, not an exact predictor.',
        'resources': [
            {'label': 'Microsoft Learn: official AZ-104 study guide', 'url': 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-104'},
            {'label': 'Microsoft Learn: Azure Administrator Associate certification', 'url': 'https://learn.microsoft.com/en-us/credentials/certifications/azure-administrator/'},
        ],
    },
    'dp900': {
        'length': 50, 'minutes': 45, 'passPct': 75, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 75%+ here as a safe buffer, not an exact predictor.',
        'resources': [
            {'label': 'Microsoft Learn: official DP-900 study guide', 'url': 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/dp-900'},
        ],
    },
    'dp300': {
        'length': 52, 'minutes': 120, 'passPct': 70, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 70%+ here as a safe buffer, not an exact predictor.',
        'resources': [
            {'label': 'Microsoft Learn: official DP-300 study guide', 'url': 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/dp-300'},
        ],
    },
    'az305': {
        'length': 50, 'minutes': 120, 'passPct': 75, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 75%+ here as a safe buffer, not an exact predictor.',
        'resources': [
            {'label': 'Microsoft Learn: official AZ-305 study guide', 'url': 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-305'},
            {'label': 'Microsoft Learn: Azure Solutions Architect Expert certification', 'url': 'https://learn.microsoft.com/en-us/credentials/certifications/azure-solutions-architect/'},
        ],
    },
    'az802': {
        'length': 60, 'minutes': 120, 'passPct': 70, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 70%+ here as a safe buffer, not an exact predictor.',
        'resources': [
            {'label': 'Microsoft Learn: official AZ-802 study guide', 'url': 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-802'},
            {'label': 'Microsoft Learn: Windows Server Administrator Associate certification', 'url': 'https://learn.microsoft.com/en-us/credentials/certifications/windows-server-administrator-associate/'},
        ],
    },
    'az140': {
        'length': 50, 'minutes': 120, 'passPct': 70, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 70%+ here as a safe buffer, not an exact predictor. This Specialty certification must be renewed annually via a free online assessment.',
        'resources': [
            {'label': 'Microsoft Learn: official AZ-140 study guide', 'url': 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/az-140'},
        ],
    },
    'md102': {
        'length': 55, 'minutes': 120, 'passPct': 70, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 70%+ here as a safe buffer, not an exact predictor.',
        'resources': [
            {'label': 'Microsoft Learn: official MD-102 study guide', 'url': 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/md-102'},
            {'label': 'Microsoft Learn: Endpoint Administrator Associate certification', 'url': 'https://learn.microsoft.com/en-us/credentials/certifications/modern-desktop/'},
        ],
    },
    'sc300': {
        'length': 54, 'minutes': 100, 'passPct': 70, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 70%+ here as a safe buffer, not an exact predictor.',
        'resources': [
            {'label': 'Microsoft Learn: official SC-300 study guide', 'url': 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-300'},
        ],
    },
    'sc200': {
        'length': 54, 'minutes': 100, 'passPct': 70, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 70%+ here as a safe buffer, not an exact predictor.',
        'resources': [
            {'label': 'Microsoft Learn: official SC-200 study guide', 'url': 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-200'},
            {'label': 'Microsoft Learn: Security Operations Analyst Associate certification', 'url': 'https://learn.microsoft.com/en-us/credentials/certifications/security-operations-analyst/'},
        ],
    },
    'sc500': {
        'length': 70, 'minutes': 110, 'passPct': 70, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 70%+ here as a safe buffer, not an exact predictor.',
        'resources': [
            {'label': 'Microsoft Learn: official SC-500 study guide', 'url': 'https://learn.microsoft.com/en-us/credentials/certifications/resources/study-guides/sc-500'},
            {'label': 'Microsoft Learn: Cloud and AI Security Engineer Associate certification', 'url': 'https://learn.microsoft.com/en-us/credentials/certifications/cloud-and-ai-security-engineer-associate/'},
        ],
    },
    'cloudplus': {
        'length': 90, 'minutes': 90, 'passPct': 83, 'passLabel': "CompTIA scores this 100-900 with 750 to pass, not a flat percentage. Treat 83%+ here as a safe buffer, not an exact predictor. The real exam allows up to 90 questions in 90 minutes — this mode uses every question in the bank once the pool is that large.",
        'resources': [
            {'label': 'CompTIA: official Cloud+ certification page', 'url': 'https://www.comptia.org/en-us/certifications/cloud/'},
        ],
    },
    'ehrintegration': {
        'length': 44, 'minutes': 60, 'passPct': 80, 'passLabel': "This is a self-study concepts module, not an official certification — there's no real exam or official pass score. Treat 80%+ as a personal benchmark for solid understanding, not a predictor of anything.",
        'resources': [
            {'label': 'HL7 International: FHIR specification', 'url': 'https://hl7.org/fhir/directory.html'},
            {'label': 'HL7 International: Version 2 (V2) standard overview', 'url': 'https://www.hl7.org/implement/standards/product_brief.cfm?product_id=185'},
        ],
    },
    'ccna': {
        'length': 60, 'minutes': 75, 'passPct': 82, 'passLabel': "Cisco does not publish the CCNA passing score (it is widely reported to sit around 825/1000, and it can vary by exam form). Treat 82%+ here as a safe buffer, not an exact predictor. The real 200-301 exam runs 120 minutes with roughly 100-120 questions, including simulations and drag-and-drops; this mock is shorter. v1.1 is the current version; v2.0 (same exam code) starts on February 3, 2027.",
        'experience': {
            'level': 'recommended', 'years': 1,
            'summary': 'No formal prerequisites. Cisco recommends about one year of experience implementing and administering Cisco solutions.',
            'waivers': [],
        },
        'resources': [
            {'label': 'Cisco: CCNA certification overview', 'url': 'https://www.cisco.com/site/us/en/learn/training-certifications/certifications/enterprise/ccna/index.html'},
            {'label': 'Cisco Learning Network: CCNA exam topics', 'url': 'https://learningnetwork.cisco.com/s/ccna-exam-topics'},
        ],
    },
    'isc2cc': {
        'length': 50, 'minutes': 60, 'passPct': 75, 'passLabel': "ISC2 scores this 0-1000 with 700 to pass, not a flat percentage. Treat 75%+ here as a safe buffer, not an exact predictor. The real exam is adaptive, with 100-125 questions in 2 hours; this mock is shorter.",
        'experience': {
            'level': 'none', 'years': 0,
            'summary': 'No work experience is required. CC is an entry-level credential built for people starting out in cybersecurity.',
            'waivers': [],
        },
        'resources': [
            {'label': 'ISC2: Certified in Cybersecurity (CC)', 'url': 'https://www.isc2.org/certifications/cc'},
            {'label': 'ISC2: CC exam outline', 'url': 'https://www.isc2.org/Certifications/CC/Certification-Exam-Outline'},
        ],
    },
    'sscp': {
        'length': 60, 'minutes': 80, 'passPct': 75, 'passLabel': "ISC2 scores this 0-1000 with 700 to pass, not a flat percentage. Treat 75%+ here as a safe buffer, not an exact predictor. The real exam is adaptive (100-125 questions in 2 hours); this mock is shorter.",
        'experience': {
            'level': 'required', 'years': 1,
            'summary': 'One year of cumulative paid work experience in one or more of the seven SSCP domains.',
            'waivers': ['A bachelor\'s or master\'s degree in a cybersecurity program (or one on ISC2\'s pre-approved list) can satisfy the one year.'],
            'associate': 'No experience yet? Pass the exam to become an Associate of ISC2, then you have two years to earn the one year of experience.',
        },
        'resources': [
            {'label': 'ISC2: SSCP certification', 'url': 'https://www.isc2.org/certifications/sscp'},
            {'label': 'ISC2: SSCP exam outline', 'url': 'https://www.isc2.org/certifications/sscp/sscp-certification-exam-outline'},
        ],
    },
    'cissp': {
        'length': 75, 'minutes': 110, 'passPct': 75, 'passLabel': "ISC2 scores this 0-1000 with 700 to pass, not a flat percentage. Treat 75%+ here as a safe buffer, not an exact predictor. The real exam is adaptive (100-150 questions, up to 3 hours); this mock uses a fixed set of 75.",
        'experience': {
            'level': 'required', 'years': 5,
            'summary': 'Five years of cumulative paid work experience in two or more of the eight CISSP domains.',
            'waivers': ['One year can be waived with a four-year degree (or regional equivalent) or an approved credential from ISC2\'s list (cut to about 25 credentials on April 1, 2026; CEH, CISA, CRISC and OSCP were removed). Only one year can be waived.'],
            'associate': 'No experience yet? Pass the exam to become an Associate of ISC2, then you have six years to earn the experience.',
        },
        'resources': [
            {'label': 'ISC2: CISSP certification', 'url': 'https://www.isc2.org/certifications/cissp'},
            {'label': 'ISC2: CISSP exam outline', 'url': 'https://www.isc2.org/certifications/cissp/cissp-certification-exam-outline'},
        ],
    },
    'ccsp': {
        'length': 65, 'minutes': 100, 'passPct': 75, 'passLabel': "ISC2 scores this 0-1000 with 700 to pass, not a flat percentage. Treat 75%+ here as a safe buffer, not an exact predictor. The real exam is adaptive (up to 150 questions, 3 hours); this mock is shorter. A revised exam outline took effect August 1, 2026.",
        'experience': {
            'level': 'required', 'years': 5,
            'summary': 'Five years of cumulative paid work experience in information technology, including three in information security and one in one or more of the six CCSP domains.',
            'waivers': ['Holding the CISSP credential satisfies the whole experience requirement.', 'A relevant degree can cover up to one year, and CSA\'s CCSK certificate can cover one year. Check ISC2 for the current rules.'],
            'associate': 'No experience yet? Pass the exam to become an Associate of ISC2, then you have six years to earn the experience.',
        },
        'resources': [
            {'label': 'ISC2: CCSP certification', 'url': 'https://www.isc2.org/certifications/ccsp'},
            {'label': 'ISC2: CCSP exam outline', 'url': 'https://www.isc2.org/certifications/ccsp/ccsp-certification-exam-outline'},
        ],
    },
    'cgrc': {
        'length': 60, 'minutes': 90, 'passPct': 75, 'passLabel': "ISC2 scores this 0-1000 with 700 to pass, not a flat percentage. Treat 75%+ here as a safe buffer, not an exact predictor. The real exam has 125 questions in 3 hours; this mock is shorter.",
        'experience': {
            'level': 'required', 'years': 2,
            'summary': 'Two years of cumulative, paid, full-time work experience in one or more of the seven CGRC domains. Part-time work and internships may also count toward it.',
            'waivers': [],
            'associate': 'No experience yet? Pass the exam to become an Associate of ISC2, then you have three years to earn the experience.',
        },
        'resources': [
            {'label': 'ISC2: CGRC certification', 'url': 'https://www.isc2.org/certifications/cgrc'},
            {'label': 'ISC2: CGRC exam outline', 'url': 'https://www.isc2.org/Certifications/CGRC/Certification-Exam-Outline'},
        ],
    },
    'csslp': {
        'length': 60, 'minutes': 90, 'passPct': 75, 'passLabel': "ISC2 scores this 0-1000 with 700 to pass, not a flat percentage. Treat 75%+ here as a safe buffer, not an exact predictor. The real exam has 125 questions in 3 hours; this mock is shorter.",
        'experience': {
            'level': 'required', 'years': 4,
            'summary': 'Four years of cumulative, paid, full-time work experience in one or more of the eight CSSLP domains.',
            'waivers': ['One year can be waived with a four-year degree in computer science, IT or a related field. An approved ISC2 credential may also waive a year; check ISC2\'s current list.'],
            'associate': 'No experience yet? Pass the exam to become an Associate of ISC2, then you have five years to earn the experience.',
        },
        'resources': [
            {'label': 'ISC2: CSSLP certification', 'url': 'https://www.isc2.org/certifications/csslp'},
            {'label': 'ISC2: CSSLP exam outline', 'url': 'https://www.isc2.org/certifications/csslp/csslp-certification-exam-outline'},
        ],
    },
}
