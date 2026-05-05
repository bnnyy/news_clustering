from pydantic import BaseModel, Field
from typing import List, Optional


class NewsItem(BaseModel):
    id: int
    title: str
    text: str
    published_at: Optional[str] = None
    true_cluster: Optional[int] = None


class ClusterRequest(BaseModel):
    news: List[NewsItem]
    algorithm: str = Field(default="kmeans")
    vectorizer_type: str = Field(default="tfidf")
    n_clusters: int = Field(default=3, ge=2)
    eps: float = Field(default=0.7, gt=0)
    min_samples: int = Field(default=2, ge=1)


class ClusteredNewsItem(BaseModel):
    id: int
    title: str
    text: str
    published_at: Optional[str] = None
    predicted_cluster: int
    true_cluster: Optional[int] = None


class ClusterPoint(BaseModel):
    id: int
    title: str
    cluster: int
    x: float
    y: float
    published_at: Optional[str] = None


class ClusterResponse(BaseModel):
    algorithm: str
    metrics: dict
    items: List[ClusteredNewsItem]
    grouped_clusters: dict
    cluster_points: List[ClusterPoint]