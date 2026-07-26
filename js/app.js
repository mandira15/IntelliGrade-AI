/* ===================== INTELLIGRADE AI — MAIN APP ===================== */

import { SimState, PROCESS_VARS, PredictionTimeline, Alarms, HistoricalTransitions,
         OperatorDecisions, CorrelationData, MachineComponents, SimScenarios } from './data.js';
import { initTraining } from './training.js';

/* ── GLOBAL STATE ── */
let currentPage = 'dashboard';
let charts = {};
let simInterval = null;
let selectedScenario = 'D';

/* ── NAVIGATION ── */
window.navigate = function(el) {
  const page = el.dataset.page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const pageEl = document.getElementById('page-' + page);
  if (pageEl) pageEl.classList.add('active');
  currentPage = page;
  const names = {
    dashboard:'Dashboard', liveplant:'Live Plant', predictions:'Predictions',
    recommendations:'Recommendations', correlations:'Correlations', history:'Historical Analysis',
    simulator:'Simulator', operators:'Operator Decisions', health:'Machine Health',
    reports:'Reports', architecture:'Architecture', presentation:'Presentation',
    settings:'Settings', training:'Decision Challenge'
  };
  document.getElementById('headerBreadcrumb').textContent = names[page] || page;
  // Lazy initialize page-specific content
  switch(page) {
    case 'liveplant':      initLivePlant(); break;
    case 'predictions':    initPredictions(); break;
    case 'recommendations': initRecommendations(); break;
    case 'correlations':   initCorrelations(); break;
    case 'history':        initHistory(); break;
    case 'simulator':      initSimulator(); break;
    case 'operators':      initOperators(); break;
    case 'health':         initHealth(); break;
    case 'reports':        initReports(); break;
    case 'architecture':   initArchitecture(); break;
    case 'presentation':   initPresentation(); break;
    case 'settings':       initSettings(); break;
    case 'training':       initTraining(); break;
  }
};

window.openApp = function(page) {
  document.getElementById('landing').style.display = 'none';
  document.getElementById('app').style.display = 'flex';
  if (page && page !== 'dashboard') {
    const navItem = document.querySelector(`[data-page="${page}"]`);
    if (navItem) navigate(navItem);
  }
};

window.toggleAlarms = function() {
  document.getElementById('alarmPanel').classList.toggle('open');
};

window.acceptRec = function(btn) {
  btn.closest('.decision-card').querySelector('.decision-card-header').style.background = 'rgba(0,214,143,0.05)';
  btn.textContent = '✓ Accepted';
  btn.disabled = true;
};

window.rejectRec = function(btn) {
  btn.closest('.decision-card').style.opacity = '0.6';
};

window.modifyRec = function() {
  const val = prompt('Enter modified steam pressure setpoint (bar):', '8.0');
  if (val) alert(`Setpoint modified to ${val} bar. AI model updating...`);
};

/* ── LANDING CANVAS ANIMATION ── */
function initLandingCanvas() {
  const canvas = document.getElementById('landing-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Particles / pipes
  const particles = Array.from({length: 60}, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height,
    r: Math.random() * 2 + 0.5,
    vx: (Math.random() - 0.5) * 0.4,
    vy: Math.random() * 0.6 + 0.2,
    opacity: Math.random() * 0.5 + 0.2
  }));

  // Horizontal pipes
  const pipes = [0.25, 0.5, 0.72].map(y => ({
    y: canvas.height * y,
    speed: 1.5 + Math.random(),
    segments: Array.from({length: 8}, (_, i) => ({ x: i * 200, active: Math.random() > 0.3 }))
  }));

  // Paper roll
  let rollX = -100;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Gradient background glow
    const grad = ctx.createRadialGradient(canvas.width/2, canvas.height/2, 0, canvas.width/2, canvas.height/2, canvas.width*0.6);
    grad.addColorStop(0, 'rgba(204,0,0,0.04)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Pipes
    pipes.forEach(pipe => {
      pipe.segments.forEach((seg, i) => {
        seg.x -= pipe.speed;
        if (seg.x < -180) {
          seg.x = canvas.width + Math.random() * 100;
          seg.active = Math.random() > 0.3;
        }
        if (!seg.active) return;
        ctx.strokeStyle = `rgba(204,0,0,0.15)`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(seg.x, pipe.y);
        ctx.lineTo(seg.x + 140, pipe.y);
        ctx.stroke();

        // Pulse dot on pipe
        const pulse = (Date.now() / 1000 * pipe.speed + i) % 1;
        const px = seg.x + pulse * 140;
        ctx.beginPath();
        ctx.arc(px, pipe.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(204,0,0,${0.6 + Math.sin(Date.now()/300)*0.3})`;
        ctx.fill();
      });
    });

    // Particles
    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > canvas.height + 10) { p.y = -10; p.x = Math.random() * canvas.width; }
      if (p.x < -10 || p.x > canvas.width + 10) { p.x = Math.random() * canvas.width; }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${p.opacity * 0.4})`;
      ctx.fill();
    });

    // Animated paper roll
    rollX += 1.5;
    if (rollX > canvas.width + 120) rollX = -120;
    const ry = canvas.height * 0.72;
    ctx.save();
    // Shadow
    ctx.shadowColor = 'rgba(204,0,0,0.3)';
    ctx.shadowBlur = 20;
    // Roll body
    ctx.fillStyle = 'rgba(240,242,248,0.07)';
    ctx.strokeStyle = 'rgba(204,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(rollX, ry, 50, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Roll strip trailing
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 18;
    ctx.beginPath();
    ctx.moveTo(rollX - 50, ry);
    ctx.lineTo(rollX - 200, ry);
    ctx.stroke();
    ctx.restore();

    requestAnimationFrame(draw);
  }
  draw();
}

/* ── TIME ── */
function updateTime() {
  const el = document.getElementById('headerTime');
  if (el) el.textContent = new Date().toLocaleTimeString('en-IN', {hour12: false});
}
setInterval(updateTime, 1000);
updateTime();

/* ── SENSOR BADGE UPDATES ── */
function updateSensorBadges() {
  const sb1v = document.getElementById('sb1v');
  const sb2v = document.getElementById('sb2v');
  const sb3v = document.getElementById('sb3v');
  const sb4v = document.getElementById('sb4v');
  if (sb1v) sb1v.textContent = SimState.vars.steamPressure.toFixed(2) + ' bar';
  if (sb2v) sb2v.textContent = SimState.vars.basisWeight.toFixed(1) + ' gsm';
  if (sb3v) sb3v.textContent = Math.round(SimState.vars.machineSpeed) + ' m/min';
  if (sb4v) sb4v.textContent = SimState.vars.moisture.toFixed(1) + '%';
}

/* ── DASHBOARD INIT ── */
function initDashboard() {
  renderChartsGrid();
  renderTwinStages();
  renderRootCause();
  renderPredTimeline();
  initPredChart();
}

function renderChartsGrid() {
  const grid = document.getElementById('chartsGrid');
  if (!grid) return;
  const vars = Object.entries(PROCESS_VARS);
  grid.innerHTML = vars.map(([key, cfg]) => {
    const status = SimState.getStatus(key);
    const statusColor = status === 'normal' ? 'var(--success)' : status === 'warning' ? 'var(--warning)' : 'var(--danger)';
    return `
      <div class="chart-cell" id="cell-${key}">
        <div class="chart-cell-header">
          <div>
            <div class="chart-cell-name">${cfg.name}</div>
            <div style="display:flex;align-items:baseline;gap:3px;margin-top:3px">
              <span class="chart-cell-value" id="cv-${key}" style="color:${statusColor}">${SimState.vars[key].toFixed(key==='stockFlow'||key==='machineSpeed'?0:key==='caliper'?1:2)}</span>
              <span class="chart-cell-unit">${cfg.unit}</span>
            </div>
          </div>
          <div style="width:8px;height:8px;border-radius:50%;background:${statusColor};box-shadow:0 0 6px ${statusColor}" id="dot-${key}"></div>
        </div>
        <canvas class="mini-chart" id="mc-${key}"></canvas>
      </div>
    `;
  }).join('');

  // Initialize mini sparkline charts
  for (const [key, cfg] of vars) {
    initMiniChart(key, cfg);
  }
}

function initMiniChart(key, cfg) {
  const canvas = document.getElementById('mc-' + key);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = canvas.offsetWidth * window.devicePixelRatio;
  canvas.height = canvas.offsetHeight * window.devicePixelRatio;
  ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

  const W = canvas.offsetWidth, H = canvas.offsetHeight;
  const status = SimState.getStatus(key);
  const lineColor = status === 'normal' ? '#00D68F' : status === 'warning' ? '#FFB020' : '#FF4040';

  function drawSparkline() {
    ctx.clearRect(0, 0, W, H);
    const data = SimState.history[key];
    if (!data || data.length < 2) return;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const n = data.length;

    // Green safe zone
    const safeMin = (cfg.normal[0] - min) / range * H;
    const safeMax = (cfg.normal[1] - min) / range * H;
    ctx.fillStyle = 'rgba(0,214,143,0.06)';
    ctx.fillRect(0, H - safeMax, W, safeMax - safeMin);

    // Line
    ctx.beginPath();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    data.forEach((v, i) => {
      const x = (i / (n - 1)) * W;
      const y = H - ((v - min) / range) * H;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, lineColor.replace(')', ',0.2)').replace('rgb', 'rgba'));
    grad.addColorStop(1, 'transparent');
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath();
    ctx.fillStyle = status === 'normal' ? 'rgba(0,214,143,0.06)' :
                    status === 'warning' ? 'rgba(255,176,32,0.08)' : 'rgba(255,64,64,0.1)';
    ctx.fill();
  }

  charts[`spark-${key}`] = drawSparkline;
  drawSparkline();
}

function renderTwinStages() {
  const stages = [
    { icon: '🪣', name: 'Pulp Tank',    desc: 'Stock preparation', health: 99, status: 'normal' },
    { icon: '🌊', name: 'Stock Flow',   desc: 'Headbox consistency', health: 96, status: 'normal' },
    { icon: '📦', name: 'Headbox',      desc: 'Slice opening control', health: 94, status: 'normal' },
    { icon: '🔲', name: 'Wire Section', desc: 'Forming & drainage', health: 91, status: 'normal' },
    { icon: '🔵', name: 'Press Section',desc: 'Water removal', health: 97, status: 'normal' },
    { icon: '🔥', name: 'Dryer',        desc: 'Steam → 185°C', health: 72, status: 'warning' },
    { icon: '📐', name: 'Calender',     desc: 'Smoothing & gloss', health: 88, status: 'normal' },
    { icon: '🎞️', name: 'Reel',         desc: 'Winding station', health: 95, status: 'normal' },
  ];

  const el = document.getElementById('twinStages');
  if (!el) return;
  el.innerHTML = stages.map((s, i) => `
    <div class="twin-stage" onclick="showStageDetail('${s.name}')">
      ${i < stages.length-1 ? '<div class="stage-arrow"></div>' : ''}
      <div class="stage-icon ${s.status}">${s.icon}</div>
      <div class="stage-info">
        <div class="stage-name">${s.name}</div>
        <div class="stage-desc">${s.desc}</div>
      </div>
      <div class="stage-health">
        <span class="stage-health-val ${s.status}">${s.health}%</span>
        <span class="badge badge-${s.status === 'normal' ? 'success' : s.status === 'warning' ? 'warning' : 'danger'}" style="font-size:0.6rem">${s.status.toUpperCase()}</span>
      </div>
    </div>
  `).join('');
}

window.showStageDetail = function(name) {
  alert(`📊 ${name} — Detailed sensor data:\n\nTemperature: ${(150 + Math.random()*50).toFixed(1)}°C\nPressure: ${(6 + Math.random()*3).toFixed(2)} bar\nFlow Rate: ${(1100 + Math.random()*200).toFixed(0)} L/min\nHealth: ${(85 + Math.random()*15).toFixed(0)}%\nLast Service: ${Math.floor(Math.random()*30 + 5)} days ago`);
};

function renderRootCause() {
  const causes = [
    { name: 'Steam Pressure', pct: 89 },
    { name: 'Machine Speed', pct: 74 },
    { name: 'Stock Flow', pct: 62 },
    { name: 'Moisture', pct: 59 },
    { name: 'Filler Flow', pct: 41 },
    { name: 'Operator Action Delay', pct: 32 },
    { name: 'Recipe Difference', pct: 28 },
  ];

  const el = document.getElementById('rootCauseList');
  if (el) el.innerHTML = causes.map(c => `
    <div class="root-cause-bar">
      <div class="root-cause-name">${c.name}</div>
      <div class="root-cause-track">
        <div class="root-cause-fill" style="width:${c.pct}%"></div>
      </div>
      <div class="root-cause-pct">${c.pct}%</div>
    </div>
  `).join('');
}

function renderPredTimeline() {
  const pts = PredictionTimeline.generate();
  const el = document.getElementById('timelineRow');
  if (!el) return;
  el.innerHTML = pts.map((pt, i) => `
    <div class="timeline-point">
      <div class="timeline-dot ${i === 0 ? 'active' : pt.deviation ? 'predicted' : ''}"></div>
      <div class="timeline-label">${pt.label}</div>
      <div class="mono" style="font-size:0.6rem;color:${pt.deviation ? 'var(--danger)' : 'var(--text-muted)'}">${pt.value}</div>
    </div>
    ${i < pts.length - 1 ? '<div class="timeline-line"></div>' : ''}
  `).join('');
}

function initPredChart() {
  const el = document.getElementById('predChart');
  if (!el || charts.predChart) return;
  charts.predChart = echarts.init(el, null, { renderer: 'canvas' });
  updatePredChart();
}

function updatePredChart() {
  if (!charts.predChart) return;
  const now = SimState.vars.basisWeight;
  const times = ['Now', '+1m', '+2m', '+3m', '+4m', '+5m', '+6m', '+7m', '+8m'];
  const pred = times.map((t, i) => +(now + i * 2.1 + Math.random() * 0.3).toFixed(1));
  const actual = [now, now + 0.8 + Math.random() * 0.4, null, null, null, null, null, null, null];

  charts.predChart.setOption({
    backgroundColor: 'transparent',
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    xAxis: { type: 'category', data: times, axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } }, axisLabel: { color: '#7A7F96', fontSize: 11 }, splitLine: { show: false } },
    yAxis: { type: 'value', min: now - 5, max: now + 25, axisLabel: { color: '#7A7F96', fontSize: 11, formatter: v => v.toFixed(0) }, splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } }, axisLine: { show: false } },
    series: [
      {
        name: 'AI Prediction', type: 'line', data: pred,
        smooth: true, lineStyle: { color: '#FF4040', width: 2, type: 'dashed' },
        itemStyle: { color: '#FF4040' },
        areaStyle: { color: { type: 'linear', x:0,y:0,x2:0,y2:1, colorStops: [{ offset:0, color:'rgba(255,64,64,0.15)'},{offset:1,color:'transparent'}] } },
        symbol: 'circle', symbolSize: 5,
      },
      {
        name: 'Actual', type: 'line', data: actual,
        smooth: false, lineStyle: { color: '#00D68F', width: 2 },
        itemStyle: { color: '#00D68F' },
        symbol: 'circle', symbolSize: 6,
      },
      {
        name: 'Target (GSM 160)', type: 'line', data: new Array(9).fill(160),
        lineStyle: { color: 'rgba(45,156,219,0.5)', type: 'dotted', width: 1.5 },
        symbol: 'none', itemStyle: { color: '#2D9CDB' },
      },
      {
        name: 'Warning Zone', type: 'line', data: new Array(9).fill(155),
        lineStyle: { color: 'rgba(255,176,32,0.3)', type: 'dotted', width: 1 },
        symbol: 'none', areaStyle: { color: 'rgba(255,176,32,0.04)' },
      }
    ],
    tooltip: { trigger: 'axis', backgroundColor: '#1A1F2E', borderColor: 'rgba(255,255,255,0.07)', textStyle: { color: '#F0F2F8', fontSize: 12 } }
  });
}

/* ── LIVE UPDATES ── */
function startSimulation() {
  simInterval = setInterval(() => {
    SimState.update();
    // Expose SimState globally for training module sensor tiles
    window._simState = SimState;
    updateDashboardValues();
    updateSensorBadges();
    // Redraw sparklines
    Object.values(charts).forEach(fn => { if (typeof fn === 'function') fn(); });
  }, 2000);
}

function updateDashboardValues() {
  // Transition bar
  const pct = Math.min(SimState.transitionProgress, 100).toFixed(1);
  const bar = document.getElementById('transitionBar');
  if (bar) bar.style.width = pct + '%';
  const pp = document.getElementById('progressPct');
  if (pp) pp.textContent = pct + '%';
  const lbl = document.getElementById('transitionPctLabel');
  if (lbl) lbl.textContent = Math.round(pct) + '%';

  const tr = document.getElementById('timeRemaining');
  const eta = Math.max(0, Math.round((100 - SimState.transitionProgress) / 6));
  if (tr) tr.textContent = eta + ' min';

  // KPI
  const kpiLoss = document.getElementById('kpiLoss');
  if (kpiLoss) kpiLoss.textContent = '₹' + SimState.currentLoss.toLocaleString('en-IN');

  const devETA = document.getElementById('kpiDevETA');
  if (devETA) {
    const min = Math.max(1, Math.round(5 - (SimState.vars.steamPressure - 8.5) * 4));
    devETA.textContent = min + ' min';
  }

  // Chart cell values
  for (const [key, cfg] of Object.entries(PROCESS_VARS)) {
    const el = document.getElementById('cv-' + key);
    const dot = document.getElementById('dot-' + key);
    if (el) {
      const dp = key === 'stockFlow' || key === 'machineSpeed' ? 0 : key === 'caliper' ? 1 : 2;
      el.textContent = SimState.vars[key].toFixed(dp);
      const st = SimState.getStatus(key);
      const col = st === 'normal' ? 'var(--success)' : st === 'warning' ? 'var(--warning)' : 'var(--danger)';
      el.style.color = col;
      if (dot) { dot.style.background = col; dot.style.boxShadow = `0 0 6px ${col}`; }
    }
  }

  // Prediction values
  const bw = (SimState.vars.basisWeight + 14.2 + Math.random() * 0.4).toFixed(1);
  const els = ['predBW', 'pred2BW'];
  els.forEach(id => {
    const e = document.getElementById(id);
    if (e) e.innerHTML = bw + ' <span class="prediction-unit">GSM</span>';
  });

  const devP = Math.min(99, SimState.deviationProbability).toFixed(0);
  ['devProbBar','devProb2Bar'].forEach(id => {
    const e = document.getElementById(id);
    if (e) e.style.width = devP + '%';
  });
  ['devProbLabel','devProb2Label'].forEach(id => {
    const e = document.getElementById(id);
    if (e) e.textContent = devP + '%';
  });

  // Confidence ring update
  const conf = SimState.predictionConfidence.toFixed(1);
  const ring = document.getElementById('confRing');
  const ct = document.getElementById('confText');
  if (ring) {
    const offset = 188.5 - (parseFloat(conf)/100) * 188.5;
    ring.style.strokeDashoffset = offset;
  }
  if (ct) ct.textContent = conf + '%';

  // Mini charts need redraw
  for (const key of Object.keys(PROCESS_VARS)) {
    const fn = charts[`spark-${key}`];
    if (fn) fn();
  }
}

/* ── LIVE PLANT PAGE ── */
let livePlantInited = false;
function initLivePlant() {
  if (livePlantInited) return;
  livePlantInited = true;

  const container = document.getElementById('liveVarCards');
  if (container) {
    container.style.display = 'contents';
    container.parentElement.style.display = 'grid';
    container.parentElement.style.gridTemplateColumns = 'repeat(auto-fill,minmax(280px,1fr))';
    container.parentElement.style.gap = 'var(--spacing-md)';
    container.parentElement.style.marginBottom = 'var(--spacing-lg)';

    container.innerHTML = Object.entries(PROCESS_VARS).map(([key, cfg]) => {
      const status = SimState.getStatus(key);
      const statusColor = status === 'normal' ? 'var(--success)' : status === 'warning' ? 'var(--warning)' : 'var(--danger)';
      return `
        <div class="kpi-card status-${status === 'normal' ? 'running' : status}" style="display:flex;flex-direction:column;">
          <div class="kpi-label" style="display:flex;justify-content:space-between;">
            <span>${cfg.name}</span>
            <span style="color:${statusColor};font-size:0.65rem">${status.toUpperCase()}</span>
          </div>
          <div class="kpi-value" id="lp-${key}" style="color:${statusColor}">
            ${SimState.vars[key].toFixed(key==='stockFlow'||key==='machineSpeed'?0:2)} <span style="font-size:1rem;font-family:Inter">${cfg.unit}</span>
          </div>
          <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text-muted);margin-top:4px">
            <span>Range: ${cfg.range[0]}–${cfg.range[1]}</span>
            <span>Normal: ${cfg.normal[0]}–${cfg.normal[1]}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Full trend chart
  const el = document.getElementById('fullTrendChart');
  if (!el || charts.fullTrend) return;
  charts.fullTrend = echarts.init(el, null, { renderer: 'canvas' });
  updateFullTrend();
}

window.updateFullTrend = function() {
  if (!charts.fullTrend) return;
  const key = document.getElementById('trendVarSelect')?.value || 'steamPressure';
  const cfg = PROCESS_VARS[key];
  const data = SimState.history[key];
  const labels = data.map((_, i) => `${i * 2}s ago`).reverse().slice(0, data.length);

  charts.fullTrend.setOption({
    backgroundColor: 'transparent',
    grid: { left: 60, right: 30, top: 30, bottom: 40 },
    xAxis: {
      type: 'category', data: labels,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      axisLabel: { color: '#7A7F96', fontSize: 11, interval: 9 },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      min: cfg.range[0], max: cfg.range[1],
      axisLabel: { color: '#7A7F96', fontSize: 11 },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
      name: cfg.unit, nameTextStyle: { color: '#7A7F96', fontSize: 11 }
    },
    series: [
      {
        name: cfg.name, type: 'line', data: data, smooth: true,
        lineStyle: { color: '#CC0000', width: 2 },
        itemStyle: { color: '#CC0000' },
        symbol: 'none',
        areaStyle: { color: { type:'linear',x:0,y:0,x2:0,y2:1, colorStops:[{offset:0,color:'rgba(204,0,0,0.15)'},{offset:1,color:'transparent'}]} },
        markArea: {
          data: [[{ yAxis: cfg.normal[0], itemStyle: { color: 'rgba(0,214,143,0.04)' } }, { yAxis: cfg.normal[1] }]],
          label: { show: false }
        },
        markLine: {
          data: [
            { yAxis: cfg.warn[0], lineStyle: { color: 'rgba(255,176,32,0.4)', type: 'dashed' }, label: { formatter: 'Warn Low', color: '#FFB020', fontSize: 10 } },
            { yAxis: cfg.warn[1], lineStyle: { color: 'rgba(255,64,64,0.4)', type: 'dashed' }, label: { formatter: 'Warn High', color: '#FF4040', fontSize: 10 } },
          ],
          symbol: 'none'
        }
      }
    ],
    tooltip: { trigger: 'axis', backgroundColor: '#1A1F2E', borderColor: 'rgba(255,255,255,0.07)', textStyle: { color: '#F0F2F8', fontSize: 12 }, formatter: params => `${params[0].name}<br/><span style="color:#CC0000">●</span> ${cfg.name}: <b>${params[0].value?.toFixed(2)} ${cfg.unit}</b>` }
  }, true);
};

/* ── PREDICTIONS PAGE ── */
let predsInited = false;
function initPredictions() {
  if (predsInited) return;
  predsInited = true;

  // Multi-prediction chart
  const el = document.getElementById('multiPredChart');
  if (el && !charts.multiPred) {
    charts.multiPred = echarts.init(el, null, { renderer: 'canvas' });
    const now = SimState.vars.basisWeight;
    const times = ['Now','+2m','+4m','+6m','+8m','+10m','+12m','+14m'];
    charts.multiPred.setOption({
      backgroundColor: 'transparent',
      legend: { top: 0, right: 0, textStyle: { color: '#7A7F96', fontSize: 11 }, itemWidth: 14 },
      grid: { left: 50, right: 20, top: 40, bottom: 40 },
      xAxis: { type:'category', data: times, axisLine:{ lineStyle:{color:'rgba(255,255,255,0.1)'}}, axisLabel:{color:'#7A7F96',fontSize:11}, splitLine:{show:false} },
      yAxis: { type:'value', axisLabel:{color:'#7A7F96',fontSize:11}, splitLine:{lineStyle:{color:'rgba(255,255,255,0.04)'}}, axisLine:{show:false} },
      series: [
        { name:'Basis Weight', type:'line', data: times.map((_,i) => +(now+i*2.2).toFixed(1)), smooth:true, lineStyle:{color:'#CC0000',width:2}, itemStyle:{color:'#CC0000'}, areaStyle:{color:{type:'linear',x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:'rgba(204,0,0,0.15)'},{offset:1,color:'transparent'}]}}, symbol:'circle', symbolSize:5 },
        { name:'Steam Pressure', type:'line', data: times.map((_,i) => +(8.5+i*0.08+Math.random()*0.02).toFixed(2)), smooth:true, lineStyle:{color:'#FFB020',width:2}, itemStyle:{color:'#FFB020'}, symbol:'circle', symbolSize:4, yAxisIndex:0 },
        { name:'Moisture', type:'line', data: times.map((_,i) => +(5.2+Math.sin(i*0.5)*0.3).toFixed(2)), smooth:true, lineStyle:{color:'#2D9CDB',width:2}, itemStyle:{color:'#2D9CDB'}, symbol:'circle', symbolSize:4 },
        { name:'Target BW 160', type:'line', data: new Array(8).fill(160), lineStyle:{color:'rgba(0,214,143,0.5)',type:'dotted',width:1.5}, symbol:'none' },
      ],
      tooltip:{ trigger:'axis', backgroundColor:'#1A1F2E', borderColor:'rgba(255,255,255,0.07)', textStyle:{color:'#F0F2F8',fontSize:12} }
    });
  }

  // Full Root Cause
  const causes = [
    { name:'Steam Pressure', pct:89, color:'#CC0000' },
    { name:'Machine Speed', pct:74, color:'#FFB020' },
    { name:'Stock Flow', pct:62, color:'#FF5500' },
    { name:'Moisture', pct:59, color:'#2D9CDB' },
    { name:'Filler Flow', pct:41, color:'#7A7F96' },
    { name:'Operator Action Delay', pct:32, color:'#555870' },
    { name:'Recipe Difference', pct:28, color:'#3A3E55' },
  ];
  const frc = document.getElementById('fullRootCause');
  if (frc) frc.innerHTML = causes.map(c => `
    <div class="root-cause-bar">
      <div class="root-cause-name">${c.name}</div>
      <div class="root-cause-track">
        <div style="height:100%;border-radius:var(--radius-full);width:${c.pct}%;background:${c.color};transition:width 1s ease"></div>
      </div>
      <div class="root-cause-pct">${c.pct}%</div>
    </div>
  `).join('');

  // Secondary predictions
  const secs = [
    { var:'Moisture', curr:'5.2%', pred:'6.8%', risk:'Medium', color:'var(--warning)', eta:'8 min' },
    { var:'Caliper', curr:'148µm', pred:'155µm', risk:'Low', color:'var(--info)', eta:'11 min' },
    { var:'Ash Content', curr:'18.4%', pred:'19.2%', risk:'Low', color:'var(--info)', eta:'13 min' },
  ];
  const sl = document.getElementById('secPredList');
  if (sl) sl.innerHTML = secs.map(s => `
    <div style="display:flex;align-items:center;justify-content:space-between;padding:10px;background:var(--bg-elevated);border-radius:var(--radius-md)">
      <div>
        <div style="font-size:0.8rem;font-weight:600;color:var(--text-primary)">${s.var}</div>
        <div style="font-size:0.7rem;color:var(--text-muted)">${s.curr} → <span style="color:${s.color}">${s.pred}</span></div>
      </div>
      <div style="text-align:right">
        <div style="font-size:0.72rem;color:${s.color};font-weight:600">${s.risk} Risk</div>
        <div style="font-size:0.65rem;color:var(--text-muted)">in ${s.eta}</div>
      </div>
    </div>
  `).join('');
}

/* ── RECOMMENDATIONS PAGE ── */
let recsInited = false;
function initRecommendations() {
  if (recsInited) return;
  recsInited = true;

  const recs = [
    {
      n:1, title:'Adjust Steam Pressure', icon:'🔥',
      curr:'8.5 bar', sugg:'7.9 bar', unit:'bar',
      improvement:'Reduce deviation by 63%', conf:96, histSuccess:'89%',
      reason:'Steam pressure has increased 14% in last 4 min. 63 previous transitions show reducing pressure stabilizes Basis Weight.',
      affectedVars:['Basis Weight','Moisture','Caliper'],
      expectedOutcome:'Stabilization in 3.8 min. Loss prevention ₹23,800.',
      color:'var(--danger)'
    },
    {
      n:2, title:'Increase Machine Speed', icon:'⚡',
      curr:'680 m/min', sugg:'705 m/min', unit:'m/min',
      improvement:'3 minutes faster stabilization', conf:89, histSuccess:'92%',
      reason:'Increasing speed improves draw ratio at higher GSM. Historically combined with pressure reduction for faster stabilization.',
      affectedVars:['Basis Weight','Stock Dilution','Formation'],
      expectedOutcome:'Stabilization 3 min faster than baseline.',
      color:'var(--warning)'
    },
    {
      n:3, title:'Reduce Stock Flow', icon:'💧',
      curr:'1240 L/min', sugg:'1180 L/min', unit:'L/min',
      improvement:'Basis Weight recovery in 2.5 min', conf:82, histSuccess:'78%',
      reason:'Reducing stock dilution at target grade increases sheet consistency. Secondary to pressure reduction.',
      affectedVars:['Basis Weight','Ash Content','Sheet Formation'],
      expectedOutcome:'Basis Weight recovery within 2.5 min. Lower variability.',
      color:'var(--info)'
    }
  ];

  const el = document.getElementById('recsList');
  if (!el) return;
  el.innerHTML = recs.map(r => `
    <div class="rec-card mb-lg" id="rec-${r.n}">
      <div class="rec-header">
        <div class="rec-number">${r.n}</div>
        <div class="rec-title">${r.icon} ${r.title}</div>
        <span class="badge badge-${r.conf>90?'success':'warning'}">${r.conf}% Confidence</span>
      </div>
      <div class="rec-row">
        <div class="rec-param">
          <div class="rec-param-label">Current</div>
          <div class="rec-param-value">${r.curr}</div>
        </div>
        <div class="rec-arrow" style="color:${r.color};font-size:1.5rem">→</div>
        <div class="rec-param">
          <div class="rec-param-label">Suggested</div>
          <div class="rec-param-value suggested">${r.sugg}</div>
        </div>
        <div class="rec-param">
          <div class="rec-param-label">Improvement</div>
          <div class="rec-param-value" style="color:var(--success);font-size:0.85rem">${r.improvement}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--spacing-md);margin-bottom:var(--spacing-md)">
        <div class="xai-box">
          <div class="xai-box-title">🔍 Why AI Recommends This?</div>
          <div class="xai-point">${r.reason}</div>
          <div class="xai-point">Historical success rate: <strong style="color:var(--success)">${r.histSuccess}</strong></div>
          <div class="xai-point">Expected outcome: <strong style="color:var(--success)">${r.expectedOutcome}</strong></div>
        </div>
        <div style="background:var(--bg-elevated);border-radius:var(--radius-md);padding:14px">
          <div class="label-sm" style="margin-bottom:8px">Affected Variables</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px">
            ${r.affectedVars.map(v => `<span class="badge badge-info">${v}</span>`).join('')}
          </div>
          <div class="label-sm" style="margin-bottom:6px">Confidence Breakdown</div>
          <div class="progress-bar"><div class="progress-fill success" style="width:${r.conf}%"></div></div>
          <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px">${r.conf}% — Based on ${r.histSuccess} historical success</div>
          <div class="label-sm" style="margin-top:10px;margin-bottom:4px">Inference Sources</div>
          <div class="inference-sources" style="flex-wrap:wrap">
            <div class="inference-chip active">📊 Historical</div>
            <div class="inference-chip active">🤖 ML Model</div>
            <div class="inference-chip active">⚙️ MPC Rules</div>
          </div>
        </div>
      </div>
      <div class="rec-actions">
        <button class="btn btn-success" onclick="recAction(${r.n},'accepted',this)">✓ Accept</button>
        <button class="btn btn-danger" onclick="recAction(${r.n},'rejected',this)">✗ Reject</button>
        <button class="btn btn-secondary" onclick="navigate(document.querySelector('[data-page=simulator]'))">🔬 Simulate</button>
        <button class="btn btn-secondary btn-sm" onclick="showXAI(${r.n})">💬 Why?</button>
      </div>
    </div>
  `).join('');
}

window.recAction = function(n, action, btn) {
  const card = document.getElementById('rec-' + n);
  if (!card) return;
  card.style.opacity = action === 'rejected' ? '0.5' : '1';
  if (action === 'accepted') {
    card.style.borderColor = 'var(--success-border)';
    card.style.background = 'linear-gradient(135deg, rgba(0,214,143,0.05), var(--bg-card))';
    btn.parentElement.querySelectorAll('button').forEach(b => { b.disabled = true; });
    const msg = document.createElement('div');
    msg.innerHTML = `<div style="margin-top:10px;padding:8px 12px;background:var(--success-bg);border:1px solid var(--success-border);border-radius:var(--radius-sm);font-size:0.78rem;color:var(--success)">✅ Recommendation accepted. Setpoint change sent to DCS. AI model updated with operator decision.</div>`;
    card.querySelector('.rec-actions').after(msg);
  }
};

window.showXAI = function(n) {
  alert(`🔍 Explainable AI — Recommendation #${n}\n\nModel: LSTM + XGBoost Ensemble\nSHAP Top Feature: Steam Pressure (contribution: 0.89)\nHistorical Evidence: 63 similar transitions\nCorrelation Strength: 0.92 with Basis Weight\nConfidence Interval: 94–98%\n\nThe AI identified steam pressure as the primary driver based on time-series pattern matching with historical Grade Change events between GSM 120→160.`);
};

/* ── CORRELATIONS PAGE ── */
let corrInited = false;
function initCorrelations() {
  if (corrInited) return;
  corrInited = true;

  const svg = d3.select('#correlation-svg');
  const el = document.getElementById('correlation-svg');
  if (!el) return;

  const W = el.parentElement.offsetWidth;
  const H = 500;
  svg.attr('width', W).attr('height', H);

  const tooltip = document.getElementById('networkTooltip');

  const scaleX = d => d.x / 800 * W;
  const scaleY = d => d.y / 500 * H;

  const nodes = CorrelationData.nodes;
  const edges = CorrelationData.edges;

  // Draw edges
  const edgeG = svg.append('g');
  edges.forEach(e => {
    const src = nodes.find(n => n.id === e.source);
    const tgt = nodes.find(n => n.id === e.target);
    const strength = e.corr;
    const strokeWidth = strength > 0.8 ? 3 : strength > 0.5 ? 2 : 1;
    const strokeColor = strength > 0.8 ? 'rgba(204,0,0,0.6)' :
                        strength > 0.5 ? 'rgba(255,176,32,0.5)' : 'rgba(122,127,150,0.3)';

    const line = edgeG.append('line')
      .attr('x1', scaleX(src)).attr('y1', scaleY(src))
      .attr('x2', scaleX(tgt)).attr('y2', scaleY(tgt))
      .attr('stroke', strokeColor).attr('stroke-width', strokeWidth)
      .style('cursor', 'pointer');

    line.on('mouseenter', function(event) {
      tooltip.style.opacity = '1';
      tooltip.classList.add('visible');
      tooltip.innerHTML = `
        <div class="network-tooltip-title">${e.source} ↔ ${e.target}</div>
        <div class="network-tooltip-row"><span>Correlation</span><span>${e.corr}</span></div>
        <div class="network-tooltip-row"><span>Data Samples</span><span>${e.samples} transitions</span></div>
        <div class="network-tooltip-row"><span>Confidence</span><span>95%</span></div>
        ${e.unknown ? '<div style="color:var(--success);font-size:0.7rem;margin-top:4px">🆕 Previously Unknown</div>' : ''}
      `;
    }).on('mousemove', function(event) {
      const rect = el.getBoundingClientRect();
      tooltip.style.left = (event.clientX - rect.left + 10) + 'px';
      tooltip.style.top = (event.clientY - rect.top - 60) + 'px';
    }).on('mouseleave', function() {
      tooltip.classList.remove('visible');
      tooltip.style.opacity = '0';
    });
  });

  // Draw nodes
  const nodeG = svg.append('g');
  nodes.forEach(n => {
    const g = nodeG.append('g')
      .attr('transform', `translate(${scaleX(n)},${scaleY(n)})`)
      .style('cursor', 'pointer');

    const r = n.type === 'target' ? 22 : n.type === 'primary' ? 16 : 12;
    const fill = n.type === 'target' ? 'rgba(204,0,0,0.8)' :
                 n.type === 'primary' ? 'rgba(45,156,219,0.7)' :
                 n.type === 'external' ? 'rgba(255,176,32,0.6)' : 'rgba(122,127,150,0.5)';
    const glow = n.type === 'target' ? 'rgba(204,0,0,0.4)' : 'transparent';

    g.append('circle')
      .attr('r', r).attr('fill', fill)
      .style('filter', n.type === 'target' ? 'drop-shadow(0 0 12px rgba(204,0,0,0.5))' : 'none');

    g.append('text')
      .attr('dy', r + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', '#F0F2F8')
      .attr('font-size', '10')
      .attr('font-family', 'Inter, sans-serif')
      .attr('font-weight', n.type === 'target' ? '700' : '500')
      .text(n.label);

    // Correlation pulse for target node
    if (n.type === 'target') {
      g.append('circle').attr('r', r).attr('fill', 'none')
        .attr('stroke', 'rgba(204,0,0,0.3)').attr('stroke-width', '2')
        .append('animate').attr('attributeName', 'r').attr('from', r).attr('to', r + 12)
        .attr('dur', '2s').attr('repeatCount', 'indefinite');
      g.append('circle').attr('r', r).attr('fill', 'none')
        .attr('stroke', 'rgba(204,0,0,0.15)').attr('stroke-width', '1')
        .append('animate').attr('attributeName', 'r').attr('from', r).attr('to', r + 20)
        .attr('dur', '2s').attr('begin', '0.5s').attr('repeatCount', 'indefinite');
    }
  });

  // Correlation table
  const corrTable = document.getElementById('corrTable');
  if (corrTable) {
    corrTable.innerHTML = `
      <table style="width:100%;border-collapse:collapse;font-size:0.8rem">
        <thead>
          <tr style="border-bottom:1px solid var(--border-default)">
            <th style="text-align:left;padding:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase;font-size:0.7rem;letter-spacing:0.06em">Variable Pair</th>
            <th style="text-align:right;padding:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase;font-size:0.7rem;letter-spacing:0.06em">Correlation</th>
            <th style="text-align:right;padding:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase;font-size:0.7rem;letter-spacing:0.06em">Samples</th>
            <th style="text-align:right;padding:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase;font-size:0.7rem;letter-spacing:0.06em">Confidence</th>
            <th style="text-align:center;padding:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase;font-size:0.7rem;letter-spacing:0.06em">Status</th>
          </tr>
        </thead>
        <tbody>
          ${CorrelationData.edges.map(e => `
            <tr style="border-bottom:1px solid var(--border-subtle);transition:background 0.15s" onmouseenter="this.style.background='rgba(255,255,255,0.02)'" onmouseleave="this.style.background='transparent'">
              <td style="padding:10px;color:var(--text-primary);font-weight:500">${e.source} ↔ ${e.target}</td>
              <td style="padding:10px;text-align:right;font-family:'JetBrains Mono',monospace;color:${e.corr>0.8?'var(--danger)':e.corr>0.5?'var(--warning)':'var(--text-secondary)'};font-weight:700">${e.corr}</td>
              <td style="padding:10px;text-align:right;font-family:'JetBrains Mono',monospace;color:var(--text-secondary)">${e.samples}</td>
              <td style="padding:10px;text-align:right;font-family:'JetBrains Mono',monospace;color:var(--success)">95%</td>
              <td style="padding:10px;text-align:center">${e.unknown ? '<span class="badge badge-success" style="font-size:0.65rem">🆕 New</span>' : '<span class="badge badge-info" style="font-size:0.65rem">Known</span>'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }
}

/* ── HISTORICAL PAGE ── */
let histInited = false;
function initHistory() {
  if (histInited) return;
  histInited = true;

  // History chart
  const el = document.getElementById('historyChart');
  if (el && !charts.history) {
    charts.history = echarts.init(el, null, { renderer: 'canvas' });
    const months = ['Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar'];
    charts.history.setOption({
      backgroundColor: 'transparent',
      legend: { top: 0, right: 0, textStyle: { color: '#7A7F96', fontSize: 11 } },
      grid: { left: 50, right: 20, top: 40, bottom: 40 },
      xAxis: { type:'category', data: months, axisLine:{lineStyle:{color:'rgba(255,255,255,0.1)'}}, axisLabel:{color:'#7A7F96',fontSize:11}, splitLine:{show:false} },
      yAxis: [
        { type:'value', name:'Loss (₹K)', nameTextStyle:{color:'#7A7F96',fontSize:10}, axisLabel:{color:'#7A7F96',fontSize:11}, splitLine:{lineStyle:{color:'rgba(255,255,255,0.04)'}}, axisLine:{show:false} },
        { type:'value', name:'Stab. (min)', nameTextStyle:{color:'#7A7F96',fontSize:10}, axisLabel:{color:'#7A7F96',fontSize:11}, splitLine:{show:false}, axisLine:{show:false} }
      ],
      series: [
        { name:'Loss without AI (₹K)', type:'bar', data:[54,48,42,36,30,24,18,14], itemStyle:{color:'rgba(255,64,64,0.7)',borderRadius:[4,4,0,0]}, barMaxWidth:28 },
        { name:'Loss with AI (₹K)', type:'bar', data:[38,32,28,24,20,16,13,10], itemStyle:{color:'rgba(0,214,143,0.7)',borderRadius:[4,4,0,0]}, barMaxWidth:28 },
        { name:'Stabilization Time (min)', type:'line', yAxisIndex:1, data:[18,17,15,13,11,9,8.1,7.5], smooth:true, lineStyle:{color:'#CC0000',width:2}, itemStyle:{color:'#CC0000'}, symbol:'circle', symbolSize:5 },
      ],
      tooltip:{ trigger:'axis', backgroundColor:'#1A1F2E', borderColor:'rgba(255,255,255,0.07)', textStyle:{color:'#F0F2F8',fontSize:12} }
    });
  }

  // History list
  const el2 = document.getElementById('historyList');
  if (el2) {
    el2.innerHTML = HistoricalTransitions.map(t => `
      <div class="history-item">
        <div class="history-dot ${t.status}"></div>
        <div class="history-card">
          <div class="history-header">
            <div>
              <div style="font-size:0.875rem;font-weight:700;color:var(--text-primary)">${t.from} → ${t.to}</div>
              <div style="font-size:0.7rem;color:var(--text-muted)">${t.date} &nbsp;•&nbsp; ${t.id}</div>
            </div>
            <div style="display:flex;gap:6px;align-items:center">
              <span class="badge badge-${t.status === 'success' ? 'success' : 'danger'}">${t.status.toUpperCase()}</span>
              ${t.aiUsed ? '<span class="badge badge-red">AI Used</span>' : ''}
            </div>
          </div>
          <div class="history-stats">
            <div class="history-stat">
              <div class="history-stat-v">${t.stabTime}</div>
              <div class="history-stat-l">Stab. Time</div>
            </div>
            <div class="history-stat">
              <div class="history-stat-v">${t.loss}</div>
              <div class="history-stat-l">Material Loss</div>
            </div>
            <div class="history-stat">
              <div class="history-stat-v">${t.deviation} gsm</div>
              <div class="history-stat-l">Deviation</div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Learned patterns
  const lp = document.getElementById('learnedPatterns');
  if (lp) {
    const patterns = [
      { icon:'🔥', text:'Steam pressure spike >10% during GSM increase always precedes BW deviation', corr:'0.92', samples:'89' },
      { icon:'⚡', text:'Combined speed+pressure adjustment reduces stabilization by avg 42%', corr:'0.81', samples:'63' },
      { icon:'💧', text:'Stock flow reduction effective when ash content is within ±2% of target', corr:'0.74', samples:'47' },
      { icon:'🕐', text:'Operator response delay >3 min increases loss by avg ₹12,000', corr:'0.68', samples:'112' },
    ];
    lp.innerHTML = patterns.map(p => `
      <div style="background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-md);padding:12px">
        <div style="display:flex;gap:10px;align-items:flex-start">
          <span style="font-size:1.1rem">${p.icon}</span>
          <div>
            <div style="font-size:0.78rem;color:var(--text-secondary);line-height:1.4;margin-bottom:6px">${p.text}</div>
            <div style="display:flex;gap:8px">
              <span class="badge badge-red">r=${p.corr}</span>
              <span class="badge badge-info">${p.samples} samples</span>
            </div>
          </div>
        </div>
      </div>
    `).join('');
  }
}

/* ── OPERATOR DECISIONS PAGE ── */
let opsInited = false;
function initOperators() {
  if (opsInited) return;
  opsInited = true;

  const el = document.getElementById('decisionHistory');
  if (!el) return;

  el.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:0.8rem">
      <thead>
        <tr style="border-bottom:1px solid var(--border-default)">
          <th style="text-align:left;padding:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase;font-size:0.7rem;letter-spacing:0.06em">Recommendation</th>
          <th style="text-align:center;padding:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase;font-size:0.7rem;letter-spacing:0.06em">Decision</th>
          <th style="text-align:left;padding:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase;font-size:0.7rem;letter-spacing:0.06em">Note</th>
          <th style="text-align:right;padding:10px;color:var(--text-muted);font-weight:600;text-transform:uppercase;font-size:0.7rem;letter-spacing:0.06em">Improvement</th>
        </tr>
      </thead>
      <tbody>
        ${OperatorDecisions.map(d => `
          <tr style="border-bottom:1px solid var(--border-subtle)" onmouseenter="this.style.background='rgba(255,255,255,0.02)'" onmouseleave="this.style.background='transparent'">
            <td style="padding:10px;color:var(--text-primary);font-weight:500;max-width:200px">${d.rec}</td>
            <td style="padding:10px;text-align:center">
              <span class="badge badge-${d.action==='accepted'?'success':'danger'}">${d.action.toUpperCase()}</span>
            </td>
            <td style="padding:10px;color:var(--text-muted);font-size:0.75rem;max-width:200px">${d.note || '—'}</td>
            <td style="padding:10px;text-align:right;font-family:'JetBrains Mono',monospace;color:${d.improvement?'var(--success)':'var(--text-muted)'}">
              ${d.improvement || '—'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

/* ── MACHINE HEALTH PAGE ── */
let healthInited = false;
function initHealth() {
  if (healthInited) return;
  healthInited = true;

  const el = document.getElementById('componentCards');
  if (!el) return;

  el.innerHTML = MachineComponents.map(c => `
    <div class="component-card">
      <div class="comp-icon">${c.icon}</div>
      <div class="comp-name">${c.name}</div>
      <div class="comp-health ${c.status}">${c.health}%</div>
      <div class="progress-bar mb-sm">
        <div class="progress-fill ${c.status==='good'?'success':c.status==='warn'?'warning':'danger'}" style="width:${c.health}%"></div>
      </div>
      <div class="comp-maintenance">⏱ Maintenance in ${c.days} days</div>
      ${c.temp ? `<div class="comp-maintenance" style="margin-top:2px">🌡 ${c.temp}</div>` : ''}
      ${c.flow ? `<div class="comp-maintenance" style="margin-top:2px">💧 ${c.flow}</div>` : ''}
    </div>
  `).join('');
}

/* ── SIMULATOR PAGE ── */
let simInited = false;
function initSimulator() {
  if (simInited) return;
  simInited = true;

  const grid = document.getElementById('scenariosGrid');
  if (grid) {
    grid.innerHTML = SimScenarios.map(s => `
      <div class="scenario-card ${s.id === selectedScenario ? 'selected' : ''}" onclick="selectScenario('${s.id}',this)">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
          <div class="scenario-letter">${s.id}</div>
          ${s.best ? '<span class="badge badge-success">⭐ Best</span>' : ''}
        </div>
        <div class="scenario-title">${s.title}</div>
        <div class="scenario-desc">${s.desc}</div>
        <div class="scenario-metrics">
          <div class="scenario-metric">
            <div class="scenario-metric-val ${s.best?'best':''}">${s.stabTime}</div>
            <div class="scenario-metric-label">Stab. Time</div>
          </div>
          <div class="scenario-metric">
            <div class="scenario-metric-val ${s.best?'best':''}">${s.loss}</div>
            <div class="scenario-metric-label">Est. Loss</div>
          </div>
          <div class="scenario-metric">
            <div class="scenario-metric-val ${s.best?'best':''}">${s.confidence}%</div>
            <div class="scenario-metric-label">Confidence</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  initSimChart();
  renderSimTable();
}

window.selectScenario = function(id, el) {
  selectedScenario = id;
  document.querySelectorAll('.scenario-card').forEach(c => c.classList.remove('selected'));
  el.classList.add('selected');
  updateSimChart();
};

function initSimChart() {
  const el = document.getElementById('sim-chart');
  if (!el || charts.sim) return;
  charts.sim = echarts.init(el, null, { renderer: 'canvas' });
  updateSimChart();
}

function updateSimChart() {
  if (!charts.sim) return;
  const base = SimState.vars.basisWeight;
  const target = 160;
  const times = ['Now','+1m','+2m','+3m','+4m','+5m','+6m','+7m','+8m'];

  const seriesData = SimScenarios.map(s => {
    const stabIdx = Math.round(parseFloat(s.stabTime) / 1);
    return {
      name: `Scenario ${s.id}: ${s.title}`,
      type: 'line',
      data: times.map((_, i) => {
        if (i >= stabIdx) return +(target + (Math.random()-0.5)*0.4).toFixed(1);
        const progress = i / stabIdx;
        return +(base + (target - base) * progress + (Math.random()-0.5) * 1.5).toFixed(1);
      }),
      smooth: true,
      lineStyle: { color: s.color, width: s.id === selectedScenario ? 3 : 1.5, type: s.id === selectedScenario ? 'solid' : 'dashed' },
      itemStyle: { color: s.color },
      symbol: 'circle', symbolSize: s.id === selectedScenario ? 6 : 3,
    };
  });

  seriesData.push({
    name: 'Target GSM 160',
    type: 'line', data: new Array(9).fill(target),
    lineStyle: { color: 'rgba(255,255,255,0.2)', type: 'dotted', width: 1 },
    symbol: 'none',
  });

  charts.sim.setOption({
    backgroundColor: 'transparent',
    legend: { top: 0, right: 0, textStyle: { color: '#7A7F96', fontSize: 11 } },
    grid: { left: 50, right: 20, top: 40, bottom: 40 },
    xAxis: { type:'category', data: times, axisLine:{lineStyle:{color:'rgba(255,255,255,0.1)'}}, axisLabel:{color:'#7A7F96',fontSize:11}, splitLine:{show:false} },
    yAxis: { type:'value', min: base - 5, max: target + 8, axisLabel:{color:'#7A7F96',fontSize:11}, splitLine:{lineStyle:{color:'rgba(255,255,255,0.04)'}}, axisLine:{show:false} },
    series: seriesData,
    tooltip: { trigger:'axis', backgroundColor:'#1A1F2E', borderColor:'rgba(255,255,255,0.07)', textStyle:{color:'#F0F2F8',fontSize:12} }
  }, true);
}

function renderSimTable() {
  const el = document.getElementById('simTable');
  if (!el) return;
  el.innerHTML = `
    <table style="width:100%;border-collapse:collapse;font-size:0.8rem">
      <thead>
        <tr style="border-bottom:1px solid var(--border-default)">
          <th style="text-align:left;padding:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase;font-size:0.7rem">Scenario</th>
          <th style="text-align:center;padding:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase;font-size:0.7rem">Stabilization</th>
          <th style="text-align:center;padding:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase;font-size:0.7rem">Est. Loss</th>
          <th style="text-align:center;padding:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase;font-size:0.7rem">BW Recovery</th>
          <th style="text-align:center;padding:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase;font-size:0.7rem">Confidence</th>
          <th style="text-align:center;padding:12px;color:var(--text-muted);font-weight:600;text-transform:uppercase;font-size:0.7rem">Action</th>
        </tr>
      </thead>
      <tbody>
        ${SimScenarios.map(s => `
          <tr style="border-bottom:1px solid var(--border-subtle);background:${s.id===selectedScenario?'rgba(204,0,0,0.04)':'transparent'}" onmouseenter="this.style.background='rgba(255,255,255,0.02)'" onmouseleave="this.style.background='${s.id===selectedScenario?'rgba(204,0,0,0.04)':'transparent'}'">
            <td style="padding:12px">
              <div style="display:flex;align-items:center;gap:10px">
                <div style="width:20px;height:20px;background:${s.color};border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:800;color:${s.id==='D'?'#000':'white'}">${s.id}</div>
                <div>
                  <div style="color:var(--text-primary);font-weight:600">${s.title}</div>
                  ${s.best ? '<span class="badge badge-success" style="font-size:0.6rem">⭐ Recommended</span>' : ''}
                </div>
              </div>
            </td>
            <td style="padding:12px;text-align:center;font-family:'JetBrains Mono',monospace;color:${s.best?'var(--success)':'var(--text-primary)'}"><b>${s.stabTime}</b></td>
            <td style="padding:12px;text-align:center;font-family:'JetBrains Mono',monospace;color:${s.best?'var(--success)':'var(--text-primary)'}"><b>${s.loss}</b></td>
            <td style="padding:12px;text-align:center;font-family:'JetBrains Mono',monospace;color:var(--text-primary)">${s.bwRecovery}</td>
            <td style="padding:12px;text-align:center">
              <div class="progress-bar" style="width:100px;margin:0 auto">
                <div class="progress-fill ${s.confidence>90?'success':'warning'}" style="width:${s.confidence}%"></div>
              </div>
              <div style="font-size:0.7rem;color:var(--text-muted);margin-top:4px">${s.confidence}%</div>
            </td>
            <td style="padding:12px;text-align:center">
              <button class="btn btn-sm btn-primary" onclick="applyScenario('${s.id}')">Apply</button>
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  `;
}

window.applyScenario = function(id) {
  const s = SimScenarios.find(sc => sc.id === id);
  if (confirm(`Apply Scenario ${id}: ${s.title}?\n\nEstimated:\n• Stabilization: ${s.stabTime}\n• Material Loss: ${s.loss}\n• Confidence: ${s.confidence}%\n\nThis will send setpoint commands to the DCS.`)) {
    alert(`✅ Scenario ${id} applied successfully!\n\nSetpoint changes sent to Honeywell DCS.\nAI monitoring active. Estimated stabilization in ${s.stabTime}.`);
  }
};

/* ── REPORTS PAGE ── */
let reportsInited = false;
function initReports() {
  if (reportsInited) return;
  reportsInited = true;

  const opts = [
    'Transition Summary', 'Predicted Risks', 'Actions Taken', 'Operator Decisions',
    'Savings Analysis', 'Machine Performance', 'AI Recommendations', 'Correlation Report'
  ];
  const el = document.getElementById('reportOptions');
  if (el) {
    el.innerHTML = opts.map((o, i) => `
      <div class="report-option">
        <input type="checkbox" id="ro-${i}" ${i < 6 ? 'checked' : ''} style="accent-color:var(--hw-red)"/>
        <label for="ro-${i}" style="font-size:0.875rem;color:var(--text-secondary);cursor:pointer">${o}</label>
      </div>
    `).join('');
  }

  const dateEl = document.getElementById('reportDate');
  if (dateEl) dateEl.textContent = new Date().toLocaleDateString('en-IN');

  const body = document.getElementById('reportBody');
  if (body) {
    body.innerHTML = opts.map((o, i) => `
      <div class="report-section-item">
        <span style="color:var(--hw-red)">📊</span>
        <div>
          <div style="font-size:0.875rem;font-weight:600;color:var(--text-primary)">${o}</div>
          <div style="font-size:0.72rem;color:var(--text-muted)">Ready to generate</div>
        </div>
      </div>
    `).join('');
  }
}

window.generateReport = function() {
  const body = document.getElementById('reportBody');
  if (!body) return;
  const items = [
    { icon:'✅', title:'Transition Summary', val:'GSM 120 → 160 | 68% complete | Medium Risk' },
    { icon:'⚠️', title:'Predicted Risks', val:'Basis Weight deviation predicted in 4 min | Steam Pressure anomaly' },
    { icon:'⚡', title:'Actions Taken', val:'Recommendation #1 accepted | Steam pressure reduced' },
    { icon:'👤', title:'Operator Decisions', val:'3 accepted (92%) | 1 rejected (8%)' },
    { icon:'💰', title:'Savings Analysis', val:'₹28,000 saved vs baseline | 67% loss reduction' },
    { icon:'❤️', title:'Machine Performance', val:'Overall Health: 98% | 1 component attention needed' },
  ];
  body.innerHTML = items.map(i => `
    <div class="report-section-item" style="border-left:3px solid var(--hw-red)">
      <span style="font-size:1.1rem">${i.icon}</span>
      <div>
        <div style="font-size:0.875rem;font-weight:700;color:var(--text-primary)">${i.title}</div>
        <div style="font-size:0.75rem;color:var(--text-secondary)">${i.val}</div>
      </div>
    </div>
  `).join('');
};

window.downloadReport = function() {
  alert('📄 Generating PDF report...\n\nIntelliGrade AI Transition Report\nPM-3 • GSM 120 → GSM 160\nDate: ' + new Date().toLocaleDateString('en-IN') + '\n\n[In production, this would download a full PDF via FastAPI backend]');
};

/* ── ARCHITECTURE PAGE ── */
let archInited = false;
function initArchitecture() {
  if (archInited) return;
  archInited = true;

  const archNodes = [
    { icon:'📡', title:'IoT Sensors', sub:'QCS, Actuators, Scanners', hl:false },
    { icon:'⚙️', title:'Honeywell QCS', sub:'Quality Control System', hl:true },
    { icon:'🗄️', title:'Data Collection', sub:'Edge Computing Layer', hl:false },
    { icon:'🔧', title:'Preprocessing', sub:'Cleaning, Normalization, Feature Eng.', hl:false },
    { icon:'🧠', title:'Time Series Prediction', sub:'LSTM + XGBoost Ensemble', hl:true },
    { icon:'🌐', title:'Correlation Discovery', sub:'Graph Neural Network', hl:false },
    { icon:'⚡', title:'Recommendation Engine', sub:'Multi-objective Optimization', hl:true },
    { icon:'🔍', title:'Explainable AI Layer', sub:'SHAP + LIME + Evidence Mapping', hl:true },
    { icon:'📊', title:'IntelliGrade Dashboard', sub:'React + Apache ECharts + D3', hl:false },
    { icon:'👤', title:'Operator Feedback', sub:'Accept / Reject / Modify', hl:false },
    { icon:'📈', title:'Continuous Learning', sub:'Model retraining on new decisions', hl:true },
  ];

  const el = document.getElementById('archFlow');
  if (el) {
    el.innerHTML = archNodes.map((n, i) => `
      <div class="arch-node ${n.hl ? 'highlight' : ''}">
        <div class="arch-node-icon">${n.icon}</div>
        <div class="arch-node-title">${n.title}</div>
        <div class="arch-node-sub">${n.sub}</div>
      </div>
      ${i < archNodes.length - 1 ? '<div class="arch-arrow"></div>' : ''}
    `).join('');
  }

  const techStack = [
    { category:'Frontend', techs:['React 18', 'Apache ECharts', 'D3.js v7', 'WebSocket'] },
    { category:'Backend', techs:['FastAPI', 'Python 3.11', 'Redis', 'PostgreSQL 15'] },
    { category:'ML / AI', techs:['LSTM (PyTorch)', 'XGBoost', 'SHAP', 'Isolation Forest'] },
    { category:'Infrastructure', techs:['Kubernetes', 'Honeywell Forge', 'MQTT', 'Kafka'] },
  ];
  const tsEl = document.getElementById('techStack');
  if (tsEl) {
    tsEl.innerHTML = techStack.map(g => `
      <div>
        <div class="label-sm" style="margin-bottom:6px">${g.category}</div>
        <div class="tech-badges">
          ${g.techs.map(t => `<span class="tech-badge ${g.category.toLowerCase() === 'ml / ai' ? 'ml' : g.category.toLowerCase() === 'backend' ? 'backend' : g.category.toLowerCase() === 'frontend' ? 'frontend' : 'db'}">${t}</span>`).join('')}
        </div>
      </div>
    `).join('');
  }

  const perfEl = document.getElementById('modelPerf');
  const metrics = [
    { name:'Prediction Accuracy', val:'97.3%', color:'var(--success)' },
    { name:'False Alarm Rate', val:'2.1%', color:'var(--success)' },
    { name:'Avg. Early Warning', val:'8.4 min', color:'var(--info)' },
    { name:'Model Update Freq.', val:'Every 24h', color:'var(--warning)' },
    { name:'Training Samples', val:'532 transitions', color:'var(--text-secondary)' },
  ];
  if (perfEl) {
    perfEl.innerHTML = metrics.map(m => `
      <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-subtle)">
        <span style="font-size:0.8rem;color:var(--text-secondary)">${m.name}</span>
        <span style="font-family:'JetBrains Mono',monospace;font-size:0.8rem;font-weight:700;color:${m.color}">${m.val}</span>
      </div>
    `).join('');
  }
}

/* ── PRESENTATION PAGE ── */
let presInited = false;
function initPresentation() {
  if (presInited) return;
  presInited = true;

  const slides = [
    {
      n:'01', title:'The Problem',
      content:`<p style="margin-bottom:16px">Paper grade changes are among the most costly events in paper manufacturing. Each transition causes material waste, quality deviations, and production downtime.</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px">
        <div style="text-align:center;padding:16px;background:var(--danger-bg);border:1px solid var(--danger-border);border-radius:var(--radius-md)">
          <div style="font-size:1.8rem;font-weight:800;color:var(--danger);font-family:'JetBrains Mono',monospace">18 min</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">Average Stabilization</div>
        </div>
        <div style="text-align:center;padding:16px;background:var(--danger-bg);border:1px solid var(--danger-border);border-radius:var(--radius-md)">
          <div style="font-size:1.8rem;font-weight:800;color:var(--danger);font-family:'JetBrains Mono',monospace">₹42K</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">Loss Per Transition</div>
        </div>
        <div style="text-align:center;padding:16px;background:var(--danger-bg);border:1px solid var(--danger-border);border-radius:var(--radius-md)">
          <div style="font-size:1.8rem;font-weight:800;color:var(--danger);font-family:'JetBrains Mono',monospace">Reactive</div>
          <div style="font-size:0.75rem;color:var(--text-muted);margin-top:4px">Current Approach</div>
        </div>
      </div>`
    },
    {
      n:'02', title:'The Solution — IntelliGrade AI',
      content:`<p style="margin-bottom:16px">An AI-powered predictive intelligence system that warns operators 5–15 minutes before deviations occur, generating explainable recommendations backed by historical evidence.</p>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px">
        ${['🧠 LSTM + XGBoost Prediction', '🔍 SHAP Explainability', '🌐 Correlation Discovery', '🔬 Transition Simulator', '👤 Operator Feedback Loop', '📈 Continuous Learning'].map(f => `
          <div style="display:flex;align-items:center;gap:8px;padding:10px;background:var(--bg-elevated);border-radius:var(--radius-md)">
            <span style="font-size:1rem">${f.split(' ')[0]}</span>
            <span style="font-size:0.8rem;color:var(--text-secondary)">${f.split(' ').slice(1).join(' ')}</span>
          </div>
        `).join('')}
      </div>`
    },
    {
      n:'03', title:'Business Impact',
      content:`<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px">
        <div>
          <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:16px">Before IntelliGrade AI</div>
          ${[['18 min','Stabilization Time'],['₹42,000','Loss Per Transition'],['62%','Success Rate'],['Reactive','Operating Mode']].map(([v,l]) => `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-subtle)">
              <span style="color:var(--text-muted)">${l}</span>
              <span style="font-family:'JetBrains Mono',monospace;color:var(--danger);font-weight:700">${v}</span>
            </div>
          `).join('')}
        </div>
        <div>
          <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:var(--text-muted);margin-bottom:16px">With IntelliGrade AI</div>
          ${[['8 min','Stabilization Time'],['₹14,000','Loss Per Transition'],['92%','Success Rate'],['Predictive','Operating Mode']].map(([v,l]) => `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border-subtle)">
              <span style="color:var(--text-muted)">${l}</span>
              <span style="font-family:'JetBrains Mono',monospace;color:var(--success);font-weight:700">${v}</span>
            </div>
          `).join('')}
        </div>
      </div>
      <div style="text-align:center;margin-top:24px;padding:20px;background:var(--success-bg);border:1px solid var(--success-border);border-radius:var(--radius-lg)">
        <div style="font-size:2.5rem;font-weight:900;color:var(--success);font-family:'JetBrains Mono',monospace">₹4,82,000</div>
        <div style="font-size:0.875rem;color:var(--text-secondary);margin-top:4px">Projected Monthly Savings per Paper Machine</div>
      </div>`
    },
    {
      n:'04', title:'Unique Innovation — Transition Simulator',
      content:`<p style="margin-bottom:16px">Before any machine change is made, operators can test multiple scenarios in a digital twin and compare outcomes with zero real-world risk.</p>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:16px">
        ${SimScenarios.map(s => `
          <div style="padding:14px;background:var(--bg-elevated);border:1px solid ${s.best?'var(--success-border)':'var(--border-default)'};border-radius:var(--radius-md);text-align:center">
            <div style="width:28px;height:28px;background:${s.color};border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:0.8rem;font-weight:800;color:${s.id==='D'?'#000':'white'};margin:0 auto 8px">${s.id}</div>
            <div style="font-size:0.75rem;font-weight:600;color:var(--text-primary);margin-bottom:6px">${s.title}</div>
            <div style="font-family:'JetBrains Mono',monospace;font-size:0.85rem;font-weight:700;color:${s.best?'var(--success)':'var(--text-primary)'}">${s.stabTime}</div>
            <div style="font-size:0.65rem;color:var(--text-muted)">stabilization</div>
          </div>
        `).join('')}
      </div>`
    },
    {
      n:'05', title:'Future Scope',
      content:`<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:16px">
        ${[
          { icon:'🤖', title:'Auto-Apply Mode', desc:'AI automatically applies low-risk recommendations without operator intervention' },
          { icon:'🌐', title:'Multi-Machine Learning', desc:'Cross-machine learning from entire mill fleet for faster pattern recognition' },
          { icon:'📱', title:'Mobile Alerts', desc:'Push notifications on operator smartphones with one-tap approval' },
          { icon:'🔗', title:'ERP Integration', desc:'Connect to SAP/Oracle for real-time cost impact on production orders' },
          { icon:'🎙️', title:'Voice Assistant', desc:'Conversational AI for operators: "Why is basis weight deviating?"' },
          { icon:'🌍', title:'Cloud Analytics', desc:'Honeywell Forge integration for cross-plant benchmarking and insights' },
        ].map(f => `
          <div style="padding:16px;background:var(--bg-elevated);border:1px solid var(--border-default);border-radius:var(--radius-md)">
            <div style="font-size:1.2rem;margin-bottom:8px">${f.icon}</div>
            <div style="font-size:0.875rem;font-weight:700;color:var(--text-primary);margin-bottom:4px">${f.title}</div>
            <div style="font-size:0.78rem;color:var(--text-muted);line-height:1.4">${f.desc}</div>
          </div>
        `).join('')}
      </div>`
    }
  ];

  const el = document.getElementById('presentationSlides');
  if (el) {
    el.innerHTML = slides.map(s => `
      <div class="presentation-slide">
        <div class="slide-number">${s.n} / ${slides.length}</div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:var(--spacing-lg)">
          <div style="width:36px;height:36px;background:var(--hw-red);border-radius:var(--radius-sm);display:flex;align-items:center;justify-content:center;font-family:'JetBrains Mono',monospace;font-size:0.75rem;font-weight:700;color:white;box-shadow:0 0 12px rgba(204,0,0,0.3)">${s.n}</div>
          <h2 style="color:var(--text-primary)">${s.title}</h2>
        </div>
        ${s.content}
      </div>
    `).join('');
  }
}

/* ── SETTINGS PAGE ── */
let settingsInited = false;
function initSettings() {
  if (settingsInited) return;
  settingsInited = true;

  const el = document.getElementById('settingsContent');
  if (!el) return;
  el.innerHTML = `
    <div class="settings-section">
      <div class="settings-section-header">🧠 AI Configuration</div>
      <div class="settings-row">
        <div>
          <div class="settings-label">AI Mode</div>
          <div class="settings-desc">Select operating mode for the AI engine</div>
        </div>
        <select class="select-input">
          <option selected>Live (Production)</option>
          <option>Simulation</option>
          <option>Historical Replay</option>
        </select>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Prediction Sensitivity</div>
          <div class="settings-desc">Higher = more alerts, lower = fewer alerts</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <input type="range" class="range-input" min="1" max="10" value="7"/>
          <span class="mono" style="color:var(--text-secondary);font-size:0.8rem;width:20px">7</span>
        </div>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Alert Threshold (Basis Weight)</div>
          <div class="settings-desc">Minimum deviation to trigger alert</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <input type="range" class="range-input" min="1" max="20" value="5"/>
          <span class="mono" style="color:var(--text-secondary);font-size:0.8rem">±5 gsm</span>
        </div>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Confidence Limit</div>
          <div class="settings-desc">Minimum confidence to show recommendation</div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <input type="range" class="range-input" min="50" max="99" value="80"/>
          <span class="mono" style="color:var(--text-secondary);font-size:0.8rem">80%</span>
        </div>
      </div>
      <div class="settings-row">
        <div>
          <div class="settings-label">Auto-Apply Low-Risk Recommendations</div>
          <div class="settings-desc">AI can apply recommendations with >95% confidence automatically</div>
        </div>
        <div class="toggle" onclick="this.classList.toggle('active')">
          <div class="toggle-thumb"></div>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">🔔 Notifications</div>
      <div class="settings-row">
        <div><div class="settings-label">Email Alerts</div><div class="settings-desc">Send email on critical predictions</div></div>
        <div class="toggle active" onclick="this.classList.toggle('active')"><div class="toggle-thumb"></div></div>
      </div>
      <div class="settings-row">
        <div><div class="settings-label">SMS Alerts</div><div class="settings-desc">Critical alerts via SMS to registered numbers</div></div>
        <div class="toggle" onclick="this.classList.toggle('active')"><div class="toggle-thumb"></div></div>
      </div>
      <div class="settings-row">
        <div><div class="settings-label">Sound Alerts</div><div class="settings-desc">Audible alarm for critical predictions</div></div>
        <div class="toggle active" onclick="this.classList.toggle('active')"><div class="toggle-thumb"></div></div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-header">🎨 Display</div>
      <div class="settings-row">
        <div><div class="settings-label">Theme</div></div>
        <select class="select-input"><option selected>Dark (Default)</option><option>Light</option><option>High Contrast</option></select>
      </div>
      <div class="settings-row">
        <div><div class="settings-label">Language</div></div>
        <select class="select-input"><option selected>English</option><option>Hindi</option><option>Tamil</option></select>
      </div>
      <div class="settings-row">
        <div><div class="settings-label">Data Refresh Rate</div></div>
        <select class="select-input"><option>1 second</option><option selected>2 seconds</option><option>5 seconds</option></select>
      </div>
    </div>

    <div style="display:flex;gap:10px;margin-top:var(--spacing-lg)">
      <button class="btn btn-primary" onclick="alert('Settings saved successfully!')">💾 Save Settings</button>
      <button class="btn btn-secondary" onclick="alert('Settings reset to defaults!')">↺ Reset Defaults</button>
    </div>
  `;

  // Range input live feedback
  el.querySelectorAll('input[type=range]').forEach(r => {
    r.addEventListener('input', function() {
      const sibling = this.nextElementSibling;
      if (sibling) {
        if (this.max === '10') sibling.textContent = this.value;
        else if (this.max === '20') sibling.textContent = `±${this.value} gsm`;
        else if (this.max === '99') sibling.textContent = this.value + '%';
      }
    });
  });
}

/* ── ALARMS PANEL ── */
function initAlarmPanel() {
  const el = document.getElementById('alarmList');
  if (!el) return;
  el.innerHTML = Alarms.map(a => `
    <div class="alarm-item ${a.type} ${a.active ? '' : 'resolved'}">
      <div class="alarm-item-header">
        <span class="alarm-type-badge ${a.type === 'ai' ? 'ai' : a.type}">${a.type.toUpperCase()}</span>
        ${a.active ? '<span style="font-size:0.65rem;color:var(--danger);margin-left:auto;animation:alarmBlink 1s ease-in-out infinite">● ACTIVE</span>' : ''}
      </div>
      <div class="alarm-item-msg">${a.msg}</div>
      <div class="alarm-item-time">${a.time}</div>
    </div>
  `).join('');
}

/* ── BOOT ── */
function init() {
  window._simState = SimState; // Expose for training module sensor tiles
  initLandingCanvas();
  initDashboard();
  initAlarmPanel();
  startSimulation();
}

init();
