import pathlib

import pytest

PROJECT_ROOT = pathlib.Path(__file__).parent.parent


@pytest.fixture
def project_root():
    return PROJECT_ROOT


@pytest.fixture
def contracts_dir():
    return PROJECT_ROOT / "contracts"


@pytest.fixture
def openapi_dir(contracts_dir):
    return contracts_dir / "openapi"


@pytest.fixture
def asyncapi_dir(contracts_dir):
    return contracts_dir / "asyncapi"


@pytest.fixture
def mcp_dir(contracts_dir):
    return contracts_dir / "mcp"
