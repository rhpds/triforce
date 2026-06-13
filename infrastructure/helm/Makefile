.PHONY: template install upgrade uninstall

NAMESPACE ?= triforce
RELEASE ?= triforce
EXTRA_HELM_ARGS ?=

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
