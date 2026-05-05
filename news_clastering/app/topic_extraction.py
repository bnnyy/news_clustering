from collections import Counter
from typing import Dict, List


def extract_cluster_keywords(cluster_items: List[dict], top_n: int = 7) -> List[str]:
    counter = Counter()

    for item in cluster_items:
        processed_text = item.get("processed_text", "")
        words = [
            word.strip().lower()
            for word in processed_text.split()
            if len(word.strip()) > 2
        ]
        counter.update(words)

    return [word for word, _ in counter.most_common(top_n)]


def generate_cluster_title(keywords: List[str]) -> str:
    keyword_set = set(keywords)

    if keyword_set & {"apple", "iphone", "смартфон", "процессор", "камера"}:
        return "Новости о технологиях и мобильных устройствах"

    if keyword_set & {"нефть", "цена", "рынок", "добыча", "запас"}:
        return "События нефтяного рынка"

    if keyword_set & {"футбол", "матч", "клуб", "команда", "чемпионат", "тренер"}:
        return "Спортивные события"

    if keyword_set & {"закон", "правительство", "депутат", "поправка", "регулирование"}:
        return "Политико-правовая повестка"

    if keyword_set & {"наука", "исследование", "ученый", "космос", "планета", "миссия"}:
        return "Научные и космические исследования"

    if not keywords:
        return "Тематический кластер"

    return "Тема: " + ", ".join(keywords[:3])


def build_cluster_topics(grouped_clusters: Dict[str, List[dict]]) -> Dict[str, dict]:
    topics = {}

    for cluster_id, items in grouped_clusters.items():
        keywords = extract_cluster_keywords(items)
        topics[cluster_id] = {
            "title": generate_cluster_title(keywords),
            "keywords": keywords,
            "size": len(items),
        }

    return topics