"""Track metadata: which certs exist, whether they are visible, and exam parameters."""

STORAGE_KEY = 'cert-study-progress'

TRACKS = [
    {'key': 'itil', 'label': 'ITIL', 'subtitle': 'Foundation, Version 5'},
    {'key': 'az900', 'label': 'AZ-900', 'subtitle': 'Azure Fundamentals'},
    {'key': 'az104', 'label': 'AZ-104', 'subtitle': 'Azure Administrator'},
]

EXAM_CONFIG = {
    'itil': {'length': 40, 'minutes': 60, 'passPct': 65, 'passLabel': 'Real pass mark: 26/40 (65%)'},
    'az900': {'length': 50, 'minutes': 45, 'passPct': 75, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 75%+ here as a safe buffer, not an exact predictor.'},
    'az104': {'length': 50, 'minutes': 100, 'passPct': 75, 'passLabel': 'Microsoft scores this 0-1000 with 700 to pass, not a flat percentage. Treat 75%+ here as a safe buffer, not an exact predictor.'},
}
