package kafka

import (
	"testing"
	"time"
)

func TestNewEventRouter(t *testing.T) {
	r := NewEventRouter()
	if r == nil {
		t.Fatal("NewEventRouter returned nil")
	}
	if r.IsRunning() {
		t.Fatal("new router should not be running")
	}
}

func TestStartStopSynthetic(t *testing.T) {
	r := NewEventRouter()

	err := r.StartSynthetic(SyntheticConfig{
		Target:          "both",
		RatePerSecond:   100,
		DurationSeconds: 60,
	})
	if err != nil {
		t.Fatalf("StartSynthetic failed: %v", err)
	}
	if !r.IsRunning() {
		t.Fatal("expected running after start")
	}

	time.Sleep(50 * time.Millisecond)

	r.StopSynthetic()
	if r.IsRunning() {
		t.Fatal("expected not running after stop")
	}

	stats := r.Stats()
	if stats["messages_sent"] == 0 {
		t.Fatal("expected some messages sent")
	}
}

func TestDoubleStartReturnsError(t *testing.T) {
	r := NewEventRouter()
	r.StartSynthetic(SyntheticConfig{Target: "healthcare", RatePerSecond: 10, DurationSeconds: 60})
	defer r.StopSynthetic()

	err := r.StartSynthetic(SyntheticConfig{Target: "healthcare", RatePerSecond: 10, DurationSeconds: 60})
	if err == nil {
		t.Fatal("expected error on double start")
	}
}

func TestGeneratePatientRecord(t *testing.T) {
	r := NewEventRouter()
	r.generatePatientRecord()

	stats := r.Stats()
	if stats["messages_sent"] != 1 {
		t.Fatalf("expected 1 message sent, got %d", stats["messages_sent"])
	}
}

func TestGenerateTransaction(t *testing.T) {
	r := NewEventRouter()
	r.generateTransaction()

	stats := r.Stats()
	if stats["messages_sent"] != 1 {
		t.Fatalf("expected 1 message sent, got %d", stats["messages_sent"])
	}
}

func TestSyntheticDurationExpiry(t *testing.T) {
	r := NewEventRouter()
	r.StartSynthetic(SyntheticConfig{
		Target:          "healthcare",
		RatePerSecond:   100,
		DurationSeconds: 1,
	})

	time.Sleep(1500 * time.Millisecond)

	if r.IsRunning() {
		t.Fatal("expected not running after duration expired")
	}
}
