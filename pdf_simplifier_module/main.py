import sys
from src.inference import DocumentSimplifier

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python main.py <path_to_pdf>")
        sys.exit(1)

    pdf_file = sys.argv[1]
    simplifier = DocumentSimplifier()
    result = simplifier.simplify_pdf(pdf_file)

    print("\n--- SIMPLIFIED CIVIC SUMMARY ---\n")
    print(result)
