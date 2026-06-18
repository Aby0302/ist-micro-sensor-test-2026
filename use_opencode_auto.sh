#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(pwd)"
REPO_NAME="${1:-sensor-test-2026}"
GIT_NAME="${GIT_NAME:-Aby0203}"
GIT_EMAIL="${GIT_EMAIL:-alpery406+1@gmail.com}"
MODEL_NAME="${MODEL_NAME:-qwen2.5-coder:7b}"

echo "== OpenCode otomatik proje hazırlama =="
echo "Proje: $PROJECT_DIR"
echo

echo "== Sistem araçları kontrol ediliyor =="
sudo pacman -S --needed git github-cli unzip curl ollama || true

echo "== OpenCode kontrol ediliyor =="
if ! command -v opencode >/dev/null 2>&1; then
  echo "OpenCode bulunamadı. Pacman ile deneniyor..."
  if ! sudo pacman -S --needed opencode; then
    echo "Pacman ile olmadı. Resmi install script deneniyor..."
    curl -fsSL https://opencode.ai/install | bash
    export PATH="$HOME/.local/bin:$PATH"
  fi
fi

echo "== Ollama başlatılıyor =="
sudo systemctl enable --now ollama || true

echo "== Ollama model kontrolü =="
if ! ollama list | grep -q "$MODEL_NAME"; then
  ollama pull "$MODEL_NAME"
fi

echo "== Git repo hazırlanıyor =="
if [ ! -d .git ]; then
  git init
fi

git config user.name "$GIT_NAME"
git config user.email "$GIT_EMAIL"

echo "== .gitignore hazırlanıyor =="
touch .gitignore

for item in \
  ".aider*" \
  ".opencode/" \
  "__pycache__/" \
  ".venv/" \
  "venv/" \
  "node_modules/" \
  "*.pyc" \
  "*.zip"
do
  grep -qxF "$item" .gitignore || echo "$item" >> .gitignore
done

echo "== ZIP dosyaları otomatik çıkarılıyor =="
mkdir -p extracted

shopt -s nullglob
for zipfile in *.zip; do
  base="${zipfile%.zip}"
  safe_base="$(echo "$base" | tr ' /:' '___')"
  outdir="extracted/$safe_base"

  echo "Çıkarılıyor: $zipfile -> $outdir"
  mkdir -p "$outdir"
  unzip -oq "$zipfile" -d "$outdir"
done

echo "== ZIP dosyaları git'ten çıkarılıyor ama diskten silinmiyor =="
git rm --cached *.zip >/dev/null 2>&1 || true

echo "== Git add + commit =="
git add .

if git diff --cached --quiet; then
  echo "Commitlenecek yeni değişiklik yok."
else
  git commit -m "Prepare project for OpenCode"
fi

echo "== GitHub remote kontrol ediliyor =="
if git remote get-url origin >/dev/null 2>&1; then
  echo "Origin var: $(git remote get-url origin)"
else
  echo "GitHub private repo oluşturuluyor: $REPO_NAME"
  if ! gh repo create "$REPO_NAME" --private --source=. --remote=origin; then
    TS="$(date +%Y%m%d-%H%M%S)"
    REPO_NAME="${REPO_NAME}-${TS}"
    echo "Repo adı kullanılamadı. Yeni ad: $REPO_NAME"
    gh repo create "$REPO_NAME" --private --source=. --remote=origin
  fi
fi

echo "== Branch main yapılıyor ve push ediliyor =="
git branch -M main
git push -u origin main || true

echo
echo "== OpenCode başlatılıyor =="
echo "OpenCode açılınca önce /init yaz."
echo "Sonra şunu yaz:"
echo "Bu projeyi analiz et. ZIP'ten çıkan dosyaları, CSV dosyalarını ve proje yapısını incele. Ne işe yaradığını açıkla. Çalıştırma adımlarını söyle. Değişiklik yapmadan önce plan çıkar."
echo

export OLLAMA_API_BASE="${OLLAMA_API_BASE:-http://127.0.0.1:11434}"

if command -v ollama >/dev/null 2>&1; then
  echo "Öneri: Model seçimi için OpenCode içinde /models komutunu kullan."
fi

opencode
