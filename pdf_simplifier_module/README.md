Requirements.txt -> List of Python dependencies

data/val_pairs.json and data/train_pairs.json -> Training dataset (JSON array)

src/pdf_extractor.py -> Reads input PDFs, strips OCR artifacts and boilerplate footers, and splits the content into digestible chunks.

src/train.py -> Loads train_pairs.json, tokenizes the data, fine-tunes google/flan-t5-base, and saves the weights to models/saved_simplifier/

src/inference.py -> Takes a PDF file path, extracts text via pdf_extractor.py, passes it through the fine-tuned model, and returns plain-English text.

main.py -> Entry point to test the full pipeline
