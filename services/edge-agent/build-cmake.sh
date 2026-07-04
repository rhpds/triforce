#!/bin/bash
set -e
cd /build/BitNet

echo "Attempting direct cmake build..."
cmake -B build -DBITNET_X86_TL2=OFF \
    -DCMAKE_C_COMPILER=clang -DCMAKE_CXX_COMPILER=clang++ \
    -DLLAMA_FATAL_WARNINGS=OFF 2>&1 && \
cmake --build build --config Release -j$(nproc) 2>&1

if [ -f build/bin/llama-server ]; then
    echo "Direct cmake build succeeded"
else
    echo "Direct cmake failed — falling back to setup_env.py"
    python3 setup_env.py --hf-repo microsoft/BitNet-b1.58-2B-4T -q i2_s 2>&1 || true
    rm -rf models/
fi

ls -la build/bin/llama-server
