import numpy as np
from sklearn.cluster import KMeans, AgglomerativeClustering, DBSCAN, HDBSCAN


class NewsClusterer:
    def _to_dense_if_needed(self, matrix):
        if hasattr(matrix, "toarray"):
            return matrix.toarray()
        return np.asarray(matrix)

    def cluster(self, matrix, algorithm: str, n_clusters: int, eps: float, min_samples: int):
        algorithm = algorithm.lower()
        dense_matrix = self._to_dense_if_needed(matrix)

        if algorithm == "kmeans":
            model = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
            labels = model.fit_predict(dense_matrix)
            return labels

        elif algorithm == "hdbscan":
            model = HDBSCAN(min_cluster_size=min_samples)
            labels = model.fit_predict(dense_matrix)
            return labels

        elif algorithm == "agglomerative":
            model = AgglomerativeClustering(n_clusters=n_clusters)
            labels = model.fit_predict(dense_matrix)
            return labels

        elif algorithm == "dbscan":
            model = DBSCAN(eps=eps, min_samples=min_samples, metric="cosine")
            labels = model.fit_predict(dense_matrix)
            return labels

        raise ValueError(f"Неизвестный алгоритм: {algorithm}")