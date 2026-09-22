"""Track metadata: which certs exist, whether they are visible, and exam parameters."""

STORAGE_KEY = 'cert-study-progress'

TRACKS = [
    {'key': 'itil', 'label': 'ITIL', 'subtitle': 'Foundation, Version 5'},
    {'key': 'az900', 'label': 'AZ-900', 'subtitle': 'Azure Fundamentals'},
    {'key': 'az104', 'label': 'AZ-104', 'subtitle': 'Azure Administrator'},
    {'key': 'dp900', 'label': 'DP-900', 'subtitle': 'Azure Data Fundamentals'},
    {'key': 'dp300', 'label': 'DP-300', 'subtitle': 'Azure Database Administrator'},
    {'key': 'az305', 'label': 'AZ-305', 'subtitle': 'Azure Solutions Architect Expert'},
    {'key': 'az802', 'label': 'AZ-802', 'subtitle': 'Windows Server Administrator'},
    {'key': 'sc300', 'label': 'SC-300', 'subtitle': 'Identity & Access Administrator'},
    {'key': 'sc500', 'label': 'SC-500', 'subtitle': 'Cloud & AI Security Engineer'},
    {'key': 'cloudplus', 'label': 'Cloud+', 'subtitle': 'CompTIA Cloud+ (CV0-004)'},
    {'key': 'ehrintegration', 'label': 'EHR Integration', 'subtitle': 'Healthcare Interoperability Concepts (not a certification)'},
]

EXAM_CONFIG = {
    'itil': {'length': 40, 'minutes': 60, 'passPct': 65, 'passLabel': 'Real pass mark: 26/40 (65%)'},
    'az900': {'length': 50, 'minutes': 45, 'passPct': 75, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 75%+ here as a safe buffer, not an exact predictor.'},
    'az104': {'length': 50, 'minutes': 100, 'passPct': 75, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 75%+ here as a safe buffer, not an exact predictor.'},
    'dp900': {'length': 50, 'minutes': 45, 'passPct': 75, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 75%+ here as a safe buffer, not an exact predictor.'},
    'dp300': {'length': 52, 'minutes': 120, 'passPct': 70, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 70%+ here as a safe buffer, not an exact predictor.'},
    'az305': {'length': 50, 'minutes': 120, 'passPct': 75, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 75%+ here as a safe buffer, not an exact predictor.'},
    'az802': {'length': 60, 'minutes': 120, 'passPct': 70, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 70%+ here as a safe buffer, not an exact predictor.'},
    'sc300': {'length': 54, 'minutes': 100, 'passPct': 70, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 70%+ here as a safe buffer, not an exact predictor.'},
    'sc500': {'length': 70, 'minutes': 110, 'passPct': 70, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 70%+ here as a safe buffer, not an exact predictor.'},
    'cloudplus': {'length': 90, 'minutes': 90, 'passPct': 83, 'passLabel': "CompTIA scores this 100-900 with 750 to pass, not a flat percentage. Treat 83%+ here as a safe buffer, not an exact predictor. The real exam allows up to 90 questions in 90 minutes — this mode uses every question in the bank once the pool is that large."},
    'ehrintegration': {'length': 44, 'minutes': 60, 'passPct': 80, 'passLabel': "This is a self-study concepts module, not an official certification — there's no real exam or official pass score. Treat 80%+ as a personal benchmark for solid understanding, not a predictor of anything."},
}
