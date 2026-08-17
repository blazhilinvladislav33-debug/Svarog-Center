# 🐙 GitHub Setup Guide - SVAROG v3.1.0

Посібник для налаштування GitHub з автоматичною компіляцією для Windows & macOS.

---

## 🔑 КРОК 1: Створіть GitHub Personal Access Token

### ⚠️ КРИТИЧНО! Це необхідно для автоматичної компіляції!

1. **Перейдіть на GitHub**
   - https://github.com/settings/tokens

2. **Натисніть "Generate new token (classic)"**
   ```
   GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
   → Generate new token (classic)
   ```

3. **Заповніть форму:**
   ```
   Token name: GH_TOKEN
   Expiration: 90 days (або більше)
   ```

4. **Виберіть права (ВАЖЛИВО!):**
   - ✅ **repo** (Full control of private repositories)
     - ✅ repo:status
     - ✅ repo_deployment
     - ✅ public_repo
     - ✅ repo:invite
   - ✅ **write:packages**
   - ✅ **delete:packages**

   **НЕ потрібні:**
   - ❌ admin:repo_hook
   - ❌ admin:write:repo_hook

5. **Натисніть "Generate token"**

6. **СКОПІЮЙТЕ ТОКЕН ВІДРАЗУ!**
   ```
   ghp_xxxxx...xxxxx
   ```
   ⚠️ Більше ніколи не буде видно!

---

## 🔐 КРОК 2: Додайте Token в GitHub Secrets

1. **Перейдіть до вашого репо**
   ```
   https://github.com/YOUR_USERNAME/svarog-center-v3
   ```

2. **Settings → Secrets and variables → Actions**
   ```
   Repo → Settings 
   → Secrets and variables 
   → Actions 
   → New repository secret
   ```

3. **Додайте Secret:**
   ```
   Name: GH_TOKEN
   Value: ghp_xxxxx...xxxxx (вставьте скопійований токен)
   ```

4. **Натисніть "Add secret"**

✅ **Готово! Токен тепер захищений на GitHub сервері.**

---

## 📁 КРОК 3: Клонуйте або Спочатку Ініціалізуйте Репо

### Варіант А: Якщо репо НОВИЙ (не існує на GitHub)

1. **Створіть порожній репо на GitHub**
   ```
   GitHub → Your repositories → New
   Repository name: svarog-center-v3
   Description: SVAROG Command Center v3.1.0
   Public (для бібліотеки + auto-update)
   Do NOT initialize with README
   Create repository
   ```

2. **На вашому комп'ютері:**
   ```bash
   cd /path/to/svarog-center-v3-full
   git init
   git add .
   git commit -m "Initial commit - SVAROG v3.1.0"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/svarog-center-v3.git
   git push -u origin main
   ```

### Варіант Б: Якщо репо вже існує

```bash
cd svarog-center-v3
git pull origin main
git add .
git commit -m "Update - SVAROG v3.1.0"
git push origin main
```

---

## 🔄 КРОК 4: Перевірте GitHub Actions

1. **Перейдіть на репо**
   ```
   GitHub → YOUR_USERNAME/svarog-center-v3
   ```

2. **Натисніть "Actions"**
   ```
   Repository → Actions tab
   ```

3. **Переглядайте workflow запуски**
   ```
   Build and Release Electron App
   │
   └── push to main → triggered ✅
       └── windows-latest (5-10 хв)
       └── macos-latest (8-15 хв)
       └── create-release
   ```

4. **Очікуйте завершення**
   - 🟡 Yellow = In progress
   - 🟢 Green = Success ✅
   - 🔴 Red = Failed (дивись логи)

---

## 📊 ПЕРШИЙ ЗАПУСК (що станеться)

### Коли ви пушите код:

```
00:00 - git push origin main

00:05 - GitHub Actions запустилась
        ├─ windows-latest job почався
        └─ macos-latest job почався

00:30 - Windows build в прогресі (npm run dist:win)
01:00 - macOS build в прогресі (npm run dist:mac)

03:00 - Обидва build готові ✅
        ├─ svarog-center-Setup-3.1.0.exe (Windows)
        └─ svarog-center-3.1.0.dmg (macOS)

03:15 - Release v3.1.0 створено автоматично ✅
        GitHub Releases → v3.1.0
        ├─ svarog-center-Setup-3.1.0.exe
        └─ svarog-center-3.1.0.dmg

03:20 - Users можуть завантажити! 🎉
```

---

## ✅ ПЕРЕВІРЯ УСПІХУ

### 1. Actions вкладка показує ✅

```
"Build and Release Electron App" → ✅ All passed
└── build (windows-latest) ✅
└── build (macos-latest) ✅
└── create-release ✅
```

### 2. Releases вкладка показує релиз

```
GitHub → Releases
v3.1.0
├── ✅ svarog-center-Setup-3.1.0.exe
└── ✅ svarog-center-3.1.0.dmg
```

### 3. Артефакти завантажені

```
Releases → v3.1.0
"Assets"
├─ svarog-center-Setup-3.1.0.exe (120 MB)
└─ svarog-center-3.1.0.dmg (140 MB)
```

---

## 🔧 УСТРАНЕНИЕ НЕПОЛАДОК

### ❌ GitHub Actions запал з помилкою

1. **Дивіться логи:**
   ```
   Actions → Build and Release Electron App
   → [найостанніший запуск]
   → Кліки на step що упав
   ```

2. **Частих помилок:**

   **Error: "GH_TOKEN not set"**
   - ✅ Перевірте, що GH_TOKEN додан в Secrets
   - ✅ Перевірте назву: точно "GH_TOKEN"
   - ✅ Перевірте, що токен має права "repo"

   **Error: "npm ERR! code ERESOLVE"**
   - Очистьте npm cache локально:
   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   git push origin main
   ```

   **Error: "electron-builder: Cannot publish"**
   - GH_TOKEN не має прав на публікацію
   - Перевірте que token має "repo:status" і "repo_deployment"

3. **Пересувати workflow:
   ```bash
   git add .
   git commit -m "Fix CI/CD"
   git push origin main
   ```
   Workflow почнеться з нуля.

---

## 🚀 ЗВИЧАЙНИЙ WORKFLOW

Як скоро все налаштовано, ваша робота така:

### Коли потрібен новий Release:

```bash
# 1. Обновіть версію
nano package.json
# Змініть "version": "3.1.0" → "3.2.0"

# 2. Коміт
git add package.json
git commit -m "Release v3.2.0"

# 3. Пушіть
git push origin main

# 4. GitHub Actions автоматично:
#    - Вбудує для Windows & macOS
#    - Створить Release v3.2.0
#    - Завантажить обидва файли
#    
# 5. Готово! 🎉
```

---

## 📝 ВАЖНІ ПРИМІТКИ

### 1. Токен безпечний?
- ✅ Так, GitHub Secrets - це encrypted
- ✅ Токен НІКОЛИ не показується в логах
- ✅ Токен НІКОЛИ не закомичується в репо
- ❌ НІКОЛИ не публікуйте токен!

### 2. Скільки коштує?
- ✅ GitHub Actions ВІЛЬНИЙ для публічних репо
- ✅ 2000 хвилин на місяць для приватних репо
- ✅ Наш workflow: ~15 хвилин на build = 240 + хвилин

### 3. Хто може завантажити?
- ✅ Хто завгодно з інтернету
- ✅ Не потрібна аутентифікація
- ✅ Користувачи можуть запустити `.exe` або `.dmg`

### 4. Auto-update працює?
- ✅ Так! Electron-updater шукає GitHub Releases
- ✅ Якщо версія > нинішньої, запропонує update
- ✅ Користувачи завантажать новий build автоматично

---

## 🎯 CHECKLIST

Перед першим push:

- [ ] GitHub репо створено (public)
- [ ] GitHub Personal Access Token створений
- [ ] GH_TOKEN додан в GitHub Secrets
- [ ] .github/workflows/build.yml в репо
- [ ] package.json версія 3.1.0
- [ ] Готово пушити!

```bash
# Финальний push:
git add .
git commit -m "Setup GitHub Actions - SVAROG v3.1.0"
git push origin main

# GitHub Actions почнеться автоматично! 🚀
```

---

## 📞 ПОТРІБНА ДОПОМОГА?

- **GitHub Docs:** https://docs.github.com/en/actions
- **electron-builder:** https://www.electron.build/
- **GitHub Secrets:** https://docs.github.com/en/actions/security-guides/encrypted-secrets

---

**Успішного налаштування GitHub Actions! 🎉**
