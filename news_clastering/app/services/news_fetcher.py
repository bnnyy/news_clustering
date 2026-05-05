import requests
from datetime import datetime

NEWSAPI_KEY = "ВАШ_API_KEY"

def fetch_news(query: str = "Россия", from_date: str = None, to_date: str = None, limit: int = 10):
    url = "https://newsapi.org/v2/everything"
    params = {
        "q": query,
        "pageSize": limit,
        "apiKey": NEWSAPI_KEY,
    }
    if from_date:
        params["from"] = from_date
    if to_date:
        params["to"] = to_date

    resp = requests.get(url, params=params)
    resp.raise_for_status()
    data = resp.json()
    items = []
    for i, article in enumerate(data.get("articles", [])):
        items.append({
            "id": i + 1,
            "title": article.get("title"),
            "text": article.get("description") or article.get("content") or "",
            "published_at": article.get("publishedAt"),
            "true_cluster": None,
        })
    return items