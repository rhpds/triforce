import { createContext, useContext, useMemo } from 'react'

export type VerticalId = 'healthcare' | 'finserv' | 'telco' | 'energy'

export interface SensorSpec {
  id: string
  label: string
  value: number
  baseline: number
  unit: string
  pct?: number
}

export interface VerticalConfig {
  id: VerticalId
  label: string
  icon: string
  sampleTexts: {
    pipeline: string
    classify: string
    fraud: string
    edge: string
  }
  classifyCategories: string[]
  entityTypes: string[]
  compliance: { framework: string; requirement: string; solution: string }[]
  edgeScenario: {
    location: string
    description: string
    sensors: SensorSpec[]
  }
  costContext: string
}

export const VERTICALS: Record<VerticalId, VerticalConfig> = {
  healthcare: {
    id: 'healthcare',
    label: 'Healthcare',
    icon: '🏥',
    sampleTexts: {
      pipeline: 'DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin 500mg and Lisinopril 10mg. Recent STEMI with PCI to RCA. Started on Aspirin 81mg, Clopidogrel 75mg. History of hypertension and CKD stage 3.',
      classify: 'Classify this clinical document: DISCHARGE SUMMARY: 72-year-old male with Type 2 Diabetes on Metformin and Lisinopril.',
      fraud: 'Prescription for 180 tablets of Oxycodone 30mg from a new provider in a different state, filled within 24 hours of a previous 90-tablet fill at another pharmacy.',
      edge: 'Rural clinic vitals: Heart rate 112 bpm (baseline 72), BP 88/54 (baseline 120/80), SpO2 91% (baseline 97%), temperature 101.2F. Trend: declining over 45 minutes.',
    },
    classifyCategories: ['discharge_summary', 'progress_note', 'lab_report', 'radiology_report', 'pathology_report', 'surgical_note', 'consultation', 'prescription'],
    entityTypes: ['medication', 'condition', 'procedure', 'lab_test', 'anatomy', 'dosage'],
    compliance: [
      { framework: 'HIPAA', requirement: 'PHI encrypted at rest and in use', solution: 'AES-256-XTS memory encryption for all inference data' },
      { framework: 'HIPAA', requirement: 'Access controls on PHI', solution: 'Hardware attestation gates secret release' },
      { framework: 'HITECH', requirement: 'Breach notification for unencrypted PHI', solution: 'Data never unencrypted outside Trust Domain — no breach to notify' },
      { framework: 'NIST 800-171', requirement: 'CUI protection in processing', solution: 'Confidential computing = encryption during processing' },
      { framework: 'FedRAMP', requirement: 'Data sovereignty', solution: 'Processing stays on-premises on attested hardware' },
    ],
    edgeScenario: {
      location: 'Rural Clinic — West Texas',
      description: 'Clinical NLP at facilities without reliable internet',
      sensors: [
        { id: 'HR', label: 'Heart Rate', value: 112, baseline: 72, unit: 'bpm', pct: 56 },
        { id: 'BP-S', label: 'BP Systolic', value: 88, baseline: 120, unit: 'mmHg', pct: -27 },
        { id: 'SPO2', label: 'SpO2', value: 91, baseline: 97, unit: '%', pct: -6 },
        { id: 'TEMP', label: 'Temperature', value: 101.2, baseline: 98.6, unit: '°F', pct: 3 },
      ],
    },
    costContext: 'hospital',
  },
  finserv: {
    id: 'finserv',
    label: 'Financial Services',
    icon: '🏦',
    sampleTexts: {
      pipeline: 'TRANSACTION ALERT: $15,000 wire transfer to Lagos, Nigeria from account opened 3 days ago. Round amount. First international transaction. Account holder age 23. Previous activity: single $50 ATM withdrawal.',
      classify: 'Classify this transaction: $15,000 wire transfer to Nigeria from a new account.',
      fraud: '$15,000 wire transfer to Nigeria from a new account opened 3 days ago. Round amount. First international transaction.',
      edge: 'Branch ATM-0847: 14 failed PIN attempts in 8 minutes across 3 cards. Camera shows single individual. Pattern: sequential card numbers. Location: off-hours, no staff present.',
    },
    classifyCategories: ['fraud_alert', 'compliance_flag', 'suspicious_activity', 'routine', 'high_value'],
    entityTypes: ['amount', 'destination', 'account_age', 'risk_signal', 'regulation'],
    compliance: [
      { framework: 'AML', requirement: 'Transaction monitoring and SAR filing', solution: 'Real-time inference on transaction patterns within encrypted memory' },
      { framework: 'KYC', requirement: 'Customer identity verification', solution: 'Identity data processed in hardware Trust Domain' },
      { framework: 'SOX', requirement: 'Audit trail for financial decisions', solution: 'Attestation logs with hardware proof per inference' },
      { framework: 'PCI-DSS', requirement: 'Cardholder data protection', solution: 'Card data never in plaintext outside TDX boundary' },
      { framework: 'GDPR', requirement: 'Data minimization and encryption', solution: 'Processing in encrypted memory, no persistent plaintext' },
    ],
    edgeScenario: {
      location: 'Branch Office — Downtown Dallas',
      description: 'Real-time fraud detection at branch ATMs and teller stations',
      sensors: [
        { id: 'PIN-FAIL', label: 'Failed PINs', value: 14, baseline: 1, unit: 'count', pct: 1300 },
        { id: 'CARDS', label: 'Unique Cards', value: 3, baseline: 1, unit: 'count', pct: 200 },
        { id: 'INTERVAL', label: 'Avg Interval', value: 34, baseline: 300, unit: 'sec', pct: -89 },
        { id: 'AMOUNT', label: 'Withdrawal Attempts', value: 5000, baseline: 200, unit: '$', pct: 2400 },
      ],
    },
    costContext: 'branch office',
  },
  telco: {
    id: 'telco',
    label: 'Telecommunications',
    icon: '📡',
    sampleTexts: {
      pipeline: 'NETWORK ANOMALY REPORT: Cell tower RAN-0742 sector 3 in Dallas metro. Throughput dropped 34% over 2 hours. Handover failure rate 12% (baseline 2%). Adjacent cells RAN-0741 and RAN-0743 operating normally. RSRP degradation detected on band n78.',
      classify: 'Classify this network event: Cell tower RAN-0742 throughput dropped 34% with handover failures at 12%.',
      fraud: 'SIM swap request for account ending 4521 from unrecognized device in different state than billing address. Third request in 48 hours. Previous two denied by automated system.',
      edge: 'RAN-0742 sector 3: throughput 45Mbps (baseline 68Mbps, -34%), handover failures 12% (baseline 2%), RSRP -112dBm (baseline -98dBm), CQI 4 (baseline 9).',
    },
    classifyCategories: ['network_anomaly', 'capacity_warning', 'hardware_fault', 'interference', 'routine'],
    entityTypes: ['cell_id', 'sector', 'metric', 'threshold', 'band', 'region'],
    compliance: [
      { framework: 'FCC', requirement: 'Network reliability and outage reporting', solution: 'Real-time anomaly detection in encrypted memory — no subscriber data exposed' },
      { framework: 'CPNI', requirement: 'Customer proprietary network information protection', solution: 'Subscriber data processed in hardware Trust Domain' },
      { framework: '3GPP', requirement: 'RAN security and integrity', solution: 'Inference on network metrics within attested environment' },
      { framework: 'NEBS', requirement: 'Equipment reliability standards', solution: 'Predictive maintenance inference at the edge' },
    ],
    edgeScenario: {
      location: 'Cell Tower RAN-0742 — Dallas Metro',
      description: 'MEC inference at cell towers for RAN optimization',
      sensors: [
        { id: 'TPUT', label: 'Throughput', value: 45, baseline: 68, unit: 'Mbps', pct: -34 },
        { id: 'HO-FAIL', label: 'Handover Failures', value: 12, baseline: 2, unit: '%', pct: 500 },
        { id: 'RSRP', label: 'Signal Strength', value: -112, baseline: -98, unit: 'dBm', pct: -14 },
        { id: 'CQI', label: 'Channel Quality', value: 4, baseline: 9, unit: 'index', pct: -56 },
      ],
    },
    costContext: 'cell site',
  },
  energy: {
    id: 'energy',
    label: 'Energy / Oil & Gas',
    icon: '⚡',
    sampleTexts: {
      pipeline: 'SCADA ALERT: Compressor Station B — Permian Basin Lateral 42. Vibration X-axis 6.8 mm/s (baseline 4.2), Y-axis 5.9 mm/s (baseline 3.8). Bearing temperature 192°F (baseline 185°F). Trend: increasing over 40 minutes. Pressure differential normal.',
      classify: 'Classify this SCADA event: Compressor B vibration exceeding baseline by 62% with temperature trending up.',
      fraud: 'Unauthorized SCADA login attempt from IP outside corporate MPLS network. Credentials match a terminated employee. Third attempt in 24 hours targeting compressor station control systems.',
      edge: 'Compressor B: VIB-X 6.8mm/s (baseline 4.2, +62%), VIB-Y 5.9mm/s (baseline 3.8, +55%), TEMP 192°F (baseline 185°F, +4%), PRESS 1200psi (normal), FLOW 45.2 MMSCFD (normal).',
    },
    classifyCategories: ['anomaly', 'maintenance_due', 'compliance_report', 'safety_alert', 'normal'],
    entityTypes: ['sensor_id', 'reading', 'threshold', 'equipment', 'location', 'pipeline'],
    compliance: [
      { framework: 'PHMSA', requirement: 'Pipeline integrity and sensor data monitoring', solution: 'Tamper-evident Trust Domain — modification breaks attestation' },
      { framework: 'NERC-CIP', requirement: 'Critical infrastructure protection', solution: 'SCADA data processed in hardware-encrypted memory' },
      { framework: 'EPA', requirement: 'Environmental monitoring and reporting', solution: 'Automated compliance reporting from attested inference' },
      { framework: 'OSHA', requirement: 'Worker safety monitoring', solution: 'Real-time hazard detection at remote sites' },
    ],
    edgeScenario: {
      location: 'Compressor Station B — Permian Basin',
      description: 'SCADA inference at compressor stations on existing hardware',
      sensors: [
        { id: 'VIB-X', label: 'Vibration X', value: 6.8, baseline: 4.2, unit: 'mm/s', pct: 62 },
        { id: 'VIB-Y', label: 'Vibration Y', value: 5.9, baseline: 3.8, unit: 'mm/s', pct: 55 },
        { id: 'TEMP', label: 'Bearing Temp', value: 192, baseline: 185, unit: '°F', pct: 4 },
        { id: 'PRESS', label: 'Pressure Out', value: 1200, baseline: 1200, unit: 'psi', pct: 0 },
        { id: 'FLOW', label: 'Flow Rate', value: 45.2, baseline: 45.2, unit: 'MMSCFD', pct: 0 },
      ],
    },
    costContext: 'compressor station',
  },
}

const VerticalContext = createContext<VerticalConfig>(VERTICALS.healthcare)

export function getVerticalFromUrl(): VerticalId {
  const params = new URLSearchParams(window.location.search)
  const v = params.get('vertical') as VerticalId
  return v && VERTICALS[v] ? v : 'healthcare'
}

export function VerticalProvider({ children }: { children: React.ReactNode }) {
  const vertical = useMemo(() => VERTICALS[getVerticalFromUrl()], [])
  return <VerticalContext.Provider value={vertical}>{children}</VerticalContext.Provider>
}

export function useVertical(): VerticalConfig {
  return useContext(VerticalContext)
}
