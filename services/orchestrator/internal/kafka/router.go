package kafka

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"sync"
	"time"
)

type Message struct {
	Topic string
	Key   string
	Value []byte
}

type PatientRecord struct {
	PatientID  string            `json:"patient_id"`
	RecordType string            `json:"record_type"`
	Text       string            `json:"text"`
	Metadata   map[string]string `json:"metadata,omitempty"`
	GeneratedAt string           `json:"generated_at"`
}

type Transaction struct {
	ID        string  `json:"id"`
	Amount    float64 `json:"amount"`
	Currency  string  `json:"currency"`
	Sender    Party   `json:"sender"`
	Receiver  Party   `json:"receiver"`
	Timestamp string  `json:"timestamp"`
	Type      string  `json:"type"`
}

type Party struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Country     string `json:"country"`
	AccountType string `json:"account_type"`
}

type SyntheticConfig struct {
	Target          string  `json:"target"`
	RatePerSecond   float64 `json:"rate_per_second"`
	DurationSeconds int     `json:"duration_seconds"`
}

type EventRouter struct {
	mu              sync.Mutex
	running         bool
	stopCh          chan struct{}
	messagesSent    int
	messagesReceived int
}

func NewEventRouter() *EventRouter {
	return &EventRouter{}
}

func (r *EventRouter) StartSynthetic(cfg SyntheticConfig) error {
	r.mu.Lock()
	if r.running {
		r.mu.Unlock()
		return fmt.Errorf("synthetic generation already running")
	}
	r.running = true
	r.stopCh = make(chan struct{})
	r.mu.Unlock()

	go r.generateLoop(cfg)
	return nil
}

func (r *EventRouter) StopSynthetic() {
	r.mu.Lock()
	defer r.mu.Unlock()
	if r.running {
		close(r.stopCh)
		r.running = false
	}
}

func (r *EventRouter) IsRunning() bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	return r.running
}

func (r *EventRouter) Stats() map[string]int {
	r.mu.Lock()
	defer r.mu.Unlock()
	return map[string]int{
		"messages_sent":     r.messagesSent,
		"messages_received": r.messagesReceived,
	}
}

func (r *EventRouter) generateLoop(cfg SyntheticConfig) {
	interval := time.Duration(float64(time.Second) / cfg.RatePerSecond)
	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	deadline := time.After(time.Duration(cfg.DurationSeconds) * time.Second)

	for {
		select {
		case <-r.stopCh:
			log.Println("Synthetic generation stopped")
			return
		case <-deadline:
			log.Println("Synthetic generation duration reached")
			r.mu.Lock()
			r.running = false
			r.mu.Unlock()
			return
		case <-ticker.C:
			if cfg.Target == "healthcare" || cfg.Target == "both" {
				r.generatePatientRecord()
			}
			if cfg.Target == "finserv" || cfg.Target == "both" {
				r.generateTransaction()
			}
		}
	}
}

func (r *EventRouter) generatePatientRecord() {
	recordTypes := []string{"discharge_summary", "progress_note", "lab_report", "radiology_report", "surgical_note"}
	departments := []string{"cardiology", "oncology", "neurology", "orthopedics", "emergency"}

	record := PatientRecord{
		PatientID:  fmt.Sprintf("pt-%06d", rand.Intn(999999)),
		RecordType: recordTypes[rand.Intn(len(recordTypes))],
		Text:       generateClinicalText(),
		Metadata: map[string]string{
			"age":        fmt.Sprintf("%d", 20+rand.Intn(80)),
			"gender":     []string{"M", "F", "X"}[rand.Intn(3)],
			"department": departments[rand.Intn(len(departments))],
		},
		GeneratedAt: time.Now().UTC().Format(time.RFC3339),
	}

	data, _ := json.Marshal(record)
	_ = data // Would send to Kafka in production

	r.mu.Lock()
	r.messagesSent++
	r.mu.Unlock()
}

func (r *EventRouter) generateTransaction() {
	txTypes := []string{"wire", "ach", "card", "crypto", "internal"}
	currencies := []string{"USD", "EUR", "GBP", "JPY", "CAD"}
	countries := []string{"US", "GB", "DE", "JP", "CA", "FR", "AU"}

	tx := Transaction{
		ID:       fmt.Sprintf("tx-%06d", rand.Intn(999999)),
		Amount:   float64(rand.Intn(50000)) + float64(rand.Intn(100))/100,
		Currency: currencies[rand.Intn(len(currencies))],
		Sender: Party{
			ID:          fmt.Sprintf("cust-%04d", rand.Intn(9999)),
			Name:        "Synthetic Sender",
			Country:     countries[rand.Intn(len(countries))],
			AccountType: []string{"individual", "business"}[rand.Intn(2)],
		},
		Receiver: Party{
			ID:          fmt.Sprintf("cust-%04d", rand.Intn(9999)),
			Name:        "Synthetic Receiver",
			Country:     countries[rand.Intn(len(countries))],
			AccountType: []string{"individual", "business"}[rand.Intn(2)],
		},
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Type:      txTypes[rand.Intn(len(txTypes))],
	}

	data, _ := json.Marshal(tx)
	_ = data // Would send to Kafka in production

	r.mu.Lock()
	r.messagesSent++
	r.mu.Unlock()
}

func generateClinicalText() string {
	templates := []string{
		"Patient is a %d-year-old %s presenting with %s. History of %s. Currently on %s. Assessment: %s.",
		"DISCHARGE SUMMARY: %d y/o %s admitted for %s. PMH: %s. Medications: %s. Plan: %s.",
		"LAB RESULTS: %d y/o %s. Ordered for %s. Known history of %s. Current meds: %s. Results: %s.",
	}
	ages := []int{45, 62, 78, 34, 55, 71, 28, 83}
	genders := []string{"male", "female"}
	conditions := []string{"chest pain", "shortness of breath", "abdominal pain", "headache", "fatigue", "fever"}
	histories := []string{"Type 2 Diabetes", "Hypertension", "COPD", "CAD", "CKD Stage 3", "Atrial Fibrillation"}
	medications := []string{"Metformin 500mg BID", "Lisinopril 10mg daily", "Atorvastatin 40mg", "Aspirin 81mg"}
	assessments := []string{"stable, continue current management", "requires further workup", "improved, discharge planned"}

	tmpl := templates[rand.Intn(len(templates))]
	return fmt.Sprintf(tmpl,
		ages[rand.Intn(len(ages))],
		genders[rand.Intn(len(genders))],
		conditions[rand.Intn(len(conditions))],
		histories[rand.Intn(len(histories))],
		medications[rand.Intn(len(medications))],
		assessments[rand.Intn(len(assessments))],
	)
}
