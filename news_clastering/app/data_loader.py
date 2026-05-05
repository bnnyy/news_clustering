import json
from pathlib import Path
from typing import List
from app.schemas import NewsItem


class DataLoader:
    @staticmethod
    def load_json(path: str) -> List[NewsItem]:
        file_path = Path(path)
        with file_path.open("r", encoding="utf-8") as f:
            raw_data = json.load(f)
        return [NewsItem(**item) for item in raw_data]