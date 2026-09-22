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
                'key': 'az140',
                'why': 'Azure Virtual Desktop — hospitals commonly deploy shared, clinical-workstation-style virtual desktops so staff can reach the EHR and other systems from any device.',
            },
            {
                'key': 'sc300',
                'why': 'Identity and SSO administration — Entra ID, Conditional Access, and app single sign-on, the identity layer every other system in the hospital plugs into.',
            },
            {
                'key': 'sc200',
                'why': 'Security operations — day-to-day SOC work (Defender XDR, Sentinel, KQL threat hunting), the hands-on incident-response counterpart to identity administration.',
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
    {
        'key': 'systems-engineer-m365',
        'label': 'Systems Engineer — Microsoft 365 Focus',
        'description': (
            "A path for a Systems Engineer role centered on Microsoft 365 — "
            "tenant administration, endpoint/device management, identity, and "
            "security — rather than Azure infrastructure or database work. "
            "Builds from cloud fundamentals straight into the M365 tenant and "
            "the devices/identities that connect to it."
        ),
        'tracks': [
            {
                'key': 'az900',
                'why': 'Cloud fundamentals and vocabulary — the concepts every later track assumes.',
            },
            {
                'key': 'ab650',
                'why': "Microsoft 365 tenant administration, governance, and AI-services (Copilot) management — the core of the role. Replaces the retiring MS-102 as Microsoft's current M365 admin exam.",
            },
            {
                'key': 'md102',
                'why': 'Endpoint administration — Intune, Autopilot, and device compliance, managing the devices that connect to the M365 tenant day to day.',
            },
            {
                'key': 'sc300',
                'why': 'Identity and SSO administration — Entra ID, Conditional Access, and app single sign-on, the identity layer every M365 workload depends on.',
            },
            {
                'key': 'az104',
                'why': 'Hands-on Azure administration — most M365-focused systems engineers also touch the Azure side (storage, networking, VMs) at least occasionally.',
            },
            {
                'key': 'sc200',
                'why': 'Security operations — day-to-day SOC work (Defender XDR, Sentinel, KQL threat hunting) for when something in the tenant needs investigating.',
            },
            {
                'key': 'az802',
                'why': 'Hybrid Windows Server administration — many organizations still run on-premises AD alongside Microsoft 365, and hybrid identity depends on it.',
            },
        ],
    },
]
