import { Proxy } from "@/types/proxy";

export const exportProxiesToCSV = (proxies: Proxy[], filename = "proxies.csv"): void => {
  const headers = [
    "ID",
    "Type",
    "Country",
    "Country Code",
    "State",
    "City",
    "IP",
    "Port",
    "Protocol",
    "Status",
    "Bandwidth Used (MB)",
    "Bandwidth Limit (MB)",
    "Success Rate (%)",
    "Error Rate (%)",
    "Avg Latency (ms)",
    "Uptime (%)",
    "Total Requests",
    "Last Checked",
  ];

  const rows = proxies.map((proxy) => [
    proxy.id,
    proxy.type,
    proxy.country,
    proxy.countryCode,
    proxy.state,
    proxy.city,
    proxy.ip,
    proxy.port,
    proxy.protocol,
    proxy.status,
    proxy.bandwidthUsed,
    proxy.bandwidthLimit,
    proxy.successRate,
    proxy.errorRate,
    proxy.avgLatency,
    proxy.uptime,
    proxy.totalRequests,
    proxy.lastChecked,
  ]);

  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      row.map((cell) => {
        const cellStr = String(cell);
        // Escape quotes and wrap in quotes if contains comma
        if (cellStr.includes(",") || cellStr.includes('"') || cellStr.includes("\n")) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportProxiesToJSON = (proxies: Proxy[], filename = "proxies.json"): void => {
  const jsonContent = JSON.stringify(proxies, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportProxiesToTXT = (proxies: Proxy[], filename = "proxies.txt"): void => {
  // One IP:Port per line format
  const txtContent = proxies.map((proxy) => `${proxy.ip}:${proxy.port}`).join("\n");
  const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
