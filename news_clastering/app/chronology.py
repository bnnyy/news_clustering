from datetime import datetime
from typing import Dict, List, Optional


def parse_datetime(value: Optional[str]) -> Optional[datetime]:
    if not value:
        return None

    formats = [
        "%Y-%m-%d %H:%M",
        "%Y-%m-%dT%H:%M:%SZ",
        "%Y-%m-%d",
    ]

    for fmt in formats:
        try:
            return datetime.strptime(value, fmt)
        except ValueError:
            continue

    return None


def build_cluster_chronology(grouped_clusters: Dict[str, List[dict]]) -> Dict[str, dict]:
    result = {}

    for cluster_id, items in grouped_clusters.items():
        dates = [
            parse_datetime(item.get("published_at"))
            for item in items
            if item.get("published_at")
        ]
        dates = [date for date in dates if date is not None]

        if not dates:
            result[cluster_id] = {
                "start": None,
                "end": None,
                "duration_hours": None,
                "items_count": len(items),
            }
            continue

        start = min(dates)
        end = max(dates)
        duration_hours = (end - start).total_seconds() / 3600

        result[cluster_id] = {
            "start": start.isoformat(sep=" "),
            "end": end.isoformat(sep=" "),
            "duration_hours": round(duration_hours, 2),
            "items_count": len(items),
        }

    return result