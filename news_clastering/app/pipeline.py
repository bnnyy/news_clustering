

from typing import List, Tuple

import torch
from sklearn.feature_extraction.text import TfidfVectorizer
from sentence_transformers import SentenceTransformer

from app.schemas import NewsItem
from app.utils import combine_title_and_text, lemmatize_text


class TextPipeline:
    def __init__(self, vectorizer_type: str = "tfidf") -> None:
        self.vectorizer_type = vectorizer_type.lower()
        self.tfidf_vectorizer = TfidfVectorizer(max_features=5000, ngram_range=(1, 2))
        self.embedding_model = None
        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        if self.vectorizer_type == "embeddings":
            self.embedding_model = SentenceTransformer(
                "paraphrase-multilingual-MiniLM-L12-v2",
                device=self.device,
            )

    def preprocess_documents(self, news: List[NewsItem]) -> List[str]:
        processed = []

        for item in news:
            full_text = combine_title_and_text(item.title, item.text)
            processed.append(lemmatize_text(full_text))

        return processed

    def fit_transform(self, news: List[NewsItem]) -> Tuple[List[str], object]:
        processed = self.preprocess_documents(news)

        if self.vectorizer_type == "tfidf":
            matrix = self.tfidf_vectorizer.fit_transform(processed)
            return processed, matrix

        if self.vectorizer_type == "embeddings":
            if self.embedding_model is None:
                raise ValueError("Модель эмбеддингов не была инициализирована")

            matrix = self.embedding_model.encode(
                processed,
                convert_to_numpy=True,
                show_progress_bar=False,
            )
            return processed, matrix

        raise ValueError(f"Неизвестный тип векторизации: {self.vectorizer_type}")