from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

def generate_rti_draft(complaint_text: str, model_id: str = "CaseLoop/rti-formatter") -> str:
    """Loads the fine-tuned T5 formatter from Hugging Face and generates a structured RTI draft."""
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_id)

    prompt = f"Format as RTI: {complaint_text}"
    inputs = tokenizer(prompt, return_tensors="pt")

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=256,
            num_beams=4,
            no_repeat_ngram_size=3,      # Prevents repeated loops
            repetition_penalty=2.0,      # Penalizes word/phrase repetition
            early_stopping=True
        )

    return tokenizer.decode(outputs[0], skip_special_tokens=True)