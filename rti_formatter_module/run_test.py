import sys
from pathlib import Path

# Ensure the root directory is on the path so module imports work correctly
root_dir = Path(__file__).resolve().parent.parent
if str(root_dir) not in sys.path:
    sys.path.append(str(root_dir))

from rti_formatter_module.generator import generate_rti_draft

def test_formatter():
    test_cases = [
        (
            "Road Infrastructure",
            "There are massive potholes on MG Road near the metro station causing traffic jams and accidents since last month. No repairs have been done."
        ),
        (
            "Water Supply Issue",
            "Water supply has been completely cut off in Sector 4 residential area for the past 4 days without prior notice from the municipal corporation."
        ),
        (
            "Garbage Disposal",
            "Sanitation workers have not collected garbage from Ward 12 for two weeks, creating illegal open dumping sites near the school."
        )
    ]

    print("=" * 60)
    print("RUNNING RTI FORMATTER TEST SUITE")
    print("=" * 60)

    for idx, (category, grievance) in enumerate(test_cases, 1):
        print(f"\n[Test Case {idx}] Category: {category}")
        print(f"Input Grievance: {grievance}\n")
        
        try:
            draft = generate_rti_draft(grievance)
            print("--- Output RTI Draft ---")
            print(draft)
        except Exception as e:
            print(f"Error during generation: {e}")
            
        print("-" * 60)

if __name__ == "__main__":
    test_formatter()