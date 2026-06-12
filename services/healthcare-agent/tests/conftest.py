import sys
import pathlib

import pytest

SERVICE_DIR = pathlib.Path(__file__).parent.parent
sys.path.insert(0, str(SERVICE_DIR))
