from transformers import AutoTokenizer, AutoModelForSeq2SeqLM
import torch

def guide_dispute(grievance_text: str, model_id: str = "CaseLoop/rights-navigator") -> str:
    """Loads the fine-tuned Rights Navigator model and returns structured legal remedies."""
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_id)

    prompt = f"Guide Dispute: {grievance_text}"
    inputs = tokenizer(prompt, return_tensors="pt")

    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_new_tokens=350,
            num_beams=4,
            no_repeat_ngram_size=3,
            repetition_penalty=1.5,
            early_stopping=True
        )

    raw_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return raw_text.replace(' <br> ', '\n').replace('<br>', '\n')