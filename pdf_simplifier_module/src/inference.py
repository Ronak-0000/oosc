from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from src.pdf_extractor import extract_pdf_chunks
import torch

class DocumentSimplifier:
    def __init__(self, model_path: str = "./models/saved_simplifier"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(model_path)
        self.model.eval()

    def simplify_pdf(self, pdf_path: str) -> str:
        chunks = extract_pdf_chunks(pdf_path)
        
        if not chunks:
            return "No extractable text found in this PDF. It might be a pure scanned image without an OCR layer."

        simplified_paragraphs = []
        print(f"\nProcessing {len(chunks)} text section(s)...")

        for idx, chunk in enumerate(chunks, 1):
            prompt = f"simplify bureaucratic text into simple language: {chunk}"
            inputs = self.tokenizer(prompt, return_tensors="pt", max_length=512, truncation=True)
            
            with torch.no_grad():
                output_tokens = self.model.generate(
                    **inputs,
                    max_length=120,
                    min_length=20,
                    num_beams=4,
                    no_repeat_ngram_size=3,        # Blocks 3-word repeating loops
                    repetition_penalty=2.5,        # Strongly penalizes token reuse
                    length_penalty=1.0,
                    early_stopping=True
                )
            
            summary = self.tokenizer.decode(output_tokens[0], skip_special_tokens=True)
            simplified_paragraphs.append(f"• {summary}")
            print(f"  └── Completed section {idx}/{len(chunks)}")

        return "\n\n".join(simplified_paragraphs)