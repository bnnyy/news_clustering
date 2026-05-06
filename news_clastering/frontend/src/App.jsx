import { useEffect, useMemo, useState } from "react";
import {
  Newspaper,
  BrainCircuit,
  BarChart3,
  Database,
  Upload,
  Sparkles,
  Loader2,
  AlertCircle,
  Globe,
  Network,
  FileJson,
  Cpu,
  DollarSign,
  Trophy,
  LineChart,
  WandSparkles,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import {
  ScatterChart, 
  Scatter, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const demoNews = [
  {
    id: 1,
    title: "Apple представила новый iPhone",
    text: "Компания Apple анонсировала новую модель iPhone на ежегодной презентации.",
    published_at: "2025-03-01 09:00",
    true_cluster: 0,
  },
  {
    id: 2,
    title: "На презентации Apple показали новый смартфон",
    text: "Корпорация Apple выпустила новый iPhone с обновленной камерой и процессором.",
    published_at: "2025-03-01 10:30",
    true_cluster: 0,
  },
  {
    id: 3,
    title: "Цены на нефть выросли",
    text: "Мировые цены на нефть показали рост после публикации данных о сокращении запасов.",
    published_at: "2025-03-01 08:20",
    true_cluster: 1,
  },
  {
    id: 4,
    title: "Нефть дорожает на рынке",
    text: "Стоимость нефти увеличилась на фоне ожиданий снижения добычи.",
    published_at: "2025-03-01 11:10",
    true_cluster: 1,
  },
  {
    id: 5,
    title: "Футбольный клуб выиграл матч",
    text: "Команда одержала победу со счетом 2:0 в домашнем матче чемпионата.",
    published_at: "2025-03-01 07:45",
    true_cluster: 2,
  },
  {
    id: 6,
    title: "Победа команды в чемпионате",
    text: "Футбольный клуб успешно завершил матч и набрал важные очки.",
    published_at: "2025-03-01 12:00",
    true_cluster: 2,
  },
];

const chartPalette = ["#0ea5e9", "#6366f1", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6"];

function formatMetric(value, fallback = "—") {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "number") return Number(value).toFixed(4);
  return String(value);
}

function parseNews(text) {
  const blocks = text
    .split(/\n\s*\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  return blocks.map((block, index) => {
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    const title = lines[0] || `Новость ${index + 1}`;
    const body = lines.slice(1).join(" ") || "Текст новости не указан.";

    return {
      id: index + 1,
      title,
      text: body,
      published_at: null,
      true_cluster: null,
    };
  });
}

function categoryMeta(title, text) {
  const source = `${title} ${text}`.toLowerCase();

  if (/apple|iphone|смартфон|ai|технолог|программ|разработ/.test(source)) {
    return { label: "Технологии", icon: Cpu };
  }

  if (/нефть|цены|эконом|рынк|финанс|инвест|банк/.test(source)) {
    return { label: "Экономика", icon: DollarSign };
  }

  if (/футбол|матч|спорт|команд|чемпионат/.test(source)) {
    return { label: "Спорт", icon: Trophy };
  }

  if (/правительство|закон|политик|выборы|государств/.test(source)) {
    return { label: "Политика", icon: Network };
  }

  if (/ученые|исследован|наука|космос|физик/.test(source)) {
    return { label: "Наука", icon: BrainCircuit };
  }

  if (/кино|музыка|культура|фильм|театр/.test(source)) {
    return { label: "Культура", icon: Sparkles };
  }

  return { label: "Прочее", icon: Newspaper };
}

function generateClusterTitle(items) {
  if (!items || !items.length) return "Тематический кластер";

  const stopWords = new Set([
    "это", "как", "что", "для", "при", "под", "над", "или",
    "его", "ее", "они", "она", "так", "также",
    "который", "которая", "которые",
    "быть", "был", "была", "были",
    "после", "между", "через",
    "очень", "среди", "данный", "данная", "данные",
    "этот", "эта", "эти", "новость", "текст", "слово",
    "показать", "составить", "свидетельствовать", "значение",
  ]);

  const counter = {};

  items.forEach((item) => {
    const words = (item.processed_text || "")
      .toLowerCase()
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 2 && !stopWords.has(w));

    words.forEach((word) => {
      counter[word] = (counter[word] || 0) + 1;
    });
  });

  const topWords = Object.entries(counter)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word]) => word);

  const hasAny = (...words) => words.some((word) => topWords.includes(word));

  if (hasAny("apple", "iphone", "смартфон")) return "Новости Apple";
  if (hasAny("нефть", "цена", "рынок", "добыча")) return "Нефтяной рынок";
  if (hasAny("футбольный", "футбол", "матч", "клуб", "чемпионат")) return "Футбольные события";
  if (hasAny("банк", "финансы", "инвестиция", "экономика")) return "Финансовые новости";
  if (hasAny("закон", "правительство", "политика", "государство")) return "Политические события";
  if (hasAny("наука", "исследование", "ученый", "космос")) return "Научные новости";
  if (hasAny("кино", "фильм", "музыка", "театр", "культура")) return "Культурные события";

  const readableWords = topWords.slice(0, 2);
  return readableWords.length ? `Тема: ${readableWords.join(", ")}` : "Тематический кластер";
}

function generateClusterSummary(items) {
  if (!items || !items.length) return "Нет данных для формирования краткого содержания.";

  const text = items
    .map((item) => `${item.title} ${item.processed_text || ""}`)
    .join(" ")
    .toLowerCase();

  if (/apple|iphone|смартфон|процессор|камера/.test(text)) {
    return "Кластер объединяет новости о продуктах Apple, обновлении смартфонов и технологических характеристиках новых устройств.";
  }

  if (/нефть|цена|рынок|добыча|запас/.test(text)) {
    return "Кластер отражает события нефтяного рынка: изменение цен, ожидания по добыче и реакцию рынка на экономические данные.";
  }

  if (/футбол|матч|клуб|команда|чемпионат|тренер/.test(text)) {
    return "Кластер описывает футбольные события: результаты матчей, действия команд и комментарии участников чемпионата.";
  }

  if (/закон|правительство|депутат|поправк|регулирован/.test(text)) {
    return "Кластер объединяет политические и правовые новости, связанные с обсуждением законопроектов и регулированием.";
  }

  if (/наука|исследован|учен|космос|планет|миссия/.test(text)) {
    return "Кластер содержит научные новости, связанные с исследованиями, космическими миссиями и получением новых данных.";
  }

  return "Кластер объединяет схожие по смыслу новости и показывает общий информационный повод внутри группы.";
}

function getClusterTimeline(items) {
  const datedItems = items
    .filter((item) => item.published_at)
    .sort((a, b) => new Date(a.published_at).getTime() - new Date(b.published_at).getTime());

  if (!datedItems.length) {
    return {
      start: "дата не указана",
      end: "дата не указана",
      count: items.length,
    };
  }

  return {
    start: datedItems[0].published_at,
    end: datedItems[datedItems.length - 1].published_at,
    count: items.length,
  };
}

function StatCard({ icon: Icon, title, value, dark = false }) {
  return (
    <div className={`stat-card ${dark ? "dark-card" : ""}`}>
      <div className={`stat-icon ${dark ? "dark-icon" : ""}`}>
        <Icon size={18} />
      </div>
      <div className={`stat-title ${dark ? "dark-text-muted" : ""}`}>{title}</div>
      <div className={`stat-value ${dark ? "dark-text" : ""}`}>{value}</div>
    </div>
  );
}

function NewsIllustration() {
  return (
    <div className="illustration-card">
      <div className="blur-circle blur-a"></div>
      <div className="blur-circle blur-b"></div>

      <div className="illustration-grid">
        <div className="illustration-column">
          {[
            ["Технологии", Cpu],
            ["Экономика", DollarSign],
            ["Спорт", Trophy],
          ].map(([label, Icon]) => (
            <div key={label} className="mini-card">
              <div className="mini-card-title">
                <Icon size={16} />
                <span>{label}</span>
              </div>
              <div className="mini-card-text">Новостные сообщения и похожие сюжеты</div>
            </div>
          ))}
        </div>

        <div className="core-card">
          <div className="core-caption">
            <BrainCircuit size={16} />
            <span>Аналитическое ядро</span>
          </div>
          <div className="core-title">Кластеризация</div>
          <div className="core-subtitle">Векторизация → алгоритм → метрики</div>
        </div>

        <div className="illustration-column">
          {[
            ["Кластер 1", "0.84", "#38bdf8"],
            ["Кластер 2", "0.79", "#22c55e"],
            ["Кластер 3", "0.81", "#f59e0b"],
          ].map(([label, score, color]) => (
            <div key={label} className="mini-card">
              <div className="cluster-mini-header">
                <span>{label}</span>
                <span className="score-badge" style={{ background: color }}>
                  {score}
                </span>
              </div>
              <div className="mini-card-text">Смысловая группа новостей</div>
            </div>
          ))}
        </div>
      </div>

      <svg className="flow-svg" viewBox="0 0 600 320">
        <defs>
          <linearGradient id="flowA" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
        </defs>
        <path d="M80 90 C170 90, 170 90, 250 160" fill="none" stroke="url(#flowA)" strokeWidth="4" strokeOpacity="0.45" strokeLinecap="round" />
        <path d="M80 160 C170 160, 170 160, 250 160" fill="none" stroke="url(#flowA)" strokeWidth="4" strokeOpacity="0.45" strokeLinecap="round" />
        <path d="M80 230 C170 230, 170 230, 250 160" fill="none" stroke="url(#flowA)" strokeWidth="4" strokeOpacity="0.45" strokeLinecap="round" />
        <path d="M330 160 C410 160, 430 120, 515 90" fill="none" stroke="#22c55e" strokeWidth="4" strokeOpacity="0.5" strokeLinecap="round" />
        <path d="M330 160 C410 160, 430 160, 515 160" fill="none" stroke="#f59e0b" strokeWidth="4" strokeOpacity="0.45" strokeLinecap="round" />
        <path d="M330 160 C410 160, 430 200, 515 230" fill="none" stroke="#ef4444" strokeWidth="4" strokeOpacity="0.45" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export default function App() {
  const [apiCursor, setApiCursor] = useState(0);
  const [apiLimit, setApiLimit] = useState(5);
  const [apiFromDate, setApiFromDate] = useState("");
  const [apiToDate, setApiToDate] = useState("");
  const [apiUrl, setApiUrl] = useState("http://127.0.0.1:8000/cluster");
  const [algorithm, setAlgorithm] = useState("kmeans");
  const [vectorizerType, setVectorizerType] = useState("tfidf");
  const [nClusters, setNClusters] = useState("3");
  const [eps, setEps] = useState("0.7");
  const [minSamples, setMinSamples] = useState("2");
  const [newsText, setNewsText] = useState(
    demoNews.map((item) => `${item.title}\n${item.text}`).join("\n\n")
  );
  const [result, setResult] = useState(null);
  const [comparison, setComparison] = useState([]);
  const [uploadedNews, setUploadedNews] = useState(demoNews);
  const [loading, setLoading] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("metrics");
  const [isSchemeOpen, setIsSchemeOpen] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState(null);

  const parsedNewsPreview = useMemo(() => parseNews(newsText), [newsText]);
  useEffect(() => {
  fetch("http://127.0.0.1:8000/system/device")
    .then((response) => response.json())
    .then((data) => setDeviceInfo(data))
    .catch(() => setDeviceInfo(null));
}, []);

  const stats = [
    { title: "Новостей в форме", value: parsedNewsPreview.length, icon: Newspaper },
    { title: "Алгоритм", value: algorithm, icon: Network },
    { title: "Векторизация", value: vectorizerType, icon: BrainCircuit },
    {
      title: "Устройство",
      value: deviceInfo
        ? deviceInfo.gpu_available
          ? "GPU"
          : "CPU"
        : "проверка...",
      icon: Cpu,
    },
  ];

  const clusterPieData = useMemo(() => {
    if (!result?.grouped_clusters) return [];
    return Object.entries(result.grouped_clusters).map(([clusterId, items]) => ({
      name: `Кластер ${clusterId}`,
      value: items.length,
    }));
  }, [result]);

  const metricsBarData = useMemo(() => {
    if (!result?.metrics) return [];

    return [
      { name: "Silhouette", value: result.metrics.silhouette_score ?? 0 },
      { name: "ARI", value: result.metrics.adjusted_rand_index ?? 0 },
      { name: "NMI", value: result.metrics.normalized_mutual_info ?? 0 },
      {
        name: "Davies-Bouldin",
        value: result.metrics.davies_bouldin_index ?? 0,
      },
      {
        name: "Calinski-Harabasz",
        value: result.metrics.calinski_harabasz_index ?? 0,
      },
    ];
  }, [result]);

  const comparisonChartData = useMemo(() => {
    return comparison.map((item) => ({
      name: `${item.algorithm}-${item.vectorizer}`,
      silhouette: item.metrics?.silhouette_score ?? 0,
      ari: item.metrics?.adjusted_rand_index ?? 0,
      nmi: item.metrics?.normalized_mutual_info ?? 0,
    }));
  }, [comparison]);

  const bestMethod = useMemo(() => {
    if (!comparison.length) return null;

    return comparison.reduce((best, current) => {
      if (!best) return current;
      return (current.metrics?.silhouette_score || 0) >
        (best.metrics?.silhouette_score || 0)
        ? current
        : best;
    }, null);
  }, [comparison]);

  const handleLoadDemo = () => {
    setNewsText(demoNews.map((item) => `${item.title}\n${item.text}`).join("\n\n"));
    setUploadedNews(demoNews);
    setApiCursor(0);
    setError("");
  };

  const handleLoadFromApi = async () => {
    try {
      setError("");

      const params = new URLSearchParams({
        limit: String(apiLimit),
        cursor: String(apiCursor),
      });

      if (apiFromDate) params.append("from_date", apiFromDate);
      if (apiToDate) params.append("to_date", apiToDate);

      const response = await fetch(`http://127.0.0.1:8000/news/api?${params}`);

      if (!response.ok) {
        throw new Error("Не удалось загрузить новости из API");
      }

      const data = await response.json();
      const newItems = data.items || [];

      if (!newItems.length) {
        setError("По заданным параметрам новости не найдены.");
        return;
      }

      const mergedNews = [...uploadedNews, ...newItems];
      const uniqueNews = Array.from(
        new Map(mergedNews.map((item) => [item.id, item])).values()
      );

      const formatted = uniqueNews
        .map((item) => `${item.title}\n${item.text}`)
        .join("\n\n");

      setNewsText(formatted);
      setUploadedNews(uniqueNews);

      if (data.next_cursor !== null) {
        setApiCursor(data.next_cursor);
      } else {
        setError("Загружены все доступные новости из API.");
        setApiCursor(0);
      }
    } catch (err) {
      setError(err.message || "Ошибка загрузки из API");
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!Array.isArray(parsed)) {
        throw new Error("Файл должен содержать JSON-массив новостей.");
      }

      const normalized = parsed.map((item, index) => ({
        id: item.id ?? index + 1,
        title: item.title ?? `Новость ${index + 1}`,
        text: item.text ?? "",
        published_at: item.published_at ?? null,
        true_cluster: item.true_cluster ?? null,
      }));

      setNewsText(normalized.map((item) => `${item.title}\n${item.text}`).join("\n\n"));
      setUploadedNews(normalized);
      setError("");
    } catch (err) {
      setError(err.message || "Не удалось загрузить JSON-файл.");
    }
  };

  const buildPayload = (algorithmValue = algorithm, vectorizerValue = vectorizerType) => {
    let news = parseNews(newsText);

    if (uploadedNews.length) {
      news = news.map((item, index) => ({
        ...item,
        published_at: uploadedNews[index]?.published_at ?? null,
        true_cluster: uploadedNews[index]?.true_cluster ?? null,
      }));
    }

    if (news.length < 2) {
      throw new Error("Добавьте как минимум две новости для кластеризации.");
    }

    return {
      news,
      algorithm: algorithmValue,
      vectorizer_type: vectorizerValue,
      n_clusters: Number(nClusters),
      eps: Number(eps),
      min_samples: Number(minSamples),
    };
  };

  const handleCluster = async () => {
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const payload = buildPayload();
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.detail || "Не удалось выполнить кластеризацию.");
      }

      const data = await response.json();
      setResult(data);
      setActiveTab("clusters");
    } catch (err) {
      setError(err.message || "Произошла ошибка.");
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async () => {
    setComparing(true);
    setError("");

    try {
      const combinations = [
        ["kmeans", "tfidf"],
        ["kmeans", "embeddings"],
        ["agglomerative", "tfidf"],
        ["agglomerative", "embeddings"],
        ["dbscan", "tfidf"],
        ["dbscan", "embeddings"],
        ["hdbscan", "tfidf"],
        ["hdbscan", "embeddings"],
      ];

      const results = [];

      for (const [alg, vec] of combinations) {
        const payload = buildPayload(alg, vec);

        const response = await fetch(apiUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || `Ошибка сравнения для ${alg}/${vec}`);
        }

        results.push({
          algorithm: alg,
          vectorizer: vec,
          metrics: data.metrics,
        });
      }

      setComparison(results);
      setActiveTab("comparison");
    } catch (err) {
      setError(err.message || "Не удалось выполнить сравнение.");
    } finally {
      setComparing(false);
    }
  };

  const downloadJsonResults = () => {
    if (!result) return;

    const exportData = {
      generated_at: new Date().toISOString(),
      algorithm,
      vectorizer_type: vectorizerType,
      metrics: result.metrics,
      grouped_clusters: result.grouped_clusters,
      comparison,
      best_method: bestMethod,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "news_clustering_results.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadComparisonCsv = () => {
    if (!comparison.length) return;

    const header = [
      "algorithm",
      "vectorizer",
      "silhouette_score",
      "adjusted_rand_index",
      "normalized_mutual_info",
      "davies_bouldin_index",
      "calinski_harabasz_index",
      "noise_ratio",
    ];

    const rows = comparison.map((item) => [
      item.algorithm,
      item.vectorizer,
      item.metrics?.silhouette_score ?? "",
      item.metrics?.adjusted_rand_index ?? "",
      item.metrics?.normalized_mutual_info ?? "",
      item.metrics?.davies_bouldin_index ?? "",
      item.metrics?.calinski_harabasz_index ?? "",
      item.metrics?.noise_ratio ?? "",
    ]);

    const csvContent = [header, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "comparison_results.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-bg">
      <div className="container">
        <section className="hero-grid">
          <div className="hero-card">
            <div className="badge-row">
              <span className="badge badge-blue">Интеллектуальный анализ новостей</span>
              <span className="badge badge-indigo">Аналитическая панель</span>
            </div>

            <div className="hero-copy">
              <h1>Система группировки и кластеризации новостей</h1>
              <p>
                Визуальная аналитическая панель для загрузки новостей из API,
                анализа хронологии, выбора алгоритмов и оценки качества кластеризации.
              </p>
            </div>

            <div className="stats-grid">
              {stats.map((item) => (
                <StatCard key={item.title} icon={item.icon} title={item.title} value={item.value} />
              ))}
            </div>
          </div>

          <div className="hero-side-card">
            <div className="hero-side-badge">
              <BrainCircuit size={16} />
              <span>Схема работы системы</span>
            </div>

            <h3>Новости → API → векторизация → кластеризация → метрики</h3>

            <p>
              Система получает новости, учитывает дату публикации, группирует похожие материалы
              и формирует тематическое описание кластеров.
            </p>

            <button className="btn btn-primary" onClick={() => setIsSchemeOpen(true)}>
              <Sparkles size={16} />
              <span>Показать схему</span>
            </button>
          </div>
        </section>

        <section className="content-grid">
          <div className="left-column">
            <div className="panel white-panel">
              <div className="panel-header">
                <h2>Параметры обработки</h2>
                <p>Настрой параметры эксперимента, загрузи JSON-файл или получи новости через API.</p>
              </div>

              <div className="form-grid">
                <div className="field field-full">
                  <label>Адрес API кластеризации</label>
                  <input value={apiUrl} onChange={(e) => setApiUrl(e.target.value)} />
                </div>

                <div className="field">
                  <label>Алгоритм кластеризации</label>
                  <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value)}>
                    <option value="kmeans">KMeans</option>
                    <option value="agglomerative">Агломеративная кластеризация</option>
                    <option value="dbscan">DBSCAN</option>
                    <option value="hdbscan">HDBSCAN</option>
                  </select>
                </div>

                <div className="field">
                  <label>Тип векторизации текста</label>
                  <select value={vectorizerType} onChange={(e) => setVectorizerType(e.target.value)}>
                    <option value="tfidf">TF-IDF</option>
                    <option value="embeddings">Sentence Embeddings</option>
                  </select>
                </div>

                <div className="field">
                  <label>Количество кластеров</label>
                  <input type="number" min="2" value={nClusters} onChange={(e) => setNClusters(e.target.value)} />
                </div>

                <div className="field">
                  <label>Параметр eps</label>
                  <input type="number" step="0.1" value={eps} onChange={(e) => setEps(e.target.value)} />
                </div>

                <div className="field">
                  <label>Минимальное число элементов</label>
                  <input type="number" min="1" value={minSamples} onChange={(e) => setMinSamples(e.target.value)} />
                </div>
              </div>

              <div className="section-separator"></div>

              <div className="textarea-header">
                <label>Новости для обработки</label>

                <div className="button-group">
                  <button className="btn btn-secondary" onClick={handleLoadDemo}>
                    <Database size={16} />
                    <span>Демо-данные</span>
                  </button>

                  <label className="btn btn-secondary upload-btn">
                    <Upload size={16} />
                    <span>Загрузить JSON</span>
                    <input type="file" accept="application/json,.json" hidden onChange={handleFileUpload} />
                  </label>
                </div>

                <div className="api-controls">
                  <input
                    type="number"
                    min="1"
                    value={apiLimit}
                    onChange={(e) => setApiLimit(e.target.value)}
                    placeholder="limit"
                  />

                  <input
                    type="date"
                    value={apiFromDate}
                    onChange={(e) => setApiFromDate(e.target.value)}
                  />

                  <input
                    type="date"
                    value={apiToDate}
                    onChange={(e) => setApiToDate(e.target.value)}
                  />

                  <button className="btn btn-secondary" onClick={handleLoadFromApi}>
                    <Globe size={16} />
                    <span>Загрузить из API</span>
                  </button>
                </div>
              </div>

              <textarea
                className="news-textarea"
                value={newsText}
                onChange={(e) => setNewsText(e.target.value)}
                placeholder={"Заголовок новости\nТекст новости\n\nСледующая новость\nТекст следующей новости"}
              />

              {error ? (
                <div className="error-box">
                  <AlertCircle size={18} />
                  <span>{error}</span>
                </div>
              ) : null}

              <div className="action-row">
                <button className="btn btn-primary" onClick={handleCluster} disabled={loading}>
                  {loading ? <Loader2 className="spin" size={16} /> : <Sparkles size={16} />}
                  <span>{loading ? "Выполняется кластеризация..." : "Запустить кластеризацию"}</span>
                </button>

                <button className="btn btn-secondary" onClick={handleCompare} disabled={comparing}>
                  {comparing ? <Loader2 className="spin" size={16} /> : <LineChart size={16} />}
                  <span>{comparing ? "Сравнение..." : "Сравнить методы"}</span>
                </button>
              </div>
            </div>

            <div className="panel white-panel">
              <div className="panel-header">
                <h2>Предпросмотр входных данных</h2>
                <p>Количество новостей: {parsedNewsPreview.length}</p>
              </div>

              <div className="preview-list">
                {parsedNewsPreview.map((item) => {
                  const meta = categoryMeta(item.title, item.text);
                  const Icon = meta.icon;

                  return (
                    <div key={item.id} className="preview-card">
                      <div className="preview-top">
                        <div className="preview-title">{item.title}</div>
                        <div className="preview-tags">
                          <span className="tiny-badge">#{item.id}</span>
                          <span className="tiny-badge dark-badge">
                            <Icon size={13} />
                            <span>{meta.label}</span>
                          </span>
                        </div>
                      </div>

                      {uploadedNews[item.id - 1]?.published_at ? (
                        <div className="preview-date">
                          {uploadedNews[item.id - 1].published_at}
                        </div>
                      ) : null}

                      <div className="preview-text">{item.text}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="right-column">
            <div className="panel dark-panel">
              <div className="panel-header dark-header">
                <h2>Аналитическая панель</h2>
                <p>Кластеры, хронология, метрики и сравнение алгоритмов.</p>
              </div>

              <div className="tabs">
                <button className={`tab-btn ${activeTab === "data" ? "active" : ""}`} onClick={() => setActiveTab("data")}>
                  Данные
                </button>
                <button className={`tab-btn ${activeTab === "clusters" ? "active" : ""}`} onClick={() => setActiveTab("clusters")}>
                  Кластеры
                </button>
                <button className={`tab-btn ${activeTab === "metrics" ? "active" : ""}`} onClick={() => setActiveTab("metrics")}>
                  Метрики
                </button>
                <button className={`tab-btn ${activeTab === "comparison" ? "active" : ""}`} onClick={() => setActiveTab("comparison")}>
                  Сравнение
                </button>
              </div>

              {activeTab === "data" && (
                <div className="tab-content">
                  <div className="stats-grid">
                    <StatCard icon={Network} title="Алгоритм" value={algorithm} dark />
                    <StatCard icon={BrainCircuit} title="Векторизация" value={vectorizerType} dark />
                    <StatCard icon={Newspaper} title="Новостей" value={parsedNewsPreview.length} dark />
                    <StatCard icon={FileJson} title="Источник" value="JSON / ручной ввод / API" dark />
                  </div>
                </div>
              )}

              {activeTab === "clusters" && (
                <div className="tab-content">
                  {!result ? (
                    <div className="empty-dark">Сначала запусти кластеризацию.</div>
                  ) : (
                    <>
                      <div className="chart-box light-chart-box">
                        <ResponsiveContainer width="100%" height={280}>
                          <PieChart>
                            <Pie data={clusterPieData} dataKey="value" nameKey="name" outerRadius={95} label>
                              {clusterPieData.map((entry, index) => (
                                <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="cluster-list">
                        {Object.entries(result.grouped_clusters || {}).map(([clusterId, items]) => {
                          const sortedItems = [...items].sort((a, b) => {
                            const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
                            const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
                            return dateA - dateB;
                          });

                          const topic = result?.metrics?.cluster_topics?.[clusterId];
                          const chronology = result?.metrics?.cluster_chronology?.[clusterId];
                          const timeline = getClusterTimeline(sortedItems);

                          return (
                            <div key={clusterId} className="cluster-card">
                              <div className="cluster-header">
                                <div className="cluster-title">
                                  <Network size={18} />
                                  <div className="cluster-title-text">
                                    <span className="cluster-title-main">
                                      {topic?.title || generateClusterTitle(items)}
                                    </span>
                                    <span className="cluster-title-sub">
                                      {" · "}Кластер {clusterId}
                                    </span>
                                  </div>
                                </div>

                                <span className="tiny-badge dark-outline">
                                  {items.length} новостей
                                </span>
                              </div>

                              {topic?.keywords?.length > 0 && (
                                <div className="cluster-keywords">
                                  {topic.keywords.map((word) => (
                                    <span key={word} className="keyword-badge">
                                      {word}
                                    </span>
                                  ))}
                                </div>
                              )}

                              <div className="cluster-summary">
                                <strong>Краткое содержание:</strong> {generateClusterSummary(items)}
                              </div>

                              <div className="cluster-timeline-box">
                                <div className="cluster-timeline-title">
                                  <Clock3 size={16} />
                                  <span>Хронология публикаций</span>
                                </div>

                                {chronology ? (
                                  <>
                                    <div className="cluster-timeline-range">
                                      {chronology.start || "дата не указана"} → {chronology.end || "дата не указана"}
                                    </div>
                                    <div className="cluster-timeline-note">
                                      Длительность информационного повода:{" "}
                                      {chronology.duration_hours !== null && chronology.duration_hours !== undefined
                                        ? `${chronology.duration_hours} ч.`
                                        : "не указана"}
                                    </div>
                                  </>
                                ) : (
                                  <>
                                    <div className="cluster-timeline-range">
                                      {timeline.start} → {timeline.end}
                                    </div>
                                    <div className="cluster-timeline-note">
                                      Новости внутри кластера отсортированы по времени публикации.
                                    </div>
                                  </>
                                )}
                              </div>

                              <div className="cluster-items">
                                {sortedItems.map((item) => (
                                  <div key={item.id} className="cluster-item">
                                    <div className="cluster-item-title">{item.title}</div>
                                    <div className="cluster-item-meta">
                                      ID: {item.id}
                                      {item.published_at ? ` · ${item.published_at}` : ""}
                                    </div>
                                    <div className="cluster-item-text">
                                      <strong>Предобработанный текст:</strong> {item.processed_text}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === "metrics" && (
                <div className="tab-content">
                  {!result ? (
                    <div className="empty-dark">Сначала запусти кластеризацию.</div>
                  ) : (
                    <>
                      <div className="stats-grid">
                        <StatCard
                          icon={BarChart3}
                          title="Silhouette"
                          value={formatMetric(result.metrics?.silhouette_score)}
                          dark
                        />

                        <StatCard
                          icon={Sparkles}
                          title="ARI"
                          value={formatMetric(result.metrics?.adjusted_rand_index, "нет разметки")}
                          dark
                        />

                        <StatCard
                          icon={BrainCircuit}
                          title="NMI"
                          value={formatMetric(result.metrics?.normalized_mutual_info, "нет разметки")}
                          dark
                        />

                        <StatCard
                          icon={WandSparkles}
                          title="Шумовые точки"
                          value={result.metrics?.noise_points ?? "—"}
                          dark
                        />

                        <StatCard
                          icon={BarChart3}
                          title="Davies-Bouldin"
                          value={formatMetric(result.metrics?.davies_bouldin_index)}
                          dark
                        />

                        <StatCard
                          icon={LineChart}
                          title="Calinski-Harabasz"
                          value={formatMetric(result.metrics?.calinski_harabasz_index)}
                          dark
                        />

                        <StatCard
                          icon={AlertCircle}
                          title="Доля шума"
                          value={
                            result.metrics?.noise_ratio !== undefined
                              ? `${(result.metrics.noise_ratio * 100).toFixed(1)}%`
                              : "—"
                          }
                          dark
                        />

                        <StatCard
                          icon={Database}
                          title="Средний размер кластера"
                          value={formatMetric(result.metrics?.avg_cluster_size)}
                          dark
                        />
                      </div>

                      <div className="chart-box light-chart-box">
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart data={metricsBarData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis domain={[0, 1]} />
                            <Tooltip />
                            <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                              {metricsBarData.map((entry, index) => (
                                <Cell key={entry.name} fill={chartPalette[index % chartPalette.length]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === "comparison" && (
                <div className="tab-content">
                  {!comparison.length ? (
                    <div className="empty-dark">Нажми «Сравнить методы», чтобы увидеть результаты всех комбинаций.</div>
                  ) : (
                    <>
                      {bestMethod && (
                        <div className="best-method">
                          <CheckCircle2 size={18} />
                          <div>
                            <strong>Лучший алгоритм:</strong>{" "}
                            {bestMethod.algorithm} + {bestMethod.vectorizer}
                            <div className="best-score">
                              Silhouette: {formatMetric(bestMethod.metrics?.silhouette_score)}
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="chart-box light-chart-box">
                        <ResponsiveContainer width="100%" height={340}>
                          <BarChart data={comparisonChartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-12} textAnchor="end" height={70} />
                            <YAxis domain={[0, 1]} />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="silhouette" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="ari" fill="#6366f1" radius={[8, 8, 0, 0]} />
                            <Bar dataKey="nmi" fill="#14b8a6" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="export-row">
                        <button className="btn btn-secondary" onClick={downloadJsonResults}>
                          <FileJson size={16} />
                          <span>Скачать JSON</span>
                        </button>

                        <button className="btn btn-secondary" onClick={downloadComparisonCsv}>
                          <LineChart size={16} />
                          <span>Скачать CSV</span>
                        </button>
                      </div>

                      <div className="comparison-list">
                        {comparison.map((item, index) => (
                          <div key={`${item.algorithm}-${item.vectorizer}`} className="comparison-card">
                            <div className="comparison-header">
                              <span>{index + 1}. {item.algorithm} + {item.vectorizer}</span>
                              <span className="tiny-badge dark-outline">Сравнение</span>
                            </div>

                            <div className="comparison-metrics">
                              <div>Silhouette: {formatMetric(item.metrics?.silhouette_score, "не вычисляется")}</div>
                              <div>ARI: {formatMetric(item.metrics?.adjusted_rand_index, "нет разметки")}</div>
                              <div>NMI: {formatMetric(item.metrics?.normalized_mutual_info, "нет разметки")}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {isSchemeOpen && (
        <div className="scheme-modal-overlay" onClick={() => setIsSchemeOpen(false)}>
          <div className="scheme-modal" onClick={(e) => e.stopPropagation()}>
            <div className="scheme-modal-header">
              <div>
                <h3>Схема работы системы</h3>
                <p>Обработка новостей от входных данных до итоговых кластеров и метрик качества.</p>
              </div>
              <button className="scheme-close-btn" onClick={() => setIsSchemeOpen(false)}>
                ✕
              </button>
            </div>

            <NewsIllustration />
          </div>
        </div>
      )}
    </div>
  );
}