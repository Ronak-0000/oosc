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
            max_new_tokens=500,
            num_beams=4,
            early_stopping=True
        )

    # Decode the text
    raw_draft = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # Swap the special tags back to real newlines
    formatted_draft = raw_draft.replace(' <br> ', '\n').replace('<br>', '\n')
    
    return formatted_draft