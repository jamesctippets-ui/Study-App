"""Track metadata: which certs exist, whether they are visible, and exam parameters."""

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
}
