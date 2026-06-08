# Lazy-loaded sentence-transformer classifier.
# Model is loaded fresh per classify call and freed immediately after,
# to stay under tight memory limits (e.g. Render's 512MB free tier).
# Trade-off: ~10-20s load overhead per request vs ~400MB constant memory cost.

import gc
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

MODEL_NAME = 'all-MiniLM-L6-v2'

LABEL_DESCRIPTIONS = {
    'Food & Dining':     'restaurant food dining eating zomato dominos pizza delivery meal cafe',
    'Shopping':          'shopping amazon flipkart ebay online retail store purchase clothes electronics',
    'Travel':            'flight airline travel booking ticket indigo air india makemytrip hotel',
    'Transfers & IMPS':  'imps funds transfer upi neft payment send money mobile banking transaction',
    'Crypto':            'crypto bitcoin ethereum binance wazirx coinbase exchange digital currency',
    'Bills & Utilities': 'bill payment utility electricity recharge mobile broadband insurance paybill',
    'Groceries':         'grocery supermarket bigbazaar local shop provisions vegetables daily essentials',
    'Finance & Loans':   'emi loan mutual funds investment savings deposit withdrawal atm cash finance',
    'Income & Refunds':  'salary credit refund reversal cashback bonus income deposit',
}

# Module-level caches: only the small stuff
_label_names = list(LABEL_DESCRIPTIONS.keys())
_label_embeddings = None  # computed on first call, then cached forever


def _load_model():
    """Load the model fresh. Caller is responsible for freeing it."""
    return SentenceTransformer(MODEL_NAME)


def _compute_label_embeddings_once():
    """Compute label embeddings on first call only, cache them, free the model."""
    global _label_embeddings
    if _label_embeddings is not None:
        return
    model = _load_model()
    _label_embeddings = model.encode(
        list(LABEL_DESCRIPTIONS.values()),
        show_progress_bar=False
    )
    del model
    gc.collect()


def classify_transactions(descriptions: list[str]) -> list[str]:
    """Lazy-loads the model, classifies, then frees memory."""
    _compute_label_embeddings_once()

    model = _load_model()
    results = []
    try:
        for i in range(0, len(descriptions), 512):
            batch = descriptions[i:i + 512]
            q_emb = model.encode(batch, show_progress_bar=False)
            sims = cosine_similarity(q_emb, _label_embeddings)
            results.extend([_label_names[idx] for idx in np.argmax(sims, axis=1)])
    finally:
        del model
        gc.collect()

    return results
