import os
import sys
import subprocess
import platform

print("🚀 Setting up Python AI environment...")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
VENV_DIR = os.path.join(BASE_DIR, "venv")

# 1. Create venv
if not os.path.exists(VENV_DIR):
    print("📦 Creating virtual environment...")
    subprocess.check_call([sys.executable, "-m", "venv", VENV_DIR])
else:
    print("✅ Virtual environment already exists")

# 2. Paths
if platform.system() == "Windows":
    python_path = os.path.join(VENV_DIR, "Scripts", "python.exe")
else:
    python_path = os.path.join(VENV_DIR, "bin", "python")

# 3. Upgrade pip
print("⬆️ Upgrading pip...")
subprocess.check_call([python_path, "-m", "pip", "install", "--upgrade", "pip"])

# 4. Install requirements
requirements_file = os.path.join(BASE_DIR, "requirements.txt")

if os.path.exists(requirements_file):
    print("📦 Installing dependencies...")
    subprocess.check_call([python_path, "-m", "pip", "install", "-r", requirements_file])
else:
    print("❌ requirements.txt not found!")

print("\n✅ Setup complete!")

print("\n👉 Activate environment:")

if platform.system() == "Windows":
    print("   venv\\Scripts\\activate")
else:
    print("   source venv/bin/activate")