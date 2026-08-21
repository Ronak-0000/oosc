from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
from src.pdf_extractor import extract_pdf_chunks

class DocumentSimplifier:
    def __init__(self, model_path: str = "./models/saved_simplifier"):
        self.tokenizer = AutoTokenizer.from_pretrained(model_path)
        self.model = AutoModelForSeq2SeqLM.from_pretrained(model_path)

    def simplify_pdf(self, pdf_path: str) -> str:
        chunks = extract_pdf_chunks(pdf_path)
        simplified_paragraphs = []

        for chunk in chunks:
            prompt = f"simplify bureaucratic text into simple language: {chunk}"
            inputs = self.tokenizer(prompt, return_tensors="pt", max_length=512, truncation=True)
            output_tokens = self.model.generate(
                **inputs,
                max_length=150,
                num_beams=4,
                early_stopping=True
            )
            simplified_paragraphs.append(self.tokenizer.decode(output_tokens[0], skip_special_tokens=True))

        return "\n\n".join(simplified_paragraphs)
