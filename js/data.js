/* ===================== SIMULATION DATA ENGINE ===================== */

// Process variable definitions
const PROCESS_VARS = {
  machineSpeed:   { name: 'Machine Speed',    unit: 'm/min', base: 685, range: [640, 720], normal: [660, 710], warn: [640, 660], step: 1.2 },
  steamPressure:  { name: 'Steam Pressure',   unit: 'bar',   base: 8.5, range: [7.0, 10.0], normal: [7.5, 9.0], warn: [9.0, 9.8], step: 0.05 },
  stockFlow:      { name: 'Stock Flow',       unit: 'L/min', base: 1240, range: [1100, 1380], normal: [1150, 1300], warn: [1100, 1150], step: 3 },
  fillerFlow:     { name: 'Filler Flow',      unit: 'kg/hr', base: 340, range: [280, 400], normal: [290, 380], warn: [380, 400], step: 1.5 },
  moisture:       { name: 'Moisture',         unit: '%',     base: 5.2, range: [3.5, 7.5], normal: [4.0, 6.5], warn: [6.5, 7.2], step: 0.06 },
  ash:            { name: 'Ash Content',      unit: '%',     base: 18.4, range: [15, 22], normal: [16, 21], warn: [21, 22], step: 0.08 },
  caliper:        { name: 'Caliper',          unit: 'µm',    base: 148, range: [130, 165], normal: [135, 160], warn: [160, 165], step: 0.4 },
  basisWeight:    { name: 'Basis Weight',     unit: 'gsm',   base: 123.8, range: [110, 145], normal: [115, 135], warn: [135, 143], step: 0.3 },
};

// Simulation state
const SimState = {
  time: 0,
  transitionProgress: 68,
  deviationProbability: 87,
  predictionConfidence: 97.3,
  currentLoss: 18540,
  overallRisk: 'MEDIUM',
  alarmCount: 3,

  // Per-variable state
  vars: {},

  // Historical data buffers (last 50 points)
  history: {},

  init() {
    for (const [key, cfg] of Object.entries(PROCESS_VARS)) {
      this.vars[key] = cfg.base;
      this.history[key] = [];
      // Pre-fill with slightly noisy data
      for (let i = 0; i < 50; i++) {
        this.history[key].push(cfg.base + (Math.random() - 0.5) * (cfg.range[1] - cfg.range[0]) * 0.06);
      }
    }
  },

  update() {
    this.time++;
    // Simulate steam pressure anomaly building up
    const steamAnomaly = Math.sin(this.time * 0.04) * 0.12 + Math.random() * 0.04;
    this.vars.steamPressure = Math.min(9.8,
      this.vars.steamPressure + steamAnomaly * 0.05 + (Math.random() - 0.45) * 0.02
    );

    // Other variables with noise
    for (const [key, cfg] of Object.entries(PROCESS_VARS)) {
      if (key === 'steamPressure') continue;
      const noise = (Math.random() - 0.5) * cfg.step * 0.6;
      const reversion = (cfg.base - this.vars[key]) * 0.02;
      this.vars[key] = Math.max(cfg.range[0], Math.min(cfg.range[1],
        this.vars[key] + noise + reversion
      ));
    }

    // Basis weight responds to steam pressure
    this.vars.basisWeight += (this.vars.steamPressure - 8.5) * 0.8 + (Math.random() - 0.5) * 0.2;
    this.vars.basisWeight = Math.max(110, Math.min(145, this.vars.basisWeight));

    // Push to histories
    for (const key of Object.keys(PROCESS_VARS)) {
      this.history[key].push(this.vars[key]);
      if (this.history[key].length > 60) this.history[key].shift();
    }

    // Update transition progress
    if (this.transitionProgress < 100) {
      this.transitionProgress += 0.15 + Math.random() * 0.1;
    }

    // Deviation probability creeps up with steam pressure
    const sp = this.vars.steamPressure;
    this.deviationProbability = Math.min(99, 75 + (sp - 8.5) * 30 + Math.random() * 3);

    // Update loss
    this.currentLoss = 18540 + Math.round(Math.sin(this.time * 0.02) * 500 + Math.random() * 100);
  },

  getStatus(key) {
    const v = this.vars[key];
    const cfg = PROCESS_VARS[key];
    if (v >= cfg.normal[0] && v <= cfg.normal[1]) return 'normal';
    if (v > cfg.warn[0] && v <= cfg.warn[1]) return 'warning';
    if (v < cfg.warn[0]) return 'warning';
    return 'danger';
  }
};

SimState.init();

// Prediction timeline data
const PredictionTimeline = {
  generate() {
    const base = SimState.vars.basisWeight;
    return [
      { label: 'Now', value: base.toFixed(1), deviation: false },
      { label: '+2m', value: (base + 1.2).toFixed(1), deviation: false },
      { label: '+5m', value: (base + 4.8).toFixed(1), deviation: false },
      { label: '+8m', value: (base + 9.6).toFixed(1), deviation: false },
      { label: 'Dev.', value: (base + 14.2).toFixed(1), deviation: true },
    ];
  }
};

// Alarm data
const Alarms = [
  { type: 'ai', msg: 'Basis Weight deviation predicted in 4 min. Confidence: 97.3%', time: '01:11:22', active: true },
  { type: 'warning', msg: 'Steam Pressure increasing faster than historical pattern', time: '01:09:41', active: true },
  { type: 'ai', msg: 'Recommendation generated: Reduce Steam Pressure by 0.6 bar', time: '01:09:05', active: true },
  { type: 'critical', msg: 'Basis Weight approaching target deviation threshold (±5 gsm)', time: '01:07:18', active: false },
  { type: 'info', msg: 'Grade Change initiated: GSM 120 → GSM 160', time: '01:00:00', active: false },
  { type: 'warning', msg: 'Moisture variance above normal for current grade', time: '00:58:32', active: false },
  { type: 'info', msg: 'AI Learning model updated with last 3 transitions', time: '00:45:00', active: false },
];

// Historical transitions
const HistoricalTransitions = [
  { id: 'T-2024-0312', from: 'GSM 80', to: 'GSM 120', date: '2024-03-12', status: 'success', stabTime: '7.2m', loss: '₹12,400', deviation: '±2.1', aiUsed: true },
  { id: 'T-2024-0308', from: 'GSM 160', to: 'GSM 200', date: '2024-03-08', status: 'success', stabTime: '9.8m', loss: '₹18,200', deviation: '±3.8', aiUsed: true },
  { id: 'T-2024-0301', from: 'GSM 120', to: 'GSM 80', date: '2024-03-01', status: 'failed', stabTime: '22.4m', loss: '₹54,600', deviation: '±11.2', aiUsed: false },
  { id: 'T-2024-0224', from: 'GSM 200', to: 'GSM 120', date: '2024-02-24', status: 'success', stabTime: '8.1m', loss: '₹15,800', deviation: '±2.4', aiUsed: true },
  { id: 'T-2024-0218', from: 'GSM 80', to: 'GSM 160', date: '2024-02-18', status: 'success', stabTime: '6.4m', loss: '₹11,200', deviation: '±1.8', aiUsed: true },
  { id: 'T-2024-0211', from: 'GSM 120', to: 'GSM 200', date: '2024-02-11', status: 'failed', stabTime: '19.1m', loss: '₹48,900', deviation: '±9.7', aiUsed: false },
];

// Operator decisions history
const OperatorDecisions = [
  { rec: 'Reduce Steam Pressure (8.5→7.9 bar)', action: 'accepted', note: 'Pressure was visibly rising. AI confidence was high.', time: '01:09:12', improvement: '+63%' },
  { rec: 'Increase Machine Speed (680→705 m/min)', action: 'accepted', note: '', time: '00:52:40', improvement: '+34%' },
  { rec: 'Reduce Stock Flow (1240→1180 L/min)', action: 'rejected', note: 'Stock was within normal limits. Not confident.', time: '00:31:15', improvement: null },
  { rec: 'Adjust Filler Flow (340→320 kg/hr)', action: 'accepted', note: '', time: '00:18:05', improvement: '+28%' },
];

// Correlation data
const CorrelationData = {
  nodes: [
    { id: 'basisWeight', label: 'Basis Weight', type: 'target', x: 400, y: 250 },
    { id: 'steamPressure', label: 'Steam Pressure', type: 'primary', x: 180, y: 120 },
    { id: 'machineSpeed', label: 'Machine Speed', type: 'primary', x: 600, y: 100 },
    { id: 'moisture', label: 'Moisture', type: 'primary', x: 680, y: 300 },
    { id: 'ash', label: 'Ash Content', type: 'secondary', x: 600, y: 420 },
    { id: 'caliper', label: 'Caliper', type: 'secondary', x: 400, y: 460 },
    { id: 'stockFlow', label: 'Stock Flow', type: 'primary', x: 180, y: 360 },
    { id: 'fillerFlow', label: 'Filler Flow', type: 'secondary', x: 100, y: 240 },
    { id: 'recipe', label: 'Recipe', type: 'external', x: 300, y: 60 },
    { id: 'opDelay', label: 'Operator Delay', type: 'external', x: 520, y: 50 },
  ],
  edges: [
    { source: 'steamPressure', target: 'basisWeight', corr: 0.92, samples: 532, unknown: false },
    { source: 'machineSpeed', target: 'basisWeight', corr: 0.74, samples: 498, unknown: false },
    { source: 'stockFlow', target: 'basisWeight', corr: 0.62, samples: 487, unknown: true },
    { source: 'moisture', target: 'basisWeight', corr: 0.59, samples: 502, unknown: false },
    { source: 'fillerFlow', target: 'basisWeight', corr: 0.41, samples: 476, unknown: false },
    { source: 'ash', target: 'basisWeight', corr: 0.38, samples: 460, unknown: true },
    { source: 'caliper', target: 'basisWeight', corr: 0.71, samples: 511, unknown: false },
    { source: 'recipe', target: 'basisWeight', corr: 0.55, samples: 389, unknown: false },
    { source: 'opDelay', target: 'basisWeight', corr: 0.32, samples: 443, unknown: true },
    { source: 'steamPressure', target: 'moisture', corr: 0.48, samples: 267, unknown: false },
    { source: 'machineSpeed', target: 'caliper', corr: 0.63, samples: 298, unknown: true },
    { source: 'stockFlow', target: 'ash', corr: 0.44, samples: 312, unknown: true },
  ]
};

// Machine components
const MachineComponents = [
  { icon: '🔆', name: 'Dryer Cylinder', health: 98, status: 'good', days: 142, temp: '185°C' },
  { icon: '🔧', name: 'Steam Valve #1', health: 87, status: 'good', days: 28, temp: '8.5 bar' },
  { icon: '📡', name: 'Basis Wt. Scanner', health: 99, status: 'good', days: 210, remark: 'Calibrated' },
  { icon: '⚙️', name: 'Press Roll A', health: 91, status: 'good', days: 65, load: '92 kN' },
  { icon: '💧', name: 'Stock Pump',   health: 76, status: 'warn', days: 14, flow: '1240 L/min' },
  { icon: '⚡', name: 'Main Drive Motor', health: 95, status: 'good', days: 89, rpm: '1480' },
  { icon: '🔩', name: 'Wire Tension', health: 88, status: 'good', days: 42, tension: '4.2 kN' },
];

// Simulator scenarios
const SimScenarios = [
  {
    id: 'A', title: 'Reduce Steam Pressure',
    desc: 'Reduce steam pressure from 8.5 to 7.9 bar to counteract rising sheet density.',
    stabTime: '3.8m', loss: '₹8,200', confidence: 96, bwRecovery: '12.1 gsm',
    color: '#CC0000', best: false
  },
  {
    id: 'B', title: 'Increase Machine Speed',
    desc: 'Increase machine speed from 680 to 705 m/min to improve draw rate balance.',
    stabTime: '5.2m', loss: '₹11,400', confidence: 89, bwRecovery: '9.4 gsm',
    color: '#2D9CDB', best: false
  },
  {
    id: 'C', title: 'Adjust Stock Flow',
    desc: 'Reduce stock flow from 1240 to 1180 L/min to rebalance sheet formation.',
    stabTime: '4.4m', loss: '₹9,600', confidence: 82, bwRecovery: '10.8 gsm',
    color: '#FFB020', best: false
  },
  {
    id: 'D', title: 'Combined Optimization',
    desc: 'Apply all adjustments simultaneously: pressure reduction + speed increase + flow control.',
    stabTime: '2.1m', loss: '₹5,800', confidence: 94, bwRecovery: '14.9 gsm',
    color: '#00D68F', best: true
  },
];

export {
  PROCESS_VARS, SimState, PredictionTimeline, Alarms, HistoricalTransitions,
  OperatorDecisions, CorrelationData, MachineComponents, SimScenarios
};
