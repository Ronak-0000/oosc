import os
from huggingface_hub import HfApi
from transformers import AutoConfig, AutoModelForSeq2SeqLM

LOCAL_DIR = "./models/saved_simplifier"
REPO_ID = "Ronak0/rti-pdf-simplifier"

print("1. Optimizing weights to float16...")
model = AutoModelForSeq2SeqLM.from_pretrained(LOCAL_DIR).half()
model.save_pretrained(LOCAL_DIR)

print("2. Generating valid configuration...")
config = AutoConfig.from_pretrained("google/flan-t5-base")
config.save_pretrained(LOCAL_DIR)

print(f"3. Uploading to Hugging Face Model Hub ({REPO_ID})...")
api = HfApi()
api.create_repo(repo_id=REPO_ID, repo_type="model", exist_ok=True)
api.upload_folder(
    folder_path=LOCAL_DIR,
    repo_id=REPO_ID,
    repo_type="model",
)
print("Upload completed successfully.")