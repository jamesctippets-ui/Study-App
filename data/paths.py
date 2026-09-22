"""Named learning paths: a recommended order to work through several tracks
toward a stated goal, plus a one-line reason for each step. See ROADMAP.md
section 1 ("Multi-cert learning paths")."""

PATHS = [
    {
        'key': 'healthcare-ms-engineer',
        'label': 'Hospital Microsoft Engineer',
        'description': (
            "A Microsoft-stack path for a healthcare IT engineer role, with a "
            "database-management focus. Builds from cloud fundamentals through "
            "hands-on administration, data/database administration, hybrid "
            "infrastructure, and security — the mix most hospital Microsoft-stack "
            "IT roles actually combine, since patient/clinical data almost always "
            "lives in SQL Server or Azure SQL somewhere in the stack."
        ),
        'tracks': [
            {
                'key': 'az900',
                'why': 'Cloud fundamentals and vocabulary — the concepts every later track assumes.',
            },
            {
                'key': 'az104',
                'why': 'Hands-on Azure administration: the day-to-day admin skillset behind any Microsoft-stack IT role.',
            },
            {
                'key': 'dp900',
                'why': 'Data fundamentals — relational vs. non-relational, OLTP vs. OLAP — before specializing in database administration.',
            },
            {
                'key': 'dp300',
                'why': 'Database administration. Patient records and other clinical systems typically run on SQL Server/Azure SQL, making this the database-management core of the path.',
            },
            {
                'key': 'az802',
                'why': 'Hybrid Windows Server administration — most hospitals still run substantial on-premises AD/Windows Server infrastructure alongside Azure.',
            },
            {
                'key': 'sc300',
                'why': 'Identity and SSO administration — Entra ID, Conditional Access, and app single sign-on, the identity layer every other system in the hospital plugs into.',
            },
            {
                'key': 'sc500',
                'why': "Broader security operations. Healthcare IT carries HIPAA-level stakes, and this covers Microsoft's current security and AI-security tooling beyond identity alone.",
            },
            {
                'key': 'az305',
                'why': 'Solutions architecture — the capstone for designing infrastructure, not just operating it.',
            },
            {
                'key': 'ehrintegration',
                'why': "Applies the whole stack to the job itself: how hospital systems like Epic actually exchange data (HL7v2, FHIR, interface engines) — not a certification, just the on-the-job knowledge that ties everything above to healthcare IT specifically.",
            },
        ],
    },
]
