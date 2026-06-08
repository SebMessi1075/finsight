"""
Sentence-transformer classifier for transaction descriptions.
Model loads once at first call and stays in memory for fast subsequent inference.
"""
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

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

_model = None
_label_names = None
_label_embeddings = None


def get_model():
    global _model, _label_names, _label_embeddings
    if _model is None:
        print("[ML] Loading sentence-transformer...")
        _model = SentenceTransformer('all-MiniLM-L6-v2')
        _label_names = list(LABEL_DESCRIPTIONS.keys())
        _label_embeddings = _model.encode(list(LABEL_DESCRIPTIONS.values()), show_progress_bar=False)
    return _model, _label_names, _label_embeddings


def classify_transactions(descriptions: list[str]) -> list[str]:
    model, label_names, label_embeddings = get_model()
    results = []
    for i in range(0, len(descriptions), 512):
        batch = descriptions[i:i + 512]
        q_emb = model.encode(batch, show_progress_bar=False)
        sims = cosine_similarity(q_emb, label_embeddings)
        results.extend([label_names[idx] for idx in np.argmax(sims, axis=1)])
    return results