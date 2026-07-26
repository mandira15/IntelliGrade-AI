/* ===================== TRAINING PAGE — AI Operator Training & Decision Challenge ===================== */

/* ── Module-level state ── */
let trainingInited  = false;
let trainingSimInterval = null;
let countdownInterval   = null;
let trainingCountdown   = 5;        // minutes

const TrainingState = {
  selectedDecision: null,
  submitted: false,
};

/* ── Mission steps (reset on each new session) ── */
function freshMissionSteps() {
  return [
    { id: 'risk',    name: 'Risk Identified',             desc: 'AI detected deviation risk',            status: 'done',    time: '01:09:18' },
    { id: 'submit',  name: 'Operator Decision Submitted', desc: 'Your corrective action recorded',       status: 'pending', time: '' },
    { id: 'ai',      name: 'AI Recommendation Generated', desc: 'LSTM + XGBoost analysis complete',      status: 'pending', time: '' },
    { id: 'explain', name: 'Decision Explained',          desc: 'SHAP explainability applied',           status: 'pending', time: '' },
    { id: 'stable',  name: 'Transition Stabilized',       desc: 'Basis Weight within ±2 gsm of target', status: 'pending', time: '' },
    { id: 'quality', name: 'Quality Verified',            desc: 'Scanner confirms GSM 160 achieved',     status: 'pending', time: '' },
    { id: 'report',  name: 'Report Generated',            desc: 'Transition intelligence report ready',  status: 'pending', time: '' },
  ];
}
let missionSteps = freshMissionSteps();

/* ── Static data ── */
const DECISION_OPTIONS = [
  { id: 'reduce_steam',   icon: '🔥', title: 'Reduce Steam Pressure',    desc: 'Lower from 8.5 to 7.9 bar to counteract rising sheet density',           isCorrect: true  },
  { id: 'increase_speed', icon: '⚡', title: 'Increase Machine Speed',    desc: 'Raise from 680 to 705 m/min to improve draw ratio balance',             isCorrect: false },
  { id: 'reduce_stock',   icon: '💧', title: 'Reduce Stock Flow',         desc: 'Lower from 1240 to 1180 L/min to rebalance sheet formation',            isCorrect: false },
  { id: 'increase_dryer', icon: '🌡️', title: 'Increase Dryer Temperature',desc: 'Raise dryer cylinder temperature to assist moisture reduction',         isCorrect: false },
  { id: 'wait',           icon: '⏳', title: 'Wait and Observe',          desc: 'Continue monitoring without intervention for the next 2 minutes',        isCorrect: false },
];

const XAI_POINTS = [
  'Steam Pressure contributed <strong style="color:var(--hw-red)">72%</strong> to the predicted Basis Weight deviation — highest SHAP value among all variables.',
  'Historical transitions with similar conditions achieved faster stabilization after reducing steam pressure in <strong style="color:var(--success)">89% of 63 matched cases</strong>.',
  'Machine speed is already within <strong style="color:var(--success)">optimal operating limits</strong> (680 m/min ± 3%). Speed adjustment would cause secondary oscillation.',
  'Current moisture trend indicates <strong style="color:var(--warning)">increasing paper density</strong>, consistent with elevated steam pressure pattern.',
  'This recommendation complies with <strong style="color:var(--info)">Recipe R-120-160 operating constraints</strong> and Honeywell MPC safety limits.',
];

const INFERENCE_SOURCES = [
  { label: '📊 Historical Transition DB', active: true  },
  { label: '🔧 Recipe Constraints',       active: true  },
  { label: '👤 Operator Action History',  active: false },
  { label: '📈 Sensor Trends',            active: true  },
  { label: '🌐 Correlation Engine',       active: true  },
  { label: '🤖 Learning Feedback',        active: false },
];

const GAUGE_KPIS = [
  { label: 'Decision Accuracy',     value: 78, circ: 163.36, color: '#CC0000', display: '78%'  },
  { label: 'AI Agreement Rate',     value: 85, circ: 163.36, color: '#00D68F', display: '85%'  },
  { label: 'Avg Response Time',     value: 62, circ: 163.36, color: '#2D9CDB', display: '4.2m' },
  { label: 'Correct This Session',  value: 83, circ: 163.36, color: '#FFB020', display: '5/6'  },
  { label: 'Improvement Trend',     value: 92, circ: 163.36, color: '#00D68F', display: '+12%' },
];

const SENSORS = [
  { key: 'steamPressure', name: 'Steam Pressure', unit: 'bar',   dp: 2, status: 'danger'  },
  { key: 'machineSpeed',  name: 'Speed',          unit: 'm/min', dp: 0, status: 'normal'  },
  { key: 'stockFlow',     name: 'Stock Flow',     unit: 'L/min', dp: 0, status: 'normal'  },
  { key: 'fillerFlow',    name: 'Filler Flow',    unit: 'kg/hr', dp: 1, status: 'normal'  },
  { key: 'moisture',      name: 'Moisture',       unit: '%',     dp: 2, status: 'warning' },
  { key: 'ash',           name: 'Ash Content',    unit: '%',     dp: 2, status: 'normal'  },
  { key: 'caliper',       name: 'Caliper',        unit: 'µm',    dp: 1, status: 'normal'  },
  { key: 'basisWeight',   name: 'Basis Weight',   unit: 'gsm',   dp: 1, status: 'warning' },
];

const DEFAULTS = { steamPressure:8.5, machineSpeed:685, stockFlow:1240, fillerFlow:340, moisture:5.2, ash:18.4, caliper:148, basisWeight:123.8 };

/* ════════════════════════════════════════
   MAIN ENTRY POINT
════════════════════════════════════════ */
export function initTraining() {
  // Always do a full reset before building
  clearInterval(trainingSimInterval);
  clearInterval(countdownInterval);
  if (window._trainingChart) {
    try { window._trainingChart.dispose(); } catch(e) {}
    window._trainingChart = null;
  }

  TrainingState.selectedDecision = null;
  TrainingState.submitted        = false;
  trainingCountdown              = 5;
  missionSteps                   = freshMissionSteps();
  trainingInited                 = true;

  const page = document.getElementById('page-training');
  if (!page) return;

  page.innerHTML = buildPage();
  bindGlobalHandlers();
  setSessionTime();
  setTimeout(animateGauges, 700);
  setTimeout(initTrendChart, 500);
  startSensorUpdates();
  startCountdown();
}

/* ════════════════════════════════════════
   HTML BUILDERS
════════════════════════════════════════ */
function buildPage() {
  return `
<div class="training-page">

  <!-- ── Header ── -->
  <div class="page-header" style="margin-bottom:0">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div>
        <h2>AI Operator Training &amp; Decision Challenge</h2>
        <p>Benchmark your decisions against AI recommendations during a live GSM 120 → 160 grade transition</p>
      </div>
      <div style="display:flex;gap:10px;align-items:center">
        <div style="padding:6px 14px;background:var(--success-bg);border:1px solid var(--success-border);border-radius:var(--radius-full);font-size:0.75rem;font-weight:600;color:var(--success);display:flex;align-items:center;gap:6px">
          <div class="status-dot"></div> Live Session Active
        </div>
        <button class="btn btn-secondary btn-sm" onclick="window._trReset()">↺ New Scenario</button>
      </div>
    </div>
  </div>

  <!-- ── Main Split ── -->
  <div class="training-split">

    <!-- ════ LEFT: YOUR DECISION ════ -->
    <div class="training-panel">
      <div class="training-panel-header">
        <div class="training-panel-title">Your Decision</div>
        <div style="display:flex;align-items:center;gap:6px">
          <div class="ai-pulse"></div>
          <span style="font-size:0.72rem;color:var(--text-muted)">PM-3 Live</span>
        </div>
      </div>
      <div class="training-panel-body">

        <!-- Situation Card -->
        <div class="situation-card">
          <div style="font-size:0.7rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--hw-red);margin-bottom:12px">⚡ Current Situation</div>
          <div class="situation-grid">
            <div class="situation-item">
              <div class="situation-label">Current Grade</div>
              <div class="situation-value">GSM 120</div>
            </div>
            <div class="situation-item">
              <div class="situation-label">Target Grade</div>
              <div class="situation-value">GSM 160</div>
            </div>
            <div class="situation-item">
              <div class="situation-label">Current Basis Weight</div>
              <div class="situation-value warning" id="tr-bw">157.8 gsm</div>
            </div>
            <div class="situation-item">
              <div class="situation-label">Deviation from Target</div>
              <div class="situation-value danger" id="tr-dev">+2.2 gsm ↑</div>
            </div>
          </div>
          <div class="risk-banner medium" id="riskBanner">
            <span class="risk-label">Risk Level</span>
            <span class="risk-level-text medium" id="riskLevelText">MEDIUM</span>
          </div>
          <div class="countdown-strip">
            <div class="countdown-dot"></div>
            <div class="countdown-text">
              Time until predicted deviation: <span class="countdown-value" id="countdownVal">5 min</span>
            </div>
          </div>
        </div>

        <!-- Sensor Strip -->
        <div style="font-size:0.68rem;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:var(--text-muted);margin-bottom:8px">Live Process Variables</div>
        <div class="sensor-strip">${buildSensorStrip()}</div>

        <!-- Decision Question -->
        <div class="decision-question">
          <div class="decision-question-text">Based on the current process conditions, what corrective action would you take?</div>
          <div class="decision-question-sub">Select the action you believe will prevent Basis Weight deviation during this transition.</div>
        </div>

        <!-- Decision Cards -->
        <div class="decision-cards" id="tr-decisionCards">${buildDecisionCards()}</div>

        <!-- Submit -->
        <button class="submit-decision-btn" id="tr-submitBtn" onclick="window._trSubmit()" disabled>
          <span class="tr-btn-icon">📤</span>
          <span class="tr-btn-text">Submit Decision</span>
        </button>

      </div>
    </div>

    <!-- ════ RIGHT: AI ANALYSIS ════ -->
    <div class="training-panel">
      <div class="training-panel-header">
        <div class="training-panel-title">AI Analysis</div>
        <span class="badge badge-red" id="tr-aiBadge" style="opacity:0.5">🔒 Locked</span>
      </div>
      <div class="training-panel-body" id="tr-aiBody">

        <!-- Locked -->
        <div class="ai-panel-locked" id="tr-locked" style="transition:opacity 0.3s ease">
          <div class="lock-icon">🔒</div>
          <div class="lock-title">Awaiting Your Decision</div>
          <div class="lock-sub">Submit your corrective action to unlock the AI analysis, recommendation, and explainability report.</div>
        </div>

        <!-- Thinking -->
        <div class="ai-thinking" id="tr-thinking" style="display:none">
          <div class="thinking-ring"></div>
          <div class="thinking-dots">
            <div class="thinking-dot"></div>
            <div class="thinking-dot"></div>
            <div class="thinking-dot"></div>
          </div>
          <div class="thinking-text">AI processing 532 historical transitions…</div>
        </div>

        <!-- Analysis (hidden until reveal) -->
        <div id="tr-analysis" style="display:none;opacity:0;transform:translateY(16px);transition:opacity 0.5s ease,transform 0.5s ease">

          <!-- Decision Comparison -->
          <div id="tr-decCompare" style="margin-bottom:18px"></div>

          <!-- AI Metrics -->
          <div class="ai-metrics-row" style="margin-bottom:18px">
            <div class="ai-metric-tile">
              <div class="ai-metric-tile-value green">97%</div>
              <div class="ai-metric-tile-label">AI Confidence</div>
            </div>
            <div class="ai-metric-tile">
              <div class="ai-metric-tile-value red">3.8 min</div>
              <div class="ai-metric-tile-label">Stab. Time</div>
            </div>
            <div class="ai-metric-tile">
              <div class="ai-metric-tile-value yellow">38%</div>
              <div class="ai-metric-tile-label">Waste Reduction</div>
            </div>
          </div>

          <!-- XAI -->
          <div class="xai-explanation-title">🔍 Why Did AI Choose This Recommendation?</div>
          <div class="xai-cards-list" id="tr-xaiList">${buildXAICards()}</div>

          <!-- Inference Sources -->
          <div class="inference-title" style="margin-bottom:8px">Inference Sources</div>
          <div class="inference-chips" style="margin-bottom:16px">
            ${INFERENCE_SOURCES.map(s => `<div class="inference-chip-sm ${s.active ? 'active' : ''}">${s.label}</div>`).join('')}
          </div>

          <!-- Similarity Ring -->
          <div class="similarity-card" style="margin-bottom:14px">
            <div class="similarity-ring-wrap">
              <svg width="60" height="60" viewBox="0 0 60 60">
                <circle class="sim-ring-bg" cx="30" cy="30" r="26"/>
                <circle class="sim-ring-fill" id="tr-simFill" cx="30" cy="30" r="26" stroke="#FFB020"/>
              </svg>
              <div class="similarity-ring-text" id="tr-simText">0%</div>
            </div>
            <div class="similarity-info">
              <div class="similarity-title">Decision Comparison</div>
              <div class="similarity-desc" id="tr-simDesc">Your decision is being evaluated against the AI recommendation…</div>
            </div>
          </div>

          <!-- Insight Panel -->
          <div class="insight-panel">
            <div class="insight-header" id="tr-insightHeader">
              <div class="insight-header-left">💡 AI Learning Insight</div>
              <span class="insight-chevron open" id="tr-chevron">▼</span>
            </div>
            <div class="insight-body open" id="tr-insightBody">
              <div class="insight-text">
                "Across 524 historical grade transitions from GSM 120→160, steam pressure instability was responsible for approximately 69% of Basis Weight deviations. Transitions that reduced steam pressure <em>before</em> adjusting machine speed achieved stabilization in an average of 3.8 minutes, compared to 8.2 minutes for speed-first approaches. This pattern has been consistently validated across 4 paper machines at this facility."
              </div>
            </div>
          </div>

        </div><!-- end tr-analysis -->
      </div>
    </div>

  </div><!-- end training-split -->

  <!-- ── Gauges Section ── -->
  <div class="training-hr"></div>
  <div class="training-section-heading">
    <div class="training-section-title">Operator Decision Excellence</div>
    <div style="font-size:0.75rem;color:var(--text-muted)">Session started <span id="tr-sessionTime">--:--</span></div>
  </div>
  <div class="kpi-gauges-grid">${buildGauges()}</div>

  <div class="training-hr"></div>

  <!-- ── Mission + Trend ── -->
  <div class="performance-section">
    <div class="mission-timeline-card">
      <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;letter-spacing:0.12em;color:var(--text-muted);margin-bottom:16px;display:flex;align-items:center;gap:8px">
        <span style="width:3px;height:12px;background:var(--hw-red);border-radius:2px;display:inline-block"></span>
        Mission Progress
      </div>
      <div class="mission-steps" id="tr-missionSteps">${buildMissionSteps()}</div>
    </div>
    <div class="training-panel" style="border-radius:var(--radius-lg)">
      <div class="training-panel-header">
        <div class="training-panel-title">Decision Accuracy Trend</div>
        <span class="badge badge-success">Improving</span>
      </div>
      <div class="training-panel-body" style="padding:16px">
        <div id="tr-trendChart" style="width:100%;height:200px"></div>
      </div>
    </div>
  </div>

  <div class="training-hr"></div>

  <!-- ── Excellence Card ── -->
  <div class="excellence-card" id="tr-excellence" style="display:none;opacity:0;transform:translateY(20px);transition:opacity 0.6s ease,transform 0.6s ease">
    <div class="excellence-inner">
      <div class="excellence-score-ring">
        <svg width="120" height="120" viewBox="0 0 120 120">
          <circle class="ex-ring-bg" cx="60" cy="60" r="54"/>
          <circle class="ex-ring-fill" id="tr-exFill" cx="60" cy="60" r="54"/>
        </svg>
        <div class="excellence-score-text">
          <div class="ex-score-num" id="tr-exScore">0</div>
          <div class="ex-score-grade">A+</div>
        </div>
      </div>
      <div class="excellence-details">
        <div class="excellence-title">Transition Excellence Score</div>
        <div class="excellence-subtitle">GSM 120 → GSM 160 &nbsp;•&nbsp; Session Performance &nbsp;•&nbsp; PM-3</div>
        <div class="excellence-kpis">
          <div class="ex-kpi"><div class="ex-kpi-val">₹23.8K</div><div class="ex-kpi-label">Estimated Savings</div></div>
          <div class="ex-kpi"><div class="ex-kpi-val">38%</div><div class="ex-kpi-label">Material Waste Reduction</div></div>
          <div class="ex-kpi"><div class="ex-kpi-val">12%</div><div class="ex-kpi-label">Energy Saved</div></div>
          <div class="ex-kpi"><div class="ex-kpi-val">−9.2m</div><div class="ex-kpi-label">Stab. Time Improvement</div></div>
          <div class="ex-kpi"><div class="ex-kpi-val">98%</div><div class="ex-kpi-label">Process Health</div></div>
        </div>
      </div>
    </div>
  </div>

</div>
  `;
}

function buildSensorStrip() {
  return SENSORS.map(s => {
    const val = (window._simState?.vars?.[s.key] ?? DEFAULTS[s.key]);
    const v   = Number(val).toFixed(s.dp);
    return `
      <div class="sensor-tile ${s.status}" id="tr-tile-${s.key}">
        <div class="sensor-tile-top">
          <div class="sensor-tile-name">${s.name}</div>
          <div class="sensor-status-dot ${s.status}" id="tr-dot-${s.key}"></div>
        </div>
        <div class="sensor-tile-value ${s.status}" id="tr-sv-${s.key}">${v}</div>
        <div class="sensor-tile-unit">${s.unit}</div>
      </div>
    `;
  }).join('');
}

function buildDecisionCards() {
  return DECISION_OPTIONS.map(opt => `
    <div class="decision-card-opt" id="tr-dopt-${opt.id}" onclick="window._trSelect('${opt.id}',this)">
      <div class="decision-opt-indicator" id="tr-dind-${opt.id}"></div>
      <div class="decision-opt-icon">${opt.icon}</div>
      <div class="decision-opt-content">
        <div class="decision-opt-title">${opt.title}</div>
        <div class="decision-opt-desc">${opt.desc}</div>
      </div>
    </div>
  `).join('');
}

function buildXAICards() {
  return XAI_POINTS.map((p, i) => `
    <div class="xai-card-item" id="tr-xai-${i}" style="opacity:0;transform:translateX(-12px);transition:opacity 0.4s ease ${0.3+i*0.12}s,transform 0.4s ease ${0.3+i*0.12}s">
      <div class="xai-num">${i+1}</div>
      <div>${p}</div>
    </div>
  `).join('');
}

function buildGauges() {
  const R = 26, C = 2 * Math.PI * R;
  return GAUGE_KPIS.map((g, i) => `
    <div class="gauge-card">
      <div class="gauge-ring-wrap">
        <svg width="64" height="64" viewBox="0 0 64 64">
          <circle class="gauge-bg" cx="32" cy="32" r="${R}"/>
          <circle class="gauge-fill" id="tr-gf-${i}" cx="32" cy="32" r="${R}"
            stroke="${g.color}" style="stroke-dasharray:${C.toFixed(2)};stroke-dashoffset:${C.toFixed(2)}"/>
        </svg>
        <div class="gauge-center-text">
          <div class="gauge-value" id="tr-gv-${i}">0</div>
        </div>
      </div>
      <div class="gauge-label">${g.label}</div>
    </div>
  `).join('');
}

function buildMissionSteps() {
  return missionSteps.map(s => {
    const done    = s.status === 'done';
    const pending = s.status === 'pending';
    return `
      <div class="mission-step" id="tr-ms-${s.id}">
        <div class="mission-step-dot ${s.status}" id="tr-msdot-${s.id}">${done ? '✓' : ''}</div>
        <div class="mission-step-info">
          <div class="mission-step-name ${done ? 'done' : pending ? 'pending' : ''}" id="tr-msname-${s.id}">${s.name}</div>
          <div class="mission-step-desc">${s.desc}</div>
        </div>
        <div class="mission-step-time" id="tr-mstime-${s.id}">${s.time}</div>
      </div>
    `;
  }).join('');
}

/* ════════════════════════════════════════
   EVENT HANDLERS (window-exposed, prefixed _tr)
════════════════════════════════════════ */
function bindGlobalHandlers() {

  /* Select a decision card */
  window._trSelect = function(id, el) {
    if (TrainingState.submitted) return;
    // Clear previous selection
    document.querySelectorAll('.decision-card-opt').forEach(c => {
      c.classList.remove('selected');
    });
    document.querySelectorAll('[id^="tr-dind-"]').forEach(ind => {
      ind.textContent = '';
    });
    // Apply new selection
    el.classList.add('selected');
    TrainingState.selectedDecision = id;
    const ind = document.getElementById('tr-dind-' + id);
    if (ind) ind.textContent = '✓';
    // Enable submit
    const btn = document.getElementById('tr-submitBtn');
    if (btn) btn.disabled = false;
  };

  /* Submit decision */
  window._trSubmit = function() {
    if (!TrainingState.selectedDecision || TrainingState.submitted) return;
    TrainingState.submitted = true;

    // Lock cards
    document.querySelectorAll('.decision-card-opt').forEach(c => c.classList.add('disabled'));

    // Update button
    const btn = document.getElementById('tr-submitBtn');
    if (btn) {
      btn.disabled = true;
      btn.classList.add('submitted');
      const icon = btn.querySelector('.tr-btn-icon');
      const txt  = btn.querySelector('.tr-btn-text');
      if (icon) icon.textContent = '✓';
      if (txt)  txt.textContent  = 'Decision Submitted';
    }

    // Advance mission: submit
    advanceMissionStep('submit');

    // Show thinking then reveal
    showThinking();
    setTimeout(revealAnalysis, 2400);
  };

  /* Reset session */
  window._trReset = function() {
    initTraining();
  };

  /* Toggle insight panel */
  window._trToggleInsight = function() {
    const body    = document.getElementById('tr-insightBody');
    const chevron = document.getElementById('tr-chevron');
    if (body)    body.classList.toggle('open');
    if (chevron) chevron.classList.toggle('open');
  };
}

/* ════════════════════════════════════════
   AI ANALYSIS REVEAL SEQUENCE
════════════════════════════════════════ */
function showThinking() {
  const locked   = document.getElementById('tr-locked');
  const thinking = document.getElementById('tr-thinking');
  const badge    = document.getElementById('tr-aiBadge');

  if (locked) {
    locked.style.opacity = '0';
    setTimeout(() => { locked.style.display = 'none'; }, 350);
  }
  setTimeout(() => {
    if (thinking) thinking.style.display = 'flex';
  }, 380);
  if (badge) { badge.textContent = '🔄 Analyzing'; badge.style.opacity = '1'; badge.className = 'badge badge-warning'; }
}

function revealAnalysis() {
  const thinking = document.getElementById('tr-thinking');
  const analysis = document.getElementById('tr-analysis');
  const badge    = document.getElementById('tr-aiBadge');

  if (thinking) thinking.style.display = 'none';
  if (badge)    { badge.textContent = '✓ Analysis Ready'; badge.className = 'badge badge-success'; }

  // Fill comparison
  fillDecisionComparison();

  // Show analysis with transition
  if (analysis) {
    analysis.style.display = 'block';
    // Force reflow before applying transition
    void analysis.offsetWidth;
    analysis.style.opacity   = '1';
    analysis.style.transform = 'translateY(0)';
  }

  // Stagger XAI cards into view
  XAI_POINTS.forEach((_, i) => {
    setTimeout(() => {
      const el = document.getElementById('tr-xai-' + i);
      if (el) { el.style.opacity = '1'; el.style.transform = 'translateX(0)'; }
    }, 300 + i * 130);
  });

  // Similarity ring
  setTimeout(animateSimilarityRing, 600);

  // Mission step cascade
  [['ai', 300], ['explain', 1100], ['stable', 3800], ['quality', 6500], ['report', 8800]]
    .forEach(([id, delay]) => setTimeout(() => advanceMissionStep(id), delay));

  // Excellence card
  setTimeout(showExcellenceCard, 2800);
}

function fillDecisionComparison() {
  const chosen    = DECISION_OPTIONS.find(d => d.id === TrainingState.selectedDecision);
  const el        = document.getElementById('tr-decCompare');
  if (!el || !chosen) return;
  const isCorrect = chosen.isCorrect;

  el.innerHTML = `
    <div class="decision-comparison-header">
      <div class="dec-box yours">
        <div class="dec-box-label">Your Decision</div>
        <div class="dec-box-action">${chosen.icon} ${chosen.title}</div>
        <div class="dec-box-detail">${isCorrect ? '✅ Matches AI Recommendation' : '⚠ Differs from AI Recommendation'}</div>
      </div>
      <div class="vs-divider"><div class="vs-circle">VS</div></div>
      <div class="dec-box ai">
        <div class="dec-box-label">AI Recommended Action</div>
        <div class="dec-box-action">🔥 Reduce Steam Pressure</div>
        <div class="dec-box-detail">8.5 bar → 7.9 bar &nbsp;•&nbsp; Confidence 97%</div>
      </div>
    </div>
  `;
}

function animateSimilarityRing() {
  const id     = TrainingState.selectedDecision;
  const chosen = DECISION_OPTIONS.find(d => d.id === id);
  if (!chosen) return;

  const score = chosen.isCorrect ? 97
              : id === 'increase_speed' ? 78
              : id === 'reduce_stock'   ? 61
              : 34;
  const color = score >= 80 ? '#00D68F' : score >= 60 ? '#FFB020' : '#FF4040';
  const R     = 26, C = 2 * Math.PI * R;
  const offset = C - (score / 100) * C;

  const fill = document.getElementById('tr-simFill');
  const text = document.getElementById('tr-simText');
  const desc = document.getElementById('tr-simDesc');

  if (fill) {
    fill.style.stroke          = color;
    fill.style.strokeDasharray = C.toFixed(2);
    fill.style.strokeDashoffset = offset.toFixed(2);
    fill.style.filter          = `drop-shadow(0 0 4px ${color})`;
    fill.style.transition      = 'stroke-dashoffset 1.2s ease 0.2s';
  }

  // Counter animation
  if (text) {
    let count = 0;
    const iv = setInterval(() => {
      count = Math.min(count + 2, score);
      text.textContent = count + '%';
      if (count >= score) clearInterval(iv);
    }, 18);
  }

  if (desc) {
    desc.textContent = chosen.isCorrect
      ? '✅ Perfect match! Your decision aligns exactly with the AI recommendation. Steam pressure reduction is the optimal corrective action for this transition pattern.'
      : 'Your decision partially aligns with the AI recommendation. Both target process stabilization — reducing steam pressure directly addresses the root cause (72% SHAP contribution).';
  }
}

/* ════════════════════════════════════════
   MISSION STEPS
════════════════════════════════════════ */
function advanceMissionStep(id) {
  const step = missionSteps.find(s => s.id === id);
  if (!step || step.status === 'done') return;
  step.status = 'done';
  step.time   = new Date().toLocaleTimeString('en-IN', { hour12:false, hour:'2-digit', minute:'2-digit', second:'2-digit' });

  const dot  = document.getElementById('tr-msdot-'  + id);
  const name = document.getElementById('tr-msname-' + id);
  const time = document.getElementById('tr-mstime-' + id);

  if (dot)  { dot.className = 'mission-step-dot done'; dot.textContent = '✓'; }
  if (name) { name.className = 'mission-step-name done'; }
  if (time) { time.textContent = step.time; }
}

/* ════════════════════════════════════════
   GAUGE ANIMATIONS
════════════════════════════════════════ */
function animateGauges() {
  const R = 26, C = 2 * Math.PI * R;
  GAUGE_KPIS.forEach((g, i) => {
    setTimeout(() => {
      const fill  = document.getElementById('tr-gf-' + i);
      const valEl = document.getElementById('tr-gv-' + i);
      const targetOffset = C - (g.value / 100) * C;

      if (fill) {
        fill.style.transition      = 'stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)';
        fill.style.strokeDashoffset = targetOffset.toFixed(2);
      }

      // Animate displayed value
      if (valEl) {
        let count = 0;
        const end  = g.value;
        const step = Math.max(1, Math.ceil(end / 50));
        const iv = setInterval(() => {
          count = Math.min(count + step, end);
          valEl.textContent = g.display.includes('%')  ? count + '%'
                            : g.display.includes('/')  ? Math.round(count/100*5) + '/6'
                            : g.display.includes('+')  ? '+' + count + '%'
                            : g.display.includes('m')  ? (count/100 * 4.2).toFixed(1) + 'm'
                            : g.display;
          if (count >= end) {
            valEl.textContent = g.display;
            clearInterval(iv);
          }
        }, 28);
      }
    }, i * 140);
  });
}

/* ════════════════════════════════════════
   EXCELLENCE CARD
════════════════════════════════════════ */
function showExcellenceCard() {
  const card = document.getElementById('tr-excellence');
  if (!card) return;
  card.style.display = 'block';
  void card.offsetWidth; // force reflow
  card.style.opacity   = '1';
  card.style.transform = 'translateY(0)';

  setTimeout(() => {
    const fill  = document.getElementById('tr-exFill');
    const numEl = document.getElementById('tr-exScore');
    const C     = 2 * Math.PI * 54;
    const score = 94;
    const offset = C - (score / 100) * C;

    if (fill) {
      fill.style.transition      = 'stroke-dashoffset 2s cubic-bezier(0.4,0,0.2,1)';
      fill.style.strokeDashoffset = offset.toFixed(2);
    }
    if (numEl) {
      let count = 0;
      const iv = setInterval(() => {
        count = Math.min(count + 2, score);
        numEl.textContent = count;
        if (count >= score) clearInterval(iv);
      }, 22);
    }
  }, 300);
}

/* ════════════════════════════════════════
   TREND CHART (ECharts)
════════════════════════════════════════ */
function initTrendChart() {
  const el = document.getElementById('tr-trendChart');
  if (!el) return;

  // Destroy old instance if any
  if (window._trainingChart) {
    try { window._trainingChart.dispose(); } catch(e) {}
    window._trainingChart = null;
  }

  window._trainingChart = echarts.init(el, null, { renderer: 'canvas' });
  const sessions       = ['S1','S2','S3','S4','S5','S6','S7','S8','Today'];
  const yourAccuracy   = [52, 61, 58, 67, 72, 75, 74, 80, 78];
  const aiAgreement    = [70, 72, 74, 78, 80, 82, 84, 85, 85];

  window._trainingChart.setOption({
    backgroundColor: 'transparent',
    legend: { top: 4, right: 4, textStyle: { color: '#7A7F96', fontSize: 10 }, itemWidth: 12 },
    grid: { left: 36, right: 16, top: 34, bottom: 28 },
    xAxis: {
      type: 'category', data: sessions,
      axisLine: { lineStyle: { color: 'rgba(255,255,255,0.08)' } },
      axisLabel: { color: '#4A4F66', fontSize: 10 },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value', min: 40, max: 100,
      axisLabel: { color: '#4A4F66', fontSize: 10, formatter: v => v + '%' },
      splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
      axisLine: { show: false }
    },
    series: [
      {
        name: 'Your Accuracy', type: 'line', data: yourAccuracy, smooth: true,
        lineStyle: { color: '#CC0000', width: 2 },
        itemStyle: { color: '#CC0000' }, symbol: 'circle', symbolSize: 5,
        areaStyle: { color: { type:'linear',x:0,y:0,x2:0,y2:1,
          colorStops:[{offset:0,color:'rgba(204,0,0,0.14)'},{offset:1,color:'transparent'}] } }
      },
      {
        name: 'AI Agreement', type: 'line', data: aiAgreement, smooth: true,
        lineStyle: { color: '#00D68F', width: 2, type:'dashed' },
        itemStyle: { color: '#00D68F' }, symbol: 'circle', symbolSize: 4
      }
    ],
    tooltip: {
      trigger: 'axis', backgroundColor: '#1A1F2E',
      borderColor: 'rgba(255,255,255,0.07)',
      textStyle: { color: '#F0F2F8', fontSize: 11 },
      formatter: p => `${p[0].name}<br/>${p.map(s => `<span style="color:${s.color}">●</span> ${s.seriesName}: <b>${s.value}%</b>`).join('<br/>')}`
    }
  });
}

/* ════════════════════════════════════════
   LIVE SENSOR UPDATES
════════════════════════════════════════ */
function startSensorUpdates() {
  updateSensors(); // immediate first paint
  trainingSimInterval = setInterval(updateSensors, 2000);
}

function updateSensors() {
  if (!window._simState?.vars) return;
  const vars = window._simState.vars;

  SENSORS.forEach(s => {
    const v   = Number(vars[s.key] ?? DEFAULTS[s.key]);
    const el  = document.getElementById('tr-sv-' + s.key);
    const dot = document.getElementById('tr-dot-' + s.key);
    const tile = document.getElementById('tr-tile-' + s.key);
    if (!el) return;
    el.textContent = v.toFixed(s.dp);

    // Dynamic status for steam pressure
    if (s.key === 'steamPressure') {
      const st = v > 9.0 ? 'danger' : v > 8.8 ? 'warning' : 'normal';
      el.className = `sensor-tile-value ${st}`;
      if (dot)  dot.className  = `sensor-status-dot ${st}`;
      if (tile) tile.className = `sensor-tile ${st}`;
    }
  });

  // Update situation card
  const bw  = vars.basisWeight ?? 123.8;
  const dev = (bw - 120).toFixed(1);
  const bwEl  = document.getElementById('tr-bw');
  const devEl = document.getElementById('tr-dev');
  if (bwEl)  bwEl.textContent = bw.toFixed(1) + ' gsm';
  if (devEl) devEl.textContent = '+' + dev + ' gsm ↑';

  // Update risk banner based on steam pressure
  const sp = vars.steamPressure ?? 8.5;
  const banner  = document.getElementById('riskBanner');
  const riskTxt = document.getElementById('riskLevelText');
  const isHigh  = sp > 9.2;
  if (banner)  banner.className  = `risk-banner ${isHigh ? 'high' : 'medium'}`;
  if (riskTxt) { riskTxt.textContent = isHigh ? 'HIGH' : 'MEDIUM'; riskTxt.className = `risk-level-text ${isHigh ? 'high' : 'medium'}`; }
}

/* ════════════════════════════════════════
   COUNTDOWN
════════════════════════════════════════ */
function startCountdown() {
  renderCountdown();
  countdownInterval = setInterval(() => {
    trainingCountdown = Math.max(0, trainingCountdown - (2 / 60));
    renderCountdown();
    if (trainingCountdown <= 0) clearInterval(countdownInterval);
  }, 2000);
}

function renderCountdown() {
  const el = document.getElementById('countdownVal');
  if (!el) return;
  const mins = Math.floor(trainingCountdown);
  const secs = Math.round((trainingCountdown - mins) * 60);
  el.textContent = mins > 0
    ? `${mins} min ${secs > 0 ? secs + 's' : ''}`
    : '<1 min';
  el.style.color = trainingCountdown < 2 ? 'var(--danger)' : '';
}

/* ════════════════════════════════════════
   MISC HELPERS
════════════════════════════════════════ */
function setSessionTime() {
  const el = document.getElementById('tr-sessionTime');
  if (el) el.textContent = new Date().toLocaleTimeString('en-IN', { hour12:false, hour:'2-digit', minute:'2-digit' });
}

// Bind insight toggle after page renders
function setupInsightToggle() {
  const header = document.getElementById('tr-insightHeader');
  if (header) header.onclick = window._trToggleInsight;
}

// Called after HTML is set
(function patchSetupAfterRender() {
  // Nothing to do here — insight toggle uses window._trToggleInsight set in bindGlobalHandlers
})();
