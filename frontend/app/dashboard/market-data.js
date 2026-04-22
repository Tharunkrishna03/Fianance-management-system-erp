const METALS_DEV_BASE_URL = "https://api.metals.dev/v1";
const GOLD_API_BASE_URL = "https://api.gold-api.com/price";
const CONVERTZ_METALS_URL = "https://convertz.app/api/metals";
const CONVERTZ_CURRENCY_URL = "https://convertz.app/api/currency";
const OPEN_FX_URL = "https://open.er-api.com/v6/latest/USD";
const OPENFACET_INDEX_URL = "https://data.openfacet.net/index.json";
const TROY_OUNCE_TO_GRAMS = 31.1034768;
const HISTORY_DAYS = 7;

const metalDefinitions = [
  {
    slug: "gold",
    label: "Gold",
    metalKey: "gold",
    unitLabel: "INR / gram",
    goldApiSymbol: "XAU",
  },
  {
    slug: "silver",
    label: "Silver",
    metalKey: "silver",
    unitLabel: "INR / gram",
    goldApiSymbol: "XAG",
  },
  {
    slug: "platinum",
    label: "Platinum",
    metalKey: "platinum",
    unitLabel: "INR / gram",
    goldApiSymbol: "XPT",
  },
];

function formatDateAsIso(value) {
  return value.toISOString().slice(0, 10);
}

function getHistoryRange() {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setUTCDate(endDate.getUTCDate() - (HISTORY_DAYS - 1));

  return {
    startDate: formatDateAsIso(startDate),
    endDate: formatDateAsIso(endDate),
  };
}

async function fetchJson(url, init) {
  const response = await fetch(url, init);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

function buildUnavailableMetalItem(definition, reason) {
  return {
    slug: definition.slug,
    label: definition.label,
    status: "unavailable",
    currencyCode: "INR",
    unitLabel: definition.unitLabel,
    price: null,
    changePercent: null,
    updatedAt: null,
    history: [],
    rangeLabel: "Live",
    note: reason,
  };
}

function buildFallbackHistory(currentValue) {
  if (!Number.isFinite(currentValue)) {
    return [];
  }

  const now = new Date();

  return Array.from({ length: 7 }, (_, index) => {
    const pointDate = new Date(now);
    pointDate.setUTCDate(now.getUTCDate() - (6 - index));

    return {
      timestamp: pointDate.toISOString(),
      value: currentValue,
    };
  });
}

function safeNumber(value) {
  return Number.isFinite(value) ? value : null;
}

function toInrPerGram(usdPerToz, usdToInr) {
  if (!Number.isFinite(usdPerToz) || !Number.isFinite(usdToInr)) {
    return null;
  }

  return (usdPerToz * usdToInr) / TROY_OUNCE_TO_GRAMS;
}

function deriveUsdToInrFromMetalsQuote(quote) {
  if (!quote || !quote.currencies || !Number.isFinite(quote.currencies.INR) || quote.currencies.INR === 0) {
    return null;
  }

  return 1 / quote.currencies.INR;
}

function buildHistoryFromTimeseries(timeseries, metalKey) {
  if (!timeseries || !timeseries.rates) {
    return [];
  }

  return Object.values(timeseries.rates)
    .sort((left, right) => String(left.date).localeCompare(String(right.date)))
    .map((entry) => {
      const usdToInr = deriveUsdToInrFromMetalsQuote(entry);
      const value = toInrPerGram(entry?.metals?.[metalKey], usdToInr);

      if (!Number.isFinite(value)) {
        return null;
      }

      return {
        timestamp: `${entry.date}T00:00:00.000Z`,
        value,
      };
    })
    .filter(Boolean);
}

function mergeCurrentPoint(history, timestamp, value) {
  if (!Number.isFinite(value)) {
    return history;
  }

  const nextHistory = [...history];
  const nextPoint = {
    timestamp,
    value,
  };

  const lastPoint = nextHistory[nextHistory.length - 1];

  if (!lastPoint || lastPoint.timestamp !== nextPoint.timestamp) {
    nextHistory.push(nextPoint);
    return nextHistory;
  }

  nextHistory[nextHistory.length - 1] = nextPoint;
  return nextHistory;
}

function buildReadyMetalItem(definition, latest, timeseries) {
  const usdToInr = deriveUsdToInrFromMetalsQuote(latest);
  const price = toInrPerGram(latest?.metals?.[definition.metalKey], usdToInr);
  const updatedAt = latest?.timestamps?.metal ?? new Date().toISOString();
  const seededHistory = buildHistoryFromTimeseries(timeseries, definition.metalKey);
  const history = mergeCurrentPoint(seededHistory, updatedAt, price);
  const previousPoint = history[history.length - 2];
  const changePercent =
    previousPoint && previousPoint.value
      ? ((price - previousPoint.value) / previousPoint.value) * 100
      : null;

  return {
    slug: definition.slug,
    label: definition.label,
    status: "ready",
    currencyCode: "INR",
    unitLabel: definition.unitLabel,
    price: safeNumber(price),
    changePercent: safeNumber(changePercent),
    updatedAt,
    history,
    rangeLabel: "7D",
    note: definition.note,
  };
}

function buildReadyFallbackMetalItem(definition, details) {
  return {
    slug: definition.slug,
    label: definition.label,
    status: "ready",
    currencyCode: details.currencyCode,
    unitLabel: details.unitLabel,
    price: safeNumber(details.price),
    changePercent: null,
    updatedAt: details.updatedAt,
    history: buildFallbackHistory(details.price),
    rangeLabel: "Live",
    note: details.note,
  };
}

async function fetchMetalsBundle() {
  const apiKey = process.env.METALS_DEV_API_KEY;

  if (!apiKey) {
    return null;
  }

  const { startDate, endDate } = getHistoryRange();

  try {
    const [latest, timeseries] = await Promise.all([
      fetchJson(`${METALS_DEV_BASE_URL}/latest?api_key=${apiKey}`, {
        next: { revalidate: 300 },
      }),
      fetchJson(
        `${METALS_DEV_BASE_URL}/timeseries?api_key=${apiKey}&start_date=${startDate}&end_date=${endDate}`,
        {
          next: { revalidate: 3600 },
        },
      ),
    ]);

    return {
      latest,
      timeseries,
      error: null,
    };
  } catch {
    return {
      latest: null,
      timeseries: null,
      error: "Live metal feed is currently unavailable. Check the API key or try again shortly.",
    };
  }
}

async function fetchGoldApiMetalsBundle(usdToInr) {
  try {
    const responses = await Promise.all(
      metalDefinitions.map((definition) =>
        fetchJson(`${GOLD_API_BASE_URL}/${definition.goldApiSymbol}`, {
          next: { revalidate: 300 },
        }),
      ),
    );

    const useInr = Number.isFinite(usdToInr);

    return {
      items: metalDefinitions.map((definition, index) =>
        buildReadyFallbackMetalItem(definition, {
          currencyCode: useInr ? "INR" : "USD",
          unitLabel: useInr ? definition.unitLabel : "USD / troy oz",
          price: useInr
            ? toInrPerGram(responses[index]?.price, usdToInr)
            : safeNumber(responses[index]?.price),
          updatedAt: responses[index]?.updatedAt ?? new Date().toISOString(),
          note: useInr
            ? "Live India estimate from Gold API public metal quotes."
            : "Live public metal quote is available, but INR conversion is unavailable right now, so this slide is showing USD spot.",
        }),
      ),
      error: null,
    };
  } catch {
    return {
      items: null,
      error: "Gold API public metal feed is currently unavailable.",
    };
  }
}

async function fetchConvertzMetalsBundle(usdToInr) {
  try {
    const response = await fetchJson(CONVERTZ_METALS_URL, {
      next: { revalidate: 300 },
    });

    const updatedAt = new Date().toISOString();
    const useInr = Number.isFinite(usdToInr);
    const sourceMap = {
      gold: response?.XAU?.price,
      silver: response?.XAG?.price,
      platinum: response?.XPT?.price,
    };

    return {
      items: metalDefinitions.map((definition) =>
        buildReadyFallbackMetalItem(definition, {
          currencyCode: useInr ? "INR" : "USD",
          unitLabel: useInr ? definition.unitLabel : "USD / troy oz",
          price: useInr
            ? toInrPerGram(sourceMap[definition.metalKey], usdToInr)
            : safeNumber(sourceMap[definition.metalKey]),
          updatedAt,
          note: useInr
            ? "Live India estimate from the public metal feed. Graph will improve as fresh samples arrive."
            : "Public metal feed is live, but INR conversion is unavailable right now, so this slide is showing USD spot.",
        }),
      ),
      error: null,
    };
  } catch {
    return {
      items: null,
      error: "Public metal feed is currently unavailable. Try again shortly.",
    };
  }
}

async function fetchUsdToInr() {
  try {
    const convertzResponse = await fetchJson(CONVERTZ_CURRENCY_URL, {
      next: { revalidate: 3600 },
    });

    const convertzRate = safeNumber(convertzResponse?.rates?.INR);

    if (Number.isFinite(convertzRate)) {
      return convertzRate;
    }
  } catch {}

  try {
    const response = await fetchJson(OPEN_FX_URL, {
      next: { revalidate: 3600 },
    });

    return safeNumber(response?.rates?.INR);
  } catch {
    return null;
  }
}

async function fetchDiamondData() {
  try {
    return await fetchJson(OPENFACET_INDEX_URL, {
      next: { revalidate: 3600 },
    });
  } catch {
    return null;
  }
}

function buildDiamondItem(diamondData, usdToInr) {
  if (!diamondData || !Number.isFinite(diamondData.dcx)) {
    return {
      slug: "diamond",
      label: "Diamond",
      status: "unavailable",
      currencyCode: usdToInr ? "INR" : "USD",
      unitLabel: usdToInr ? "INR / carat" : "USD / carat",
      price: null,
      changePercent: null,
      updatedAt: null,
      history: [],
      rangeLabel: "24H",
      note: "Diamond benchmark data is unavailable right now.",
    };
  }

  const currentValue = usdToInr ? diamondData.dcx * usdToInr : diamondData.dcx;
  const changePercent = Number.isFinite(diamondData.trend) ? diamondData.trend : null;
  const previousValue =
    Number.isFinite(changePercent) && changePercent > -100
      ? currentValue / (1 + changePercent / 100)
      : null;
  const updatedAt = diamondData.ts ?? new Date().toISOString();
  const history = [];

  if (Number.isFinite(previousValue)) {
    const previousTimestamp = new Date(updatedAt);
    previousTimestamp.setUTCDate(previousTimestamp.getUTCDate() - 1);
    history.push({
      timestamp: previousTimestamp.toISOString(),
      value: previousValue,
    });
  }

  history.push({
    timestamp: updatedAt,
    value: currentValue,
  });

  return {
    slug: "diamond",
    label: "Diamond",
    status: "ready",
    currencyCode: usdToInr ? "INR" : "USD",
    unitLabel: usdToInr ? "INR / carat" : "USD / carat",
    price: safeNumber(currentValue),
    changePercent: safeNumber(changePercent),
    updatedAt,
    history,
    rangeLabel: "24H",
    note: "DCX composite benchmark based on OpenFacet's published diamond index snapshot.",
  };
}

export async function getDashboardMarketData() {
  const [metalsBundle, usdToInr, diamondData] = await Promise.all([
    fetchMetalsBundle(),
    fetchUsdToInr(),
    fetchDiamondData(),
  ]);

  let metalItems;
  let metalAttribution = "https://www.metals.dev/";

  if (metalsBundle?.latest && metalsBundle?.timeseries) {
    metalItems = metalDefinitions.map((definition) =>
      buildReadyMetalItem(definition, metalsBundle.latest, metalsBundle.timeseries),
    );
  } else {
    const goldApiBundle = await fetchGoldApiMetalsBundle(usdToInr);

    if (goldApiBundle.items) {
      metalAttribution = "https://gold-api.com/docs";
      metalItems = goldApiBundle.items;
    } else {
      const fallbackBundle = await fetchConvertzMetalsBundle(usdToInr);
      metalAttribution = "https://convertz.app/api-docs";
      metalItems = fallbackBundle.items
        ? fallbackBundle.items
        : metalDefinitions.map((definition) =>
            buildUnavailableMetalItem(
              definition,
              fallbackBundle.error ?? goldApiBundle.error ?? "Metal feeds are currently unavailable.",
            ),
          );
    }
  }

  const diamondItem = buildDiamondItem(diamondData, usdToInr);

  return {
    fetchedAt: new Date().toISOString(),
    attribution: {
      metalsLabel: metalAttribution.includes("gold-api")
        ? "Gold API"
        : metalAttribution.includes("convertz")
          ? "Convertz"
          : "Metals.Dev",
      metals: metalAttribution,
      diamond: "https://openfacet.net/en/api-docs/",
      fx: "https://www.exchangerate-api.com",
    },
    items: [
      metalItems[0],
      metalItems[1],
      diamondItem,
      metalItems[2],
    ],
  };
}
