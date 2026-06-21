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
  const { data } = await supabase.from("ventas").select("*");
  ventas = data || [];

  renderKPIs();
  renderTopPlataformas();
  renderChart(modoActual);
});

/* ─────────────────────────────────────────
   HELPERS DE FECHA
   Las fechas en Supabase vienen como número
   serial de Excel (días desde 1900-01-00).
   Convertimos a Date de JS.
───────────────────────────────────────── */
function serialToDate(serial) {
  if (!serial) return null;
  // Excel erróneamente incluye 1900 como bisiesto; ajustamos
  const MS_PER_DAY = 86400000;
  const excelEpoch = new Date(Date.UTC(1899, 11, 30));
  return new Date(excelEpoch.getTime() + serial * MS_PER_DAY);
}

function toYMD(date) {
  if (!date) return "";
  return date.toISOString().slice(0, 10); // "YYYY-MM-DD"
}

function todayYMD() {
  return toYMD(new Date());
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

  // 2. Clientes únicos (sin repetir id_cliente)
  const clientesUnicos = new Set(ventas.map(v => v.id_cliente)).size;
  document.getElementById("kpiClientes").textContent = clientesUnicos;

  // 3. Ventas registradas hoy
  const hoy = ventas.filter(v => toYMD(serialToDate(v.fecha_registro)) === today).length;
  document.getElementById("kpiHoy").textContent = hoy;

  // 4. Ganancia del mes (desde el día 1 del mes actual)
  const gananciaMes = ventas
    .filter(v => toYMD(serialToDate(v.fecha_registro)) >= firstOfMonth)
    .reduce((acc, v) => acc + (parseFloat(v.ganancia) || 0), 0);
  document.getElementById("kpiGananciaMes").textContent =
    "$" + gananciaMes.toFixed(2);

  // 5. Ganancia de hoy
  const gananciaHoy = ventas
    .filter(v => toYMD(serialToDate(v.fecha_registro)) === today)
    .reduce((acc, v) => acc + (parseFloat(v.ganancia) || 0), 0);
  document.getElementById("kpiGananciaHoy").textContent =
    "$" + gananciaHoy.toFixed(2);
}

/* ─────────────────────────────────────────
   TOP PLATAFORMAS
───────────────────────────────────────── */
function renderTopPlataformas() {
  // Conteo por plataforma
  const conteo = {};
  ventas.forEach(v => {
    const p = (v.plataforma || "Sin nombre").trim();
    conteo[p] = (conteo[p] || 0) + 1;
  });

  // Ordenar y tomar top 3
  const top3 = Object.entries(conteo)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const maxVal = top3[0]?.[1] || 1;
  const ranks = ["gold", "silver", "bronze"];
  const medals = ["🥇", "🥈", "🥉"];

  const container = document.getElementById("topPlataformas");
  container.innerHTML = top3.map(([nombre, count], i) => `
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

  // Gradiente de relleno
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
            label: ctx => ` ${ctx.parsed.y} venta${ctx.parsed.y !== 1 ? "s" : ""}`
          }
        }
      },
      scales: {
        x: {
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: {
            color: "rgba(255,255,255,0.45)",
            font: { size: 11, weight: "600" },
            maxRotation: 0,
          }
        },
        y: {
          beginAtZero: true,
          grid: { color: "rgba(255,255,255,0.05)" },
          ticks: {
            color: "rgba(255,255,255,0.45)",
            font: { size: 11 },
            stepSize: 1,
            precision: 0,
          }
        }
      }
    }
  });
}

/* Últimos 7 días */
function getData7Dias() {
  const dias = [];
  const counts = [];
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(hoy);
    d.setDate(hoy.getDate() - i);
    const ymd = toYMD(d);

    const label = d.toLocaleDateString("es", { weekday: "short", day: "numeric" });
    dias.push(label);

    const count = ventas.filter(v =>
      toYMD(serialToDate(v.fecha_registro)) === ymd
    ).length;
    counts.push(count);
  }

  return { labels: dias, datos: counts };
}

/* Por mes (últimos 6 meses) */
function getDataMeses() {
  const meses = [];
  const counts = [];
  const hoy = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const prefix = `${year}-${month}`;

    const label = d.toLocaleDateString("es", { month: "short", year: "2-digit" });
    meses.push(label);

    const count = ventas.filter(v => {
      const ymd = toYMD(serialToDate(v.fecha_registro));
      return ymd && ymd.startsWith(prefix);
    }).length;
    counts.push(count);
  }

  return { labels: meses, datos: counts };
}
