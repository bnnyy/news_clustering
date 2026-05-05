from typing import List, Optional

import numpy as np
from sklearn.metrics import (
    adjusted_rand_score,
    calinski_harabasz_score,
    davies_bouldin_score,
    normalized_mutual_info_score,
    silhouette_score,
)

from app.schemas import NewsItem


def to_dense_if_needed(matrix):
    if hasattr(matrix, "toarray"):
        return matrix.toarray()
    return np.asarray(matrix)


def get_valid_labels(labels):
    labels_array = np.asarray(labels)
    return labels_array[labels_array != -1]


def has_enough_clusters(labels) -> bool:
    valid_labels = get_valid_labels(labels)
    return len(set(valid_labels)) > 1


def safe_silhouette(matrix, labels) -> Optional[float]:
    if not has_enough_clusters(labels):
        return None

    dense_matrix = to_dense_if_needed(matrix)
    return float(silhouette_score(dense_matrix, labels))


def safe_davies_bouldin(matrix, labels) -> Optional[float]:
    if not has_enough_clusters(labels):
        return None

    dense_matrix = to_dense_if_needed(matrix)
    return float(davies_bouldin_score(dense_matrix, labels))


def safe_calinski_harabasz(matrix, labels) -> Optional[float]:
    if not has_enough_clusters(labels):
        return None

    dense_matrix = to_dense_if_needed(matrix)
    return float(calinski_harabasz_score(dense_matrix, labels))


def get_cluster_size_stats(labels) -> dict:
    labels_array = np.asarray(labels)
    valid_labels = labels_array[labels_array != -1]

    if len(valid_labels) == 0:
        return {
            "avg_cluster_size": 0,
            "min_cluster_size": 0,
            "max_cluster_size": 0,
        }

    _, counts = np.unique(valid_labels, return_counts=True)

    return {
        "avg_cluster_size": float(np.mean(counts)),
        "min_cluster_size": int(np.min(counts)),
        "max_cluster_size": int(np.max(counts)),
    }


def evaluate_clusters(matrix, labels, news: List[NewsItem]) -> dict:
    labels_array = np.asarray(labels)
    n_items = len(labels_array)
    noise_points = int(np.sum(labels_array == -1))

    metrics = {
        "silhouette_score": safe_silhouette(matrix, labels),
        "davies_bouldin_index": safe_davies_bouldin(matrix, labels),
        "calinski_harabasz_index": safe_calinski_harabasz(matrix, labels),
        "n_clusters_detected": int(len(set(labels_array)) - (1 if -1 in labels_array else 0)),
        "noise_points": noise_points,
        "noise_ratio": float(noise_points / n_items) if n_items else 0,
    }

    metrics.update(get_cluster_size_stats(labels_array))

    true_labels = [item.true_cluster for item in news]

    if all(label is not None for label in true_labels):
        metrics["adjusted_rand_index"] = float(adjusted_rand_score(true_labels, labels_array))
        metrics["normalized_mutual_info"] = float(normalized_mutual_info_score(true_labels, labels_array))

    return metrics