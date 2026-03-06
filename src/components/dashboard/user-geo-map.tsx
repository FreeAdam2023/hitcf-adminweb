"use client";

import { useState, useEffect, memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/shared/loading-spinner";
import { fetchUserGeo } from "@/lib/api/admin";
import type { GeoCountry } from "@/lib/api/types";
import { Globe } from "lucide-react";
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
              const isoA3 = geo.properties?.["ISO_A3"] || geo.id;
              const isHighlighted = countrySet.has(isoA3);
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={isHighlighted ? getFillColor(isoA3) : "#f3f4f6"}
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

export function UserGeoMap() {
  const [data, setData] = useState<GeoCountry[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserGeo()
      .then((res) => setData(res.countries))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Card><CardContent className="py-8"><LoadingSpinner /></CardContent></Card>;
  if (!data || data.length === 0) return null;

  // Build ISO-A3 set and count map
  const countrySet = new Set<string>();
  const countryCountMap = new Map<string, number>();
  for (const c of data) {
    const iso = COUNTRY_TO_ISO[c.country];
    if (iso) {
      countrySet.add(iso);
      countryCountMap.set(iso, (countryCountMap.get(iso) || 0) + c.count);
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

        {/* Country list */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((c) => (
            <div
              key={c.country}
              className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"
            >
              <span className="text-lg leading-none">{countryFlag(c.country)}</span>
              <div className="flex-1 min-w-0">
                <span className="font-medium">
                  {COUNTRY_NAMES[c.country] || c.country}
                </span>
                {c.users.length > 0 && c.users[0].city && (
                  <span className="text-xs text-muted-foreground ml-1">
                    ({c.users.map((u) => u.city).filter(Boolean).join(", ")})
                  </span>
                )}
              </div>
              <Badge variant="secondary" className="shrink-0">{c.count}</Badge>
            </div>
          ))}
        </div>

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
