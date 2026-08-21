import sys
from pathlib import Path

# Ensure root directory is on path
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.append(str(root_dir))

from rights_navigator_module.navigator import guide_dispute

def run_tests():
    test_cases = [
        "Landlord is refusing to return my security deposit of Rs 50,000 even after 40 days of moving out.",
        "Bought a laptop online for Rs 65,000. It arrived broken and the seller is refusing replacement.",
        "Company terminated me without 30-day notice and withheld Rs 40,000 in unpaid salary."
    ]

    print("=" * 60)
    print("RUNNING RIGHTS NAVIGATOR LOCAL TEST")
    print("=" * 60)

    for idx, grievance in enumerate(test_cases, 1):
        print(f"\n[Case {idx}] Grievance: {grievance}\n")
        remedy = guide_dispute(grievance)
        print(remedy)
        print("-" * 60)

if __name__ == "__main__":
    run_tests()