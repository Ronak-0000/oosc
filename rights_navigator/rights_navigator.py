from pathlib import Path

import chromadb
import torch

from sentence_transformers import SentenceTransformer, CrossEncoder
from transformers import (
    AutoTokenizer,
    AutoModelForCausalLM,
    BitsAndBytesConfig
)


# ============================================================
# PATHS
# ============================================================

# rights_navigator.py is inside:
# oosc/rights_navigator/
#
# Therefore:
# .parent       -> oosc/rights_navigator
# .parent.parent -> oosc

PROJECT_ROOT = Path(__file__).resolve().parent.parent

CHROMA_PATH = PROJECT_ROOT / "database" / "chroma_db"


# ============================================================
# EMBEDDING MODEL
# ============================================================

print("Loading embedding model...")

embedding_model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2"
)

print("Embedding model loaded.")


# ============================================================
# RERANKER
# ============================================================

print("Loading reranker...")

reranker = CrossEncoder(
    "cross-encoder/ms-marco-MiniLM-L-6-v2"
)

print("Reranker loaded.")


# ============================================================
# QWEN 2.5 3B - 4 BIT QUANTIZED
# ============================================================

LLM_MODEL = "Qwen/Qwen2.5-3B-Instruct"

print("Loading Qwen model in 4-bit...")

tokenizer = AutoTokenizer.from_pretrained(
    LLM_MODEL
)

quantization_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.float16,
    bnb_4bit_use_double_quant=True
)

llm_model = AutoModelForCausalLM.from_pretrained(
    LLM_MODEL,
    quantization_config=quantization_config,
    device_map="auto",
    dtype=torch.float16
)

print("Qwen 4-bit model loaded.")


# ============================================================
# CHROMADB
# ============================================================

print("Connecting to ChromaDB...")

client = chromadb.PersistentClient(
    path=str(CHROMA_PATH)
)

collection = client.get_collection(
    name="legal_documents"
)

print("ChromaDB connected.")


# ============================================================
# DOMAIN KEYWORDS
# ============================================================

consumer_keywords = [
    "seller",
    "shopkeeper",
    "shop",
    "product",
    "goods",
    "purchase",
    "refund",
    "replacement",
    "defective",
    "defect",
    "damaged",
    "consumer",
    "customer",
    "order",
    "delivery",
    "delivered",
    "warranty",
    "price",
    "money back",
    "wrong product",
    "different product",
    "different item",
    "online shopping",
    "ecommerce",
    "e-commerce",
    "service provider",
    "misleading advertisement"
]


tenancy_keywords = [
    "landlord",
    "tenant",
    "rent",
    "rental",
    "lease",
    "rent agreement",
    "rental agreement",
    "security deposit",
    "deposit",
    "eviction",
    "rented house",
    "rented flat",
    "tenancy",
    "tenancy agreement",
    "rent increase",
    "rent payment",
    "tenant rights",
    "rental property"
]


workplace_keywords = [
    "employer",
    "employee",
    "salary",
    "wages",
    "wage",
    "job",
    "workplace",
    "worker",
    "labour",
    "labor",
    "employment",
    "dismissed",
    "termination",
    "terminated",
    "fired",
    "layoff",
    "laid off",
    "retrenchment",
    "strike",
    "union",
    "trade union",
    "industrial dispute",
    "bonus",
    "overtime",
    "employment contract",
    "wrongful termination"
]


# ============================================================
# MAIN FUNCTION
# ============================================================

def get_rights_response(query: str):

    query = query.strip()

    if not query:
        return {
            "success": False,
            "error": "Grievance cannot be empty."
        }

    print("\n========================================")
    print("RIGHTS NAVIGATOR")
    print("========================================")
    print("Grievance:", query)

    query_lower = query.lower()


    # ========================================================
    # DOMAIN DETECTION
    # ========================================================

    print("\nDetecting legal domain...")

    domain_scores = {
        "consumer": 0,
        "tenancy": 0,
        "workplace": 0
    }


    for keyword in consumer_keywords:

        if keyword in query_lower:
            domain_scores["consumer"] += 1


    for keyword in tenancy_keywords:

        if keyword in query_lower:
            domain_scores["tenancy"] += 1


    for keyword in workplace_keywords:

        if keyword in query_lower:
            domain_scores["workplace"] += 1


    # Strong tenancy indicators

    if (
        "landlord" in query_lower
        or "tenant" in query_lower
    ):
        domain_scores["tenancy"] += 5


    # Strong workplace indicators

    if (
        "employer" in query_lower
        or "employee" in query_lower
    ):
        domain_scores["workplace"] += 5


    # Strong consumer indicators

    if (
        "seller" in query_lower
        or "defective product" in query_lower
        or "refund" in query_lower
        or "wrong product" in query_lower
    ):
        domain_scores["consumer"] += 5


    selected_domain = max(
        domain_scores,
        key=domain_scores.get
    )

    highest_score = domain_scores[selected_domain]


    print("Detected domain:", selected_domain.upper())


    # ========================================================
    # UNKNOWN DOMAIN
    # ========================================================

    if highest_score == 0:

        print("No supported legal domain detected.")

        return {
            "success": True,
            "domain": "unknown",
            "answer": (
                "The available legal material does not clearly cover "
                "this type of grievance."
            ),
            "sources": []
        }


    # ========================================================
    # RETRIEVAL CONCEPTS
    # ========================================================

    if selected_domain == "consumer":

        retrieval_concepts = """
        consumer protection
        seller
        buyer
        consumer
        goods
        defective goods
        defective product
        damaged product
        wrong product
        different product
        product not as ordered
        goods not matching description
        refund
        replacement
        return of price
        compensation
        consumer complaint
        unfair trade practice
        deficiency in service
        District Commission
        """


    elif selected_domain == "tenancy":

        retrieval_concepts = """
        tenancy
        tenant
        landlord
        rent
        rental agreement
        lease
        security deposit
        rent deposit
        eviction
        rental property
        residential premises
        tenancy rights
        landlord obligations
        tenant obligations
        rent dispute
        """


    else:

        retrieval_concepts = """
        workplace
        employer
        employee
        worker
        wages
        salary
        employment
        industrial dispute
        labour
        labor
        termination
        dismissal
        retrenchment
        strike
        trade union
        employment dispute
        worker rights
        """


    # ========================================================
    # RETRIEVAL QUERY
    # ========================================================

    retrieval_query = f"""
    Legal dispute in the {selected_domain} domain:

    USER GRIEVANCE:
    {query}

    RELEVANT LEGAL CONCEPTS:
    {retrieval_concepts}
    """


    # ========================================================
    # EMBEDDING
    # ========================================================

    print("\nGenerating query embedding...")

    query_embedding = embedding_model.encode(
        retrieval_query
    )

    print("Query embedding generated.")


    # ========================================================
    # CHROMADB SEARCH
    # ========================================================

    print("\nSearching legal database...")

    results = collection.query(
        query_embeddings=[
            query_embedding.tolist()
        ],
        n_results=10,
        where={
            "category": selected_domain
        }
    )

    print("ChromaDB search completed.")


    documents = results["documents"][0]
    metadatas = results["metadatas"][0]


    if len(documents) == 0:

        print("No legal documents found.")

        return {
            "success": True,
            "domain": selected_domain,
            "answer": (
                "No relevant legal material was found for "
                "this grievance."
            ),
            "sources": []
        }


    print("Retrieved sections:", len(documents))


    # ========================================================
    # CROSS-ENCODER RERANKING
    # ========================================================

    print("\nReranking legal sections...")

    pairs = [
        (query, document)
        for document in documents
    ]


    rerank_scores = reranker.predict(
        pairs
    )

    print("Reranking completed.")


    # ========================================================
    # LEGAL BOOSTING
    # ========================================================

    ranked_results = []


    for score, document, metadata in zip(
        rerank_scores,
        documents,
        metadatas
    ):

        text_lower = document.lower()

        legal_boost = 0.0


        # ====================================================
        # CONSUMER
        # ====================================================

        if selected_domain == "consumer":

            if any(
                word in query_lower
                for word in [
                    "refund",
                    "return",
                    "money back"
                ]
            ):

                if "return to the complainant the price" in text_lower:
                    legal_boost += 5.0

                if "replace the goods" in text_lower:
                    legal_boost += 4.0


            if any(
                word in query_lower
                for word in [
                    "defective",
                    "defect",
                    "damaged"
                ]
            ):

                if "defects" in text_lower:
                    legal_boost += 3.0

                if "defective product" in text_lower:
                    legal_boost += 3.0


            if any(
                word in query_lower
                for word in [
                    "different product",
                    "wrong product",
                    "not as ordered",
                    "different item"
                ]
            ):

                if "goods sold or delivered" in text_lower:
                    legal_boost += 4.0

                if "replace the goods" in text_lower:
                    legal_boost += 4.0

                if "return to the complainant the price" in text_lower:
                    legal_boost += 4.0


            if any(
                word in query_lower
                for word in [
                    "complaint",
                    "file a complaint",
                    "consumer commission"
                ]
            ):

                if "complaint" in text_lower:
                    legal_boost += 2.0


        # ====================================================
        # TENANCY
        # ====================================================

        elif selected_domain == "tenancy":

            if any(
                word in query_lower
                for word in [
                    "deposit",
                    "security deposit"
                ]
            ):

                if "security deposit" in text_lower:
                    legal_boost += 5.0

                elif "deposit" in text_lower:
                    legal_boost += 3.0


            if (
                "rent" in query_lower
                or "rental" in query_lower
            ):

                if "rent" in text_lower:
                    legal_boost += 3.0


            if "landlord" in query_lower:

                if "landlord" in text_lower:
                    legal_boost += 3.0


            if "tenant" in query_lower:

                if "tenant" in text_lower:
                    legal_boost += 3.0


            if "eviction" in query_lower:

                if "eviction" in text_lower:
                    legal_boost += 5.0


        # ====================================================
        # WORKPLACE
        # ====================================================

        elif selected_domain == "workplace":

            if any(
                word in query_lower
                for word in [
                    "salary",
                    "wages",
                    "wage"
                ]
            ):

                if "wages" in text_lower:
                    legal_boost += 5.0

                if "salary" in text_lower:
                    legal_boost += 5.0


            if any(
                word in query_lower
                for word in [
                    "termination",
                    "terminated",
                    "dismissed",
                    "fired",
                    "retrenchment",
                    "layoff",
                    "laid off"
                ]
            ):

                if "termination" in text_lower:
                    legal_boost += 4.0

                if "retrenchment" in text_lower:
                    legal_boost += 4.0

                if "dismissed" in text_lower:
                    legal_boost += 3.0


            if "strike" in query_lower:

                if "strike" in text_lower:
                    legal_boost += 5.0


            if (
                "union" in query_lower
                or "trade union" in query_lower
            ):

                if "union" in text_lower:
                    legal_boost += 4.0


            if any(
                word in query_lower
                for word in [
                    "employer",
                    "employee",
                    "worker"
                ]
            ):

                if "employer" in text_lower:
                    legal_boost += 2.0

                if "employee" in text_lower:
                    legal_boost += 2.0

                if "worker" in text_lower:
                    legal_boost += 2.0


        # ====================================================
        # FINAL SCORE
        # ====================================================

        final_score = (
            float(score)
            + legal_boost
        )


        ranked_results.append(
            (
                final_score,
                float(score),
                legal_boost,
                document,
                metadata
            )
        )


    # ========================================================
    # SORT
    # ========================================================

    ranked_results.sort(
        key=lambda x: x[0],
        reverse=True
    )


    # ========================================================
    # TOP 3
    # ========================================================

    ranked_results = ranked_results[:3]


    print("\nTop legal sections:")

    for i, (
        final_score,
        original_score,
        legal_boost,
        document,
        metadata
    ) in enumerate(ranked_results):

        print(
            f"#{i + 1} | "
            f"Section {metadata['section']} | "
            f"Page {metadata['page']} | "
            f"Score {final_score:.4f}"
        )


    # ========================================================
    # BUILD LEGAL CONTEXT
    # ========================================================

    print("\nBuilding legal context...")

    context_parts = []
    sources = []


    for i, (
        final_score,
        original_score,
        legal_boost,
        document,
        metadata
    ) in enumerate(ranked_results):

        context_parts.append(
            f"""
SOURCE {i + 1}

ACT:
{metadata['act']}

CATEGORY:
{metadata['category']}

SECTION:
{metadata['section']}

TITLE:
{metadata['title']}

PAGE:
{metadata['page']}

LEGAL TEXT:
{document}

END SOURCE {i + 1}
"""
        )


        sources.append(
            {
                "act": metadata["act"],
                "section": metadata["section"],
                "title": metadata["title"],
                "page": metadata["page"]
            }
        )


    context = "\n".join(context_parts)

    print("Legal context ready.")


    # ========================================================
    # PROMPT
    # ========================================================

    prompt = f"""
You are Rights Navigator, an Indian legal information assistant.

Detected legal domain:
{selected_domain}

USER GRIEVANCE:
{query}


==================================================
LEGAL CONTEXT
==================================================

{context}


==================================================
STRICT EVIDENCE RULES
==================================================

You MUST answer using ONLY the legal material in the
LEGAL CONTEXT.

Do not use outside legal knowledge.

Do not invent:

- legal sections
- legal rights
- remedies
- deadlines
- authorities
- penalties
- procedures
- appeal mechanisms

Every legal claim MUST be supported by the exact
section whose legal text contains that claim.

Do not combine different sections and attribute their
contents to one section.

If the context does not support a claim, do not make
that claim.

This is legal information, not personalized legal
representation.


==================================================
DOMAIN RULE
==================================================

Only discuss the detected domain:

{selected_domain}

Do not introduce laws from another domain.


==================================================
IMPORTANT EVIDENCE RULE
==================================================

Prefer substantive legal provisions over procedural
provisions.

A section that provides a refund or replacement is
a substantive remedy.

A section that only explains how a complaint is filed
is a procedural provision.

Do not present a procedural provision as a legal remedy.


==================================================
OUTPUT FORMAT
==================================================

Provide EXACTLY these three sections:

### 1. YOUR LEGAL RIGHTS

Give maximum 3 concise bullet points.

For every important legal claim, mention:

Act + Section.


### 2. IMMEDIATE ACTIONABLE STEPS

Give maximum 4 numbered steps.

Only provide steps directly supported by the legal
material.

Do not invent deadlines, forms, authorities or
procedures.


### 3. WHERE TO ESCALATE

Mention an escalation authority ONLY if the retrieved
legal material explicitly contains an escalation rule.

Do not infer an escalation authority from general
legal knowledge.

If the context does not explicitly identify an
escalation mechanism, output exactly:

Insufficient information in the retrieved legal material
to determine the escalation authority.


==================================================
STYLE
==================================================

Keep the answer concise and practical.

Do not reproduce the legal text.

Summarize legal provisions in your own words.

Do not quote long passages.

Do not repeat the same legal claim.

Do not hallucinate.

Do not guess.
"""


    # ========================================================
    # GENERATE WITH QWEN
    # ========================================================

    print("\nGenerating answer with Qwen...")
    print("This may take some time because the model may use CPU/disk offloading.")


    messages = [
        {
            "role": "system",
            "content": (
                "You are Rights Navigator, an Indian legal "
                "information assistant. Use only the provided "
                "legal context."
            )
        },
        {
            "role": "user",
            "content": prompt
        }
    ]


    # ========================================================
    # CHAT TEMPLATE
    # ========================================================

    text = tokenizer.apply_chat_template(
        messages,
        tokenize=False,
        add_generation_prompt=True
    )


    # ========================================================
    # TOKENIZE
    # ========================================================

    model_inputs = tokenizer(
        [text],
        return_tensors="pt"
    )


    # ========================================================
    # MOVE INPUT TO MODEL DEVICE
    # ========================================================

    model_inputs = {
        key: value.to(llm_model.device)
        for key, value in model_inputs.items()
    }


    # ========================================================
    # GENERATION
    # ========================================================

    with torch.no_grad():

        generated_ids = llm_model.generate(
            **model_inputs,
            max_new_tokens=250,
            do_sample=False,
            pad_token_id=tokenizer.eos_token_id
        )


    print("Qwen generation completed.")


    # ========================================================
    # REMOVE INPUT TOKENS
    # ========================================================

    generated_ids = [
        output_ids[len(input_ids):]
        for input_ids, output_ids
        in zip(
            model_inputs["input_ids"],
            generated_ids
        )
    ]


    # ========================================================
    # DECODE
    # ========================================================

    answer = tokenizer.batch_decode(
        generated_ids,
        skip_special_tokens=True
    )[0].strip()


    # ========================================================
    # RETURN
    # ========================================================

    print("Answer generated successfully.")


    return {
        "success": True,
        "domain": selected_domain,
        "answer": answer,
        "sources": sources
    }