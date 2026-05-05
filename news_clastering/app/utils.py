import re
import pymorphy2
from app.config import STOP_WORDS

morph = pymorphy2.MorphAnalyzer()


def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^а-яa-z0-9\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def lemmatize_text(text: str) -> str:
    words = clean_text(text).split()
    lemmas = []
    for word in words:
        if word in STOP_WORDS:
            continue
        parsed = morph.parse(word)[0]
        lemma = parsed.normal_form
        if lemma not in STOP_WORDS and len(lemma) > 2:
            lemmas.append(lemma)
    return " ".join(lemmas)


def combine_title_and_text(title: str, text: str) -> str:
    return f"{title} {text}"