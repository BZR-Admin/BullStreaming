import { supabase } from "./supabase.js";

/* ─────────────────────────────────────────
   ESTADO
───────────────────────────────────────── */
let ventas = [];
let chartInstance = null;
let modoActual = "7d";

/* ─────────────────────────────────────────
   INIT
───────────────────────────────────────── */
window.addEventListener("DOMContentLoaded", async () => {
  const { data, error } = await supabase.from("ventas").select("*");
  if (error) { console.error("Supabase error:", error); return; }
  ventas = data || [];

  renderKPIs();
  renderTopPlataformas();
  renderChart(modoActual);
});

/* ─────────────────────────────────────────
   HELPER DE FECHA — maneja 3 formatos:
   1. String ISO  "2026-04-15"  → directo
   2. Serial Excel 46160        → convierte
   3. null / undefined          → ""
───────────────────────────────────────── */
function fechaToYMD(valor) {
  if (!valor && valor !== 0) return "";

  // Formato ISO o similar: "2026-04-15" / "2026-04-15T00:00:00"
  if (typeof valor === "string" && /^\d{4}-\d{2}-\d{2}/.test(valor)) {
    return valor.slice(0, 10);
  }

  // Serial numérico de Excel (número > 1000 para distinguirlo de días inválidos)
  const n = parseFloat(valor);
  if (!isNaN(n) && n > 1000) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const date = new Date(excelEpoch.getTime() + n * 86400000);
    if (!isNaN(date.getTime())) return date.toISOString().slice(0, 10);
  }

  return "";
}

function todayYMD() {
  return new Date().toISOString().slice(0, 10);
}

function firstDayOfMonthYMD() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

/* ─────────────────────────────────────────
   KPIs
───────────────────────────────────────── */
function renderKPIs() {
  const today = todayYMD();
  const firstOfMonth = firstDayOfMonthYMD();

  // 1. Total ventas activas
  document.getElementById("kpiVentas").textContent = ventas.length;

  // 2. Clientes únicos
  const clientesUnicos = new Set(ventas.map(v => v.id_cliente)).size;
  document.getElementById("kpiClientes").textContent = clientesUnicos;

  // 3. Ventas hoy
  const hoy = ventas.filter(v => fechaToYMD(v.fecha_registro) === today).length;
  document.getElementById("kpiHoy").textContent = hoy;

  // 4. Ganancia del mes
  const gananciaMes = ventas
    .filter(v => fechaToYMD(v.fecha_registro) >= firstOfMonth)
    .reduce((acc, v) => acc + (parseFloat(v.ganancia) || 0), 0);
  document.getElementById("kpiGananciaMes").textContent = "$" + gananciaMes.toFixed(2);

  // 5. Ganancia de hoy
  const gananciaHoy = ventas
    .filter(v => fechaToYMD(v.fecha_registro) === today)
    .reduce((acc, v) => acc + (parseFloat(v.ganancia) || 0), 0);
  document.getElementById("kpiGananciaHoy").textContent = "$" + gananciaHoy.toFixed(2);
}

/* ─────────────────────────────────────────
   TOP PLATAFORMAS
───────────────────────────────────────── */
function renderTopPlataformas() {
  const conteo = {};
  ventas.forEach(v => {
    const p = (v.plataforma || "Sin nombre").trim();
    conteo[p] = (conteo[p] || 0) + 1;
  });

  const top3 = Object.entries(conteo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const maxVal = top3[0]?.[1] || 1;
  const ranks = ["gold", "silver", "bronze"];
  const medals = ["🥇", "🥈", "🥉"];

  document.getElementById("topPlataformas").innerHTML = top3.map(([nombre, count], i) => `
    <div class="platform-row">
      <span class="platform-rank ${ranks[i]}">${medals[i]}</span>
      <span class="platform-name">${nombre}</span>
      <div class="platform-bar-wrap">
        <div class="platform-bar" style="width:${Math.round((count / maxVal) * 100)}%"></div>
      </div>
      <span class="platform-count">${count}</span>
    </div>
  `).join("");
}

/* ─────────────────────────────────────────
   GRÁFICO
───────────────────────────────────────── */
window.setChart = (modo) => {
  modoActual = modo;
  document.getElementById("btn7d").classList.toggle("active", modo === "7d");
  document.getElementById("btnMes").classList.toggle("active", modo === "mes");
  renderChart(modo);
};

function renderChart(modo) {
  const { labels, datos } = modo === "7d" ? getData7Dias() : getDataMeses();

  if (chartInstance) chartInstance.destroy();

  const ctx = document.getElementById("chartVentas").getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 200);
  gradient.addColorStop(0, "rgba(0,198,255,0.35)");
  gradient.addColorStop(1, "rgba(0,198,255,0)");

  chartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Ventas",
        data: datos,
        borderColor: "#00c6ff",
        borderWidth: 2.5,
        backgroundColor: gradient,
        pointBackgroundColor: "#00c6ff",
        pointRadius: 4,
        pointHoverRadius: 6,
        fill: true,
        tension: 0.4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "rgba(10,12,25,0.92)",
          borderColor: "rgba(0,198,255,0.4)",
          borderWidth: 1,
          titleColor: "#00c6ff",
          bodyColor: "rgba(255,255,255,0.8)",
          padding: 10,
          callbacks: {
            label: c => ` ${c.parsed.y} venta${c.parsed.y !== 1 ? "s" : ""}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: { color: "rgba(255,255,255,0.45)", font: { size: 11, weight: "600" }, maxRotation: 0 }
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: { color: "rgba(255,255,255,0.45)", font: { size: 11 }, stepSize: 1, precision: 0 }
        }
      }
    }
  });
}

function getData7Dias() {
  const labels = [], datos = [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() - i);
    const ymd = d.toISOString().slice(0, 10);
    labels.push(d.toLocaleDateString("es", { weekday: "short", day: "numeric" }));
    datos.push(ventas.filter(v => fechaToYMD(v.fecha_registro) === ymd).length);
  }
  return { labels, datos };
}

function getDataMeses() {
  const labels = [], datos = [];
  const hoy = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const prefix = d.toISOString().slice(0, 7); // "YYYY-MM"
    labels.push(d.toLocaleDateString("es", { month: "short", year: "2-digit" }));
    datos.push(ventas.filter(v => {
      const ymd = fechaToYMD(v.fecha_registro);
      return ymd && ymd.startsWith(prefix);
    }).length);
  }
  return { labels, datos };
}
