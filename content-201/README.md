# Intel Xeon 6 201: Building an AI Agent

This directory is the Showroom source for the 45-minute Intel Xeon 6 201 lab.
Learners deploy a small solution-advisor stack into their assigned OpenShift
namespace, connect three MCP tools, and use a tenant-scoped RACMaaS virtual key
for CPU inference.

## Publishing boundary

The 201 release consists of:

- `content-201/` and `site-201.yml` — Showroom guide and playbook
- `infrastructure/manifests-201/` — learner-deployed OpenShift resources
- `services/solution-tools/` — MCP tool service and workshop datasets
- `services/solution-agent/` — LangGraph agent and RACMaaS integration
- `services/solution-ui/` — learner interface

Other numbered tracks in this repository are not part of the 201 Publishing
House submission.

## Support and ownership

- Maintainer: Jonathan Kershaw (`jkershaw@redhat.com`)
- Catalog provider: Red Hat Demo Platform (RHDP)
- Runtime target: shared `ai-lab-xeon6-inference` OpenShift environment
- Inference: automatically provisioned, tenant-scoped RACMaaS virtual key

Report security concerns through Red Hat's approved internal security process.
Do not include credentials, customer data, or other sensitive information in a
public issue.

## Content safety

The included scenarios and architecture patterns are educational examples, not
validated customer sizing. Product facts include their source URLs. Final
customer recommendations require current product, availability, compatibility,
performance, security, and compliance validation.

Learners must not enter confidential, regulated, export-controlled, or
customer-identifying information.

## Release acceptance

A candidate release is ready only when:

1. the Showroom build and focused 201 tests pass;
2. content and container references are pinned to the candidate release;
3. a fresh development catalog order receives rendered RACMaaS values;
4. MCP lists all three tools;
5. requirement extraction and brief generation complete through RACMaaS; and
6. the Solution Architect UI completes the same workflow.
