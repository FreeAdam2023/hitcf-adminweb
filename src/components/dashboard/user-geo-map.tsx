"use client";

import { useState, useEffect, useMemo, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchUserGeo } from "@/lib/api/admin";
import type { GeoCountry } from "@/lib/api/types";
import { Globe, Building2, Flag } from "lucide-react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";

const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Map tracking country names → ISO 3166-1 alpha-3 (what topojson uses)
const COUNTRY_TO_ISO: Record<string, string> = {
  // Common CF headers / Cloudflare country values
  "CN": "CHN", "China": "CHN",
  "CA": "CAN", "Canada": "CAN",
  "US": "USA", "United States": "USA",
  "FR": "FRA", "France": "FRA",
  "JP": "JPN", "Japan": "JPN",
  "KR": "KOR", "South Korea": "KOR",
  "DE": "DEU", "Germany": "DEU",
  "GB": "GBR", "United Kingdom": "GBR",
  "AU": "AUS", "Australia": "AUS",
  "IN": "IND", "India": "IND",
  "BR": "BRA", "Brazil": "BRA",
  "RU": "RUS", "Russia": "RUS",
  "MX": "MEX", "Mexico": "MEX",
  "SG": "SGP", "Singapore": "SGP",
  "HK": "HKG", "Hong Kong": "HKG",
  "TW": "TWN", "Taiwan": "TWN",
  "VN": "VNM", "Vietnam": "VNM",
  "TH": "THA", "Thailand": "THA",
  "MY": "MYS", "Malaysia": "MYS",
  "PH": "PHL", "Philippines": "PHL",
  "ID": "IDN", "Indonesia": "IDN",
  "NZ": "NZL", "New Zealand": "NZL",
  "IT": "ITA", "Italy": "ITA",
  "ES": "ESP", "Spain": "ESP",
  "NL": "NLD", "Netherlands": "NLD",
  "BE": "BEL", "Belgium": "BEL",
  "CH": "CHE", "Switzerland": "CHE",
  "SE": "SWE", "Sweden": "SWE",
  "NO": "NOR", "Norway": "NOR",
  "DK": "DNK", "Denmark": "DNK",
  "FI": "FIN", "Finland": "FIN",
  "PL": "POL", "Poland": "POL",
  "AT": "AUT", "Austria": "AUT",
  "IE": "IRL", "Ireland": "IRL",
  "PT": "PRT", "Portugal": "PRT",
  "AE": "ARE", "United Arab Emirates": "ARE",
  "SA": "SAU", "Saudi Arabia": "SAU",
  "EG": "EGY", "Egypt": "EGY",
  "ZA": "ZAF", "South Africa": "ZAF",
  "NG": "NGA", "Nigeria": "NGA",
  "MA": "MAR", "Morocco": "MAR",
  "DZ": "DZA", "Algeria": "DZA",
  "TN": "TUN", "Tunisia": "TUN",
  "CO": "COL", "Colombia": "COL",
  "AR": "ARG", "Argentina": "ARG",
  "CL": "CHL", "Chile": "CHL",
  "PE": "PER", "Peru": "PER",
};

// ISO alpha-3 → ISO numeric (used by world-atlas@2 topojson)
const ISO_A3_TO_NUM: Record<string, string> = {
  CHN: "156", CAN: "124", USA: "840", FRA: "250", JPN: "392",
  KOR: "410", DEU: "276", GBR: "826", AUS: "036", IND: "356",
  BRA: "076", RUS: "643", MEX: "484", SGP: "702", HKG: "344",
  TWN: "158", VNM: "704", THA: "764", MYS: "458", PHL: "608",
  IDN: "360", NZL: "554", ITA: "380", ESP: "724", NLD: "528",
  BEL: "056", CHE: "756", SWE: "752", NOR: "578", DNK: "208",
  FIN: "246", POL: "616", AUT: "040", IRL: "372", PRT: "620",
  ARE: "784", SAU: "682", EGY: "818", ZAF: "710", NGA: "566",
  MAR: "504", DZA: "012", TUN: "788", COL: "170", ARG: "032",
  CHL: "152", PER: "604",
};

// Country flag emoji from ISO-2
function countryFlag(code: string): string {
  // If it's already a 2-letter code
  const c = code.length === 2 ? code.toUpperCase() : "";
  if (!c) return "";
  const cp1 = c.charCodeAt(0) + 0x1F1A5;
  const cp2 = c.charCodeAt(1) + 0x1F1A5;
  return String.fromCodePoint(cp1, cp2);
}

const COUNTRY_NAMES: Record<string, string> = {
  CN: "中国", CA: "加拿大", US: "美国", FR: "法国", JP: "日本",
  KR: "韩国", DE: "德国", GB: "英国", AU: "澳大利亚", IN: "印度",
  BR: "巴西", SG: "新加坡", HK: "香港", TW: "台湾", VN: "越南",
  TH: "泰国", MY: "马来西亚", RU: "俄罗斯",
};

const MapChart = memo(function MapChart({ countrySet, countryCountMap }: {
  countrySet: Set<string>;
  countryCountMap: Map<string, number>;
}) {
  const maxCount = Math.max(...Array.from(countryCountMap.values()), 1);

  function getFillColor(isoA3: string): string {
    const count = countryCountMap.get(isoA3) || 0;
    if (count === 0) return "#e5e7eb"; // gray-200
    const ratio = count / maxCount;
    if (ratio < 0.3) return "#86efac"; // green-300
    if (ratio < 0.6) return "#22c55e"; // green-500
    return "#15803d"; // green-700
  }

  return (
    <ComposableMap
      projectionConfig={{ scale: 147, center: [10, 10] }}
      className="w-full h-full"
    >
      <ZoomableGroup>
        <Geographies geography={GEO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const geoId = geo.id as string;
              const isHighlighted = countrySet.has(geoId);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isHighlighted ? getFillColor(geoId) : "#f3f4f6"}
                  stroke="#d1d5db"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: {
                      fill: isHighlighted ? "#16a34a" : "#e5e7eb",
                      outline: "none",
                      cursor: isHighlighted ? "pointer" : "default",
                    },
                    pressed: { outline: "none" },
                  }}
                />
              );
            })
          }
        </Geographies>
      </ZoomableGroup>
    </ComposableMap>
  );
});

interface CityItem {
  city: string;
  country: string;
  count: number;
}

export function UserGeoMap() {
  const [data, setData] = useState<GeoCountry[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"country" | "city">("country");

  useEffect(() => {
    fetchUserGeo()
      .then((res) => setData(res.countries))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  // Aggregate cities across all countries, deduped and counted
  const cityList = useMemo<CityItem[]>(() => {
    if (!data) return [];
    const cityMap = new Map<string, CityItem>();
    for (const c of data) {
      for (const u of c.users) {
        if (!u.city) continue;
        const key = `${c.country}:${u.city}`;
        const existing = cityMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          cityMap.set(key, { city: u.city, country: c.country, count: 1 });
        }
      }
    }
    return Array.from(cityMap.values()).sort((a, b) => b.count - a.count);
  }, [data]);

  if (loading) return <Card><CardContent className="py-8"><LoadingSpinner /></CardContent></Card>;
  if (!data || data.length === 0) return null;

  // Build numeric code set and count map (world-atlas@2 uses ISO numeric IDs)
  const countrySet = new Set<string>();
  const countryCountMap = new Map<string, number>();
  for (const c of data) {
    const alpha3 = COUNTRY_TO_ISO[c.country];
    if (alpha3) {
      const num = ISO_A3_TO_NUM[alpha3];
      if (num) {
        countrySet.add(num);
        countryCountMap.set(num, (countryCountMap.get(num) || 0) + c.count);
      }
    }
  }

  const totalUsers = data.reduce((s, c) => s + c.count, 0);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">全球用户分布</CardTitle>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{totalUsers} 位用户来自 {data.length} 个国家/地区</Badge>
          <Globe className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Map */}
        <div className="h-[320px] rounded-lg overflow-hidden bg-[#f8fafc] dark:bg-[#1e293b]">
          <MapChart countrySet={countrySet} countryCountMap={countryCountMap} />
        </div>

        {/* Toggle */}
        <div className="mt-4 flex items-center gap-1">
          <Button
            variant={viewMode === "country" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("country")}
          >
            <Flag className="mr-1 h-3 w-3" />
            按国家
          </Button>
          <Button
            variant={viewMode === "city" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("city")}
          >
            <Building2 className="mr-1 h-3 w-3" />
            按城市
          </Button>
        </div>

        {/* Country view */}
        {viewMode === "country" && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((c) => (
              <div
                key={c.country}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <span className="text-lg leading-none">{countryFlag(c.country)}</span>
                <span className="flex-1 font-medium truncate">
                  {COUNTRY_NAMES[c.country] || c.country}
                </span>
                <Badge variant="secondary" className="shrink-0">{c.count}</Badge>
              </div>
            ))}
          </div>
        )}

        {/* City view */}
        {viewMode === "city" && (
          <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {cityList.map((item) => (
              <div
                key={`${item.country}:${item.city}`}
                className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
              >
                <span className="text-lg leading-none">{countryFlag(item.country)}</span>
                <div className="flex-1 min-w-0">
                  <span className="font-medium">{item.city}</span>
                  <span className="text-xs text-muted-foreground ml-1">
                    {COUNTRY_NAMES[item.country] || item.country}
                  </span>
                </div>
                <Badge variant="secondary" className="shrink-0">{item.count}</Badge>
              </div>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center gap-2 mt-3 text-[10px] text-muted-foreground">
          <span>少</span>
          <div className="w-4 h-3 rounded-sm bg-[#f3f4f6] border" />
          <div className="w-4 h-3 rounded-sm bg-[#86efac]" />
          <div className="w-4 h-3 rounded-sm bg-[#22c55e]" />
          <div className="w-4 h-3 rounded-sm bg-[#15803d]" />
          <span>多</span>
        </div>
      </CardContent>
    </Card>
  );
}
