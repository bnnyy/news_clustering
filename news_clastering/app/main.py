from collections import defaultdict

import numpy as np
import torch

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from sklearn.decomposition import PCA

from app.chronology import build_cluster_chronology
from app.clustering import NewsClusterer
from app.evaluation import evaluate_clusters
from app.news_fetcher import fetch_news
from app.pipeline import TextPipeline
from app.schemas import ClusterRequest, ClusterResponse, ClusteredNewsItem, ClusterPoint
from app.topic_extraction import build_cluster_topics


app = FastAPI(title="Система кластеризации новостей")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")


DEMO_API_NEWS = [
    {
        "id": 1,
        "title": "Apple представила новый iPhone",
        "text": "Компания Apple анонсировала новую модель iPhone с улучшенной камерой.",
        "published_at": "2025-03-01 09:00",
        "true_cluster": 0,
    },
    {
        "id": 2,
        "title": "Новый iPhone получил обновленный процессор",
        "text": "Apple сообщила о росте производительности нового смартфона.",
        "published_at": "2025-03-01 10:15",
        "true_cluster": 0,
    },
    {
        "id": 3,
        "title": "Цены на нефть выросли на мировом рынке",
        "text": "Стоимость нефти увеличилась после публикации данных о снижении запасов.",
        "published_at": "2025-03-01 08:30",
        "true_cluster": 1,
    },
    {
        "id": 4,
        "title": "Нефтяной рынок отреагировал на сокращение добычи",
        "text": "Аналитики связывают рост цен на нефть с ожиданиями снижения добычи.",
        "published_at": "2025-03-01 11:00",
        "true_cluster": 1,
    },
    {
        "id": 5,
        "title": "Футбольный клуб выиграл матч чемпионата",
        "text": "Команда одержала победу со счетом 2:0 и поднялась в турнирной таблице.",
        "published_at": "2025-03-01 12:20",
        "true_cluster": 2,
    },
    {
        "id": 6,
        "title": "Тренер прокомментировал победу команды",
        "text": "Главный тренер отметил уверенную игру футболистов в матче чемпионата.",
        "published_at": "2025-03-01 13:10",
        "true_cluster": 2,
    },
    {
        "id": 7,
        "title": "Правительство обсудило новый законопроект",
        "text": "На заседании рассмотрели изменения в сфере цифрового регулирования.",
        "published_at": "2025-03-02 09:40",
        "true_cluster": 3,
    },
    {
        "id": 8,
        "title": "Депутаты подготовили поправки к законопроекту",
        "text": "Поправки касаются регулирования цифровых сервисов и защиты данных.",
        "published_at": "2025-03-02 11:25",
        "true_cluster": 3,
    },
    {
        "id": 9,
        "title": "Ученые сообщили о новом космическом исследовании",
        "text": "Исследователи получили новые данные о составе атмосферы далекой планеты.",
        "published_at": "2025-03-02 14:00",
        "true_cluster": 4,
    },
    {
        "id": 10,
        "title": "Космическая миссия передала новые научные данные",
        "text": "Полученные результаты помогут изучить свойства планет за пределами Солнечной системы.",
        "published_at": "2025-03-02 16:30",
        "true_cluster": 4,
    },
]


def matrix_to_dense(matrix):
    if hasattr(matrix, "toarray"):
        return matrix.toarray()

    return np.asarray(matrix)


def build_cluster_points(matrix, labels, news):
    dense_matrix = matrix_to_dense(matrix)

    if len(news) == 0:
        return []

    if len(news) == 1:
        coordinates = np.array([[0.0, 0.0]])
    else:
        n_components = min(2, dense_matrix.shape[0], dense_matrix.shape[1])
        reduced = PCA(n_components=n_components, random_state=42).fit_transform(dense_matrix)

        if n_components == 1:
            coordinates = np.column_stack([reduced[:, 0], np.zeros(len(reduced))])
        else:
            coordinates = reduced

    points = []

    for item, label, point in zip(news, labels, coordinates):
        points.append(
            ClusterPoint(
                id=item.id,
                title=item.title,
                cluster=int(label),
                x=float(point[0]),
                y=float(point[1]),
                published_at=item.published_at,
            )
        )

    return points


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/api")
def api_root():
    return {"message": "API системы группировки и кластеризации новостей работает"}


@app.get("/system/device")
def get_device_info():
    gpu_available = torch.cuda.is_available()

    return {
        "gpu_available": gpu_available,
        "device": "cuda" if gpu_available else "cpu",
        "gpu_name": torch.cuda.get_device_name(0) if gpu_available else None,
    }


@app.get("/news/api")
def get_news_from_demo_api(
    limit: int = 5,
    cursor: int = 0,
    from_date: str | None = None,
    to_date: str | None = None,
):
    filtered_news = DEMO_API_NEWS

    if from_date:
        filtered_news = [
            item for item in filtered_news
            if item["published_at"] >= from_date
        ]

    if to_date:
        filtered_news = [
            item for item in filtered_news
            if item["published_at"] <= to_date
        ]

    start = cursor
    end = cursor + limit

    items = filtered_news[start:end]
    next_cursor = end if end < len(filtered_news) else None

    return {
        "items": items,
        "next_cursor": next_cursor,
        "has_more": next_cursor is not None,
        "total": len(filtered_news),
    }


@app.post("/cluster", response_model=ClusterResponse)
def cluster_news(request: ClusterRequest):
    try:
        pipeline = TextPipeline(vectorizer_type=request.vectorizer_type)
        processed_texts, matrix = pipeline.fit_transform(request.news)

        clusterer = NewsClusterer()
        labels = clusterer.cluster(
            matrix=matrix,
            algorithm=request.algorithm,
            n_clusters=request.n_clusters,
            eps=request.eps,
            min_samples=request.min_samples,
        )

        metrics = evaluate_clusters(matrix, labels, request.news)
        cluster_points = build_cluster_points(matrix, labels, request.news)

        items = []
        grouped_clusters = defaultdict(list)

        for item, label, processed in zip(request.news, labels, processed_texts):
            clustered_item = ClusteredNewsItem(
                id=item.id,
                title=item.title,
                text=item.text,
                published_at=item.published_at,
                predicted_cluster=int(label),
                true_cluster=item.true_cluster,
            )

            items.append(clustered_item)

            grouped_clusters[str(label)].append(
                {
                    "id": item.id,
                    "title": item.title,
                    "published_at": item.published_at,
                    "processed_text": processed,
                }
            )

        grouped_clusters_dict = dict(grouped_clusters)

        cluster_topics = build_cluster_topics(grouped_clusters_dict)
        cluster_chronology = build_cluster_chronology(grouped_clusters_dict)

        metrics["cluster_topics"] = cluster_topics
        metrics["cluster_chronology"] = cluster_chronology

        return ClusterResponse(
            algorithm=request.algorithm,
            metrics=metrics,
            items=items,
            grouped_clusters=grouped_clusters_dict,
            cluster_points=cluster_points,
        )

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Внутренняя ошибка: {e}")


@app.get("/news/live")
def get_live_news(
    query: str = "Россия",
    limit: int = 10,
    from_date: str | None = None,
    to_date: str | None = None,
):
    try:
        news = fetch_news(query=query, from_date=from_date, to_date=to_date, limit=limit)
        return {"items": news, "total": len(news)}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))