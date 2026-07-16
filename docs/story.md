# Triforce

## Why It Exists

Triforce answers three questions that keep enterprise leaders up at night:

**Can I afford AI at scale?**
Not at GPU prices. Not at API token rates. Not when a million records costs half a million dollars. But on the CPUs you already own — yes.

**Can I run it on hardware I own?**
Not if AI requires a separate GPU cluster, a separate team, a separate budget. But on the same OpenShift platform, the same Xeon servers, alongside the same VMs — yes.

**Can I trust it with my data?**
Not if inference data sits unencrypted in shared memory. Not if agents call tools without governance. Not if there's no audit trail. But with hardware encryption, attestation-gated secrets, and complete provenance — yes.

Three questions. Two pillars. One platform.

| Question | Pillar | Answer |
|----------|--------|--------|
| Can I afford it? | Intel (Power) | $0/token on Xeon 6 CPU |
| Can I run it myself? | Red Hat (Courage) | OpenShift + intelligent routing + scale |
| Can I trust it? | Intel + Red Hat | TDX encryption + attestation + audit |

---

## The Ordinary World

Every enterprise wants AI. They've seen the demos. They've run the pilots. But when the CFO asks "what does it cost at scale?" — the room goes quiet.

GPU servers cost $120K. Cloud APIs charge per token. A million patient records per month through Claude Opus costs half a million dollars a year. The data team has a waitlist for GPU time. The compliance team hasn't signed off on sending PHI to external APIs. The VM admins aren't talking to the AI team.

AI is stuck in pilot. It can't scale because it can't afford to.

## The Call

What if the workloads that fill most of your queue — classification, NER, fraud scoring, summarization, embeddings — didn't need a GPU at all?

What if the CPUs already in every data center could do the work?

What if the models were open, the inference was free, and the platform was already there?

## The Doubt

"CPU inference is too slow." "Small models aren't good enough." "You can't run production AI without GPUs." "Open-weight models aren't enterprise-ready." "Our security team will never approve it."

These are reasonable objections. They're also wrong — for the workloads we measured.

## The Alliance

```
            ▲
           ╱ ╲
          ╱   ╲
         ╱ RED ╲
        ╱  HAT  ╲
       ╱ COURAGE ╲
      ╱───────────╲
     ╱ ╲         ╱ ╲
    ╱   ╲       ╱   ╲
   ╱     ╲     ╱     ╲
  ╱ INTEL ╲   ╱      ╲
 ╱  POWER  ╲ ╱        ╲
╱───────────╳───────────╲
```

**Power (Intel):** Your Xeon 6 CPUs have AMX — advanced matrix extensions built for AI inference. The silicon is already in your data center.

**Courage (Red Hat):** Your platform is OpenShift. Your routing is intelligent. Your infrastructure scales. You already have the courage to run production workloads — now add AI to them.

---

## The Proof

### Can I afford it?

A discharge summary enters the pipeline. Classify: 615ms. Extract entities: 6.3s. Check drug interactions — Warfarin + Aspirin: MAJOR, increased bleeding risk. Summarize. Four steps. Three models. All on Xeon 6 CPU.

Cost: $0.

The same work on Claude Opus: $0.04 per record. At 100,000 records per month: $50,400 per year. On a GPU server: $119,333 per year. On Xeon 6: $15,000 per year — the cost of the hardware you already own.

Below 149,000 records per month, the API is cheaper. We're honest about that. But above that line — and every enterprise is above that line — the math is clear.

### Can I run it myself?

Three agents. Three languages. Python for clinical NLP. Java for financial services. Go for orchestration. All on one OpenShift cluster.

Red Hat's Semantic Router classifies each request by complexity. Simple queries go to the 2B model. Summarization goes to the 3B model. Complex reasoning goes to the 3.8B model. The right model for the right task — no GPU needed for the routing itself.

Kafka streams the workloads. PostgreSQL logs every decision. Helm deploys everything. The infrastructure team doesn't need to learn new tools. They already know this stack.

### Can I trust it?

One YAML line — `runtimeClassName: kata-cc` — and Intel TDX encrypts every byte of inference data in hardware. The cluster admin can't read it. The hypervisor can't read it. The API key is released only to pods that prove they're running inside genuine TDX hardware.

The compliance team sees hardware encryption. The security team sees zero-trust identity. The audit team sees complete provenance.

---

## The Hardest Question

"But is it good enough?"

The models are small. The latency is seconds, not milliseconds. GPU inference is faster.

The answer isn't "we're faster." The answer is:

615ms classification is fast enough for document processing. 22ms fraud scoring is fast enough for transaction screening. 8.4 seconds for a four-step reasoning chain is fast enough for clinical analysis.

The question was never "is it the fastest?" The question is "is it fast enough at 1/10th the cost?"

For the workloads we measured — classification, NER, fraud scoring, summarization — yes.

## The Remaining 20%

Some workloads need bigger models. 70B parameter reasoning. 235B mixture-of-experts. Frontier model quality.

For those, the same MAAS platform routes to Vertex AI — pay-per-token for the 20% that truly needs it. Same API endpoint, same authentication, seamless. The enterprise doesn't choose between CPU and GPU. It uses both — routine inference at $0/token, complex reasoning at market rates.

---

## The Transformation

AI is no longer a separate initiative with a separate budget and a separate team. It runs on the same Xeon servers, the same OpenShift clusters, alongside the same VMs. The AI team and the infrastructure team are the same team.

The demo becomes a deployment. The lab guide becomes a training program. The partner demo becomes the enterprise playbook.

## The Elixir

**In our measured workloads, classification, NER, fraud scoring, summarization, and embeddings all ran within SLA on CPU at $0/token. The rest needs a bigger conversation. But those routine tasks — the ones that fill most enterprise queues — run today on the CPUs you already own, governed by the platform you already trust, at a cost you can actually afford.**

That's Triforce.

---

*Power. Courage.*

*Intel. Red Hat.*

*github.com/rhpds/triforce*
