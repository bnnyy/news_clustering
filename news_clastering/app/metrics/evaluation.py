from typing import List, Optional
import numpy as np
from sklearn.metrics import silhouette_score, adjusted_rand_score, normalized_mutual_info_score
from app.schemas import NewsItem


def to_dense_if_needed(matrix):
    if hasattr(matrix, "toarray"):
        return matrix.toarray()
    return np.asarray(matrix)


def safe_silhouette(matrix, labels) -> Optional[float]:
    unique_labels = set(labels)
    if len(unique_labels) <= 1:
        return None
    if -1 in unique_labels and len(unique_labels) == 2:
        return None

    dense_matrix = to_dense_if_needed(matrix)
    return float(silhouette_score(dense_matrix, labels))


def evaluate_clusters(matrix, labels, news: List[NewsItem]) -> dict:
    metrics = {
        "silhouette_score": safe_silhouette(matrix, labels),
        "n_clusters_detected": int(len(set(labels)) - (1 if -1 in labels else 0)),
        "noise_points": int(np.sum(np.array(labels) == -1)),
    }

    true_labels = [item.true_cluster for item in news]
    if all(label is not None for label in true_labels):
        metrics["adjusted_rand_index"] = float(adjusted_rand_score(true_labels, labels))
        metrics["normalized_mutual_info"] = float(normalized_mutual_info_score(true_labels, labels))

    return metrics