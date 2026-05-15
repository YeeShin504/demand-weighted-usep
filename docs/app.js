const modeSelect = document.getElementById("mode-select");
const candleMetricGroup = document.getElementById("candle-metric-group");
const candleMetricSelect = document.getElementById("candle-metric-select");
const statusEl = document.getElementById("status");
const lastUpdatedEl = document.getElementById("last-updated");
const plotEl = document.getElementById("plot");

let allRows = [];
let latestUpdateIso = null;

function setStatus(message) {
  if (!statusEl) return;
  statusEl.textContent = message;
}

function setLastUpdated(isoString) {
  const repoUrl = "https://github.com/YeeShin504/demand-weighted-usep";
  const sourceUrl = "https://www.nems.emcsg.com/nems-prices";

  const timestamp = new Date(isoString);

  const formattedTime =
    isoString && !Number.isNaN(timestamp.getTime())
      ? timestamp.toLocaleString("en-SG", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
          timeZone: "Asia/Singapore",
        })
      : "unavailable";

  lastUpdatedEl.innerHTML = `
    <div>
      <strong>Last updated:</strong> ${formattedTime} SGT

      <span style="margin-left: 12px;">
        <strong>Sources:</strong>

        <a href="${sourceUrl}" target="_blank" rel="noopener noreferrer">
          NEMS Data Portal
        </a>

        <span style="margin: 0 8px;">|</span>

        <a href="${repoUrl}" target="_blank" rel="noopener noreferrer">
          GitHub Repository
        </a>
      </span>
    </div>
  `;
}

async function loadData() {
  if (window.location.protocol === "file:") {
    throw new Error("Open the app via an HTTP server (for example: cd docs && python -m http.server 8000)");
  }

  const manifestCandidates = ["data/manifest.json", "docs/data/manifest.json"];
  let manifestResp = null;
  let manifestPath = null;
  for (const candidate of manifestCandidates) {
    const resp = await fetch(candidate);
    if (resp.ok) {
      manifestResp = resp;
      manifestPath = candidate;
      break;
    }
  }
  if (!manifestResp || !manifestPath) {
    throw new Error("Cannot load manifest from data/manifest.json or docs/data/manifest.json");
  }

  const manifest = await manifestResp.json();
  const basePath = manifestPath.replace(/manifest\.json$/, "");

  const fileLoads = (manifest.files || []).map(async (fileName) => {
    const resp = await fetch(`${basePath}${fileName}`);
    if (!resp.ok) {
      throw new Error(`Cannot load ${fileName}: ${resp.status}`);
    }
    const rows = await resp.json();
    const year = Number(fileName.slice(0, 4));
    return rows.map((r) => ({ ...r, year }));
  });

  const nested = await Promise.all(fileLoads);
  allRows = nested.flat().sort((a, b) => a.date.localeCompare(b.date));

  latestUpdateIso = allRows
    .map((row) => row.last_updated)
    .filter((value) => typeof value === "string" && value.trim().length > 0)
    .sort()
    .at(-1) || null;
}

function computeMonthlyOHLC() {
  // Group by year-month, compute OHLC for each metric
  const monthMap = new Map();

  allRows.forEach((row) => {
    const date = new Date(row.date + "T00:00:00Z");
    const yearMonth = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;

    if (!monthMap.has(yearMonth)) {
      monthMap.set(yearMonth, []);
    }
    monthMap.get(yearMonth).push(row);
  });

  const ohlc = [];
  const sortedMonths = Array.from(monthMap.keys()).sort();

  sortedMonths.forEach((yearMonth) => {
    const rows = monthMap.get(yearMonth);
    const usepValues = rows.map((r) => r.usep).filter((v) => v !== null && v !== undefined);
    const rusepValues = rows.map((r) => r.rusep).filter((v) => v !== null && v !== undefined);

    const usepO = usepValues[0] || null;
    const usepH = usepValues.length > 0 ? Math.max(...usepValues) : null;
    const usepL = usepValues.length > 0 ? Math.min(...usepValues) : null;
    const usepC = usepValues[usepValues.length - 1] || null;

    const rusepO = rusepValues[0] || null;
    const rusepH = rusepValues.length > 0 ? Math.max(...rusepValues) : null;
    const rusepL = rusepValues.length > 0 ? Math.min(...rusepValues) : null;
    const rusepC = rusepValues[rusepValues.length - 1] || null;

    ohlc.push({
      yearMonth,
      date: rows[0].date,
      usep: { o: usepO, h: usepH, l: usepL, c: usepC },
      rusep: { o: rusepO, h: rusepH, l: rusepL, c: rusepC },
    });
  });

  return ohlc;
}

function createDailyTraces() {
  const diffSeries = allRows.map((r) => {
    if (r.usep === null || r.usep === undefined || r.rusep === null || r.rusep === undefined) {
      return null;
    }
    return Number(r.rusep) - Number(r.usep);
  });

  const usepTrace = {
    x: allRows.map((r) => r.date),
    y: allRows.map((r) => r.usep),
    type: "scatter",
    mode: "lines",
    name: "USEP",
    line: { color: "#1f6feb", width: 1.5 },
    hovertemplate: "USEP: %{y:.2f}<extra></extra>",
  };

  const rusepTrace = {
    x: allRows.map((r) => r.date),
    y: allRows.map((r) => r.rusep),
    type: "scatter",
    mode: "lines",
    name: "RUSEP",
    line: { color: "#e16a00", width: 1.5 },
    hovertemplate: "RUSEP: %{y:.2f}<extra></extra>",
  };

  const diffTrace = {
    x: allRows.map((r) => r.date),
    y: diffSeries,
    type: "scatter",
    mode: "lines",
    name: "RUSEP - USEP",
    line: { color: "#6e7781", width: 1.25, dash: "dot" },
    hovertemplate: "RUSEP - USEP: %{y:.2f}<extra></extra>",
  };

  return [usepTrace, rusepTrace, diffTrace];
}

function createCandleTraces() {
  const ohlc = computeMonthlyOHLC();
  const metric = candleMetricSelect.value;
  const metricName = metric.toUpperCase();

  return [
    {
      x: ohlc.map((d) => d.date),
      open: ohlc.map((d) => d[metric].o),
      high: ohlc.map((d) => d[metric].h),
      low: ohlc.map((d) => d[metric].l),
      close: ohlc.map((d) => d[metric].c),
      type: "candlestick",
      name: metricName,
      increasing: { line: { color: "#2ca02c" } },
      decreasing: { line: { color: "#d62728" } },
      hovertemplate:
        "Date: %{x|%Y-%m-%d}<br>Open: %{open:.2f}<br>High: %{high:.2f}<br>Low: %{low:.2f}<br>Close: %{close:.2f}<extra></extra>",
    },
  ];
}

function syncControlVisibility() {
  const isCandlestick = modeSelect.value === "candlestick";
  candleMetricGroup.classList.toggle("is-hidden", !isCandlestick);
}

function draw() {
  const mode = modeSelect.value;
  syncControlVisibility();
  setLastUpdated(latestUpdateIso);

  if (allRows.length === 0) {
    Plotly.newPlot(plotEl, [], {
      title: "No data loaded",
      xaxis: { title: "Date" },
      yaxis: { title: "Price ($/MWh)" },
    });
    setStatus("No data available.");
    return;
  }

  const traces = mode === "daily" ? createDailyTraces() : createCandleTraces();
  const metricLabel = candleMetricSelect.value.toUpperCase();

  const layout = {
    title: mode === "daily" ? "USEP / RUSEP - Daily" : `${metricLabel} - Monthly Candlestick`,
    margin: { t: 50, r: 20, b: 60, l: 80 },
    xaxis: {
      title: "Date",
      type: "date",
      hoverformat: "%Y-%m-%d",
      rangeslider: mode === "daily" ? { visible: true } : { visible: false },
    },
    yaxis: {
      title: { text: "Price ($/MWh)", standoff: 20 },
      fixedrange: false,
      tickformat: ".2f",
      automargin: true,
    },
    hovermode: mode === "daily" ? "x unified" : "x",
    legend: { x: 0, y: 1 },
  };

  const config = {
    responsive: true,
    displaylogo: false,
    modeBarButtonsToRemove: ["lasso2d", "select2d"],
  };

  Plotly.newPlot(plotEl, traces, layout, config);

  const first = allRows[0]?.date;
  const last = allRows[allRows.length - 1]?.date;
  setStatus(
    `${mode === "daily" ? "Daily lines (USEP, RUSEP, RUSEP - USEP)" : `${metricLabel} monthly candlestick`} | ${allRows.length} points | range ${first} to ${last}`
  );
}

async function init() {
  try {
    setStatus("Loading data...");
    await loadData();

    modeSelect.addEventListener("change", draw);
    candleMetricSelect.addEventListener("change", draw);
    draw();
  } catch (error) {
    console.error(error);
    setStatus(`Failed to load plot: ${error.message}`);
  }
}

init();
