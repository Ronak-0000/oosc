from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, Seq2SeqTrainer, Seq2SeqTrainingArguments, DataCollatorForSeq2Seq
from datasets import load_dataset

def main():
    model_id = "google/flan-t5-base"
    tokenizer = AutoTokenizer.from_pretrained(model_id)
    model = AutoModelForSeq2SeqLM.from_pretrained(model_id)

    dataset = load_dataset("json", data_files={
        "train": "data/train_pairs.json",
        "validation": "data/val_pairs.json"
    })

    prefix = "simplify bureaucratic text into simple language: "

    def preprocess(examples):
        inputs = [prefix + doc for doc in examples["complex_text"]]
        model_inputs = tokenizer(inputs, max_length=512, truncation=True)
        labels = tokenizer(text_target=examples["simple_text"], max_length=128, truncation=True)
        model_inputs["labels"] = labels["input_ids"]
        return model_inputs

    tokenized_data = dataset.map(preprocess, batched=True)

    training_args = Seq2SeqTrainingArguments(
        output_dir="./models/checkpoints",
        eval_strategy="epoch",
        learning_rate=5e-5,
        per_device_train_batch_size=4,
        per_device_eval_batch_size=4,
        num_train_epochs=4,
        weight_decay=0.01,
        save_strategy="epoch",
        logging_steps=10
    )

    trainer = Seq2SeqTrainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_data["train"],
        eval_dataset=tokenized_data["validation"],
        tokenizer=tokenizer,
        data_collator=DataCollatorForSeq2Seq(tokenizer, model=model)
    )

    trainer.train()
    model.save_pretrained("./models/saved_simplifier")
    tokenizer.save_pretrained("./models/saved_simplifier")

if __name__ == "__main__":
    main()
