.PHONY: template install upgrade uninstall generate-nav deploy

NAMESPACE ?= triforce
RELEASE ?= triforce
EXTRA_HELM_ARGS ?=
MODULES_ENABLED ?=

template: ## Render templates without installing
	helm template $(RELEASE) . \
		--namespace $(NAMESPACE) \
		$(EXTRA_HELM_ARGS)

install: ## Install Helm chart
	helm install $(RELEASE) . \
		--namespace $(NAMESPACE) \
		--create-namespace \
		$(EXTRA_HELM_ARGS)

upgrade: ## Upgrade existing release
	helm upgrade $(RELEASE) . \
		--namespace $(NAMESPACE) \
		$(EXTRA_HELM_ARGS)

uninstall: ## Remove release
	helm uninstall $(RELEASE) --namespace $(NAMESPACE)

generate-nav: ## Generate showroom nav.adoc from enabled modules
	@if [ -n "$(MODULES_ENABLED)" ]; then \
		echo "Generating nav for modules: $(MODULES_ENABLED)"; \
		MODULES_ENABLED="$(MODULES_ENABLED)" python3 ../../scripts/generate-nav.py; \
	else \
		echo "Generating nav for ALL modules"; \
		python3 ../../scripts/generate-nav.py; \
	fi

deploy: generate-nav install ## Generate nav + install (full deploy)
