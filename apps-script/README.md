# Apps Script Sync — `Orchestrator_main`

Two-way sync zwischen diesem Repo und dem Google Apps Script Projekt
`1Y4Ls602_4FfBZ09R6Lm0GeZufcI_jyfVbuSeLmzZa5zEf7ufU3C_zLM3`.

- **Du committest** → GitHub Action pusht automatisch zu Apps Script und erstellt ein versioniertes Deployment.
- **Jemand bearbeitet im Apps Script Editor** → einmal `Apps Script - Pull from Google` Action starten (oder warten auf den nightly run um 03:17 UTC), Änderungen landen als PR im Repo.

---

## Einmaliges Setup (ca. 3 Minuten)

Nur einmal nötig. Danach ist alles automatisch.

### 1. clasp lokal installieren und einloggen

Auf deinem Rechner — **nicht** im Codespace, weil clasp einen Browser zur Authentifizierung öffnet:

```bash
npm install -g @google/clasp
clasp login
```

Browser öffnet sich → mit dem Google-Konto einloggen, das Zugriff auf das Apps Script Projekt hat → "Allow".

clasp speichert dein Refresh-Token in `~/.clasprc.json`.

### 2. Apps Script API aktivieren

Einmalig: <https://script.google.com/home/usersettings> → "Google Apps Script API" auf **ON**.

### 3. Bestehenden Code aus Apps Script ziehen

```bash
cd apps-script
clasp pull
```

Das ersetzt die Skeleton-`Code.gs` durch deinen echten Projektinhalt. Danach committen:

```bash
git add apps-script/
git commit -m "chore(apps-script): initial pull from Apps Script project"
git push
```

### 4. clasp-Credentials als GitHub-Secret hinterlegen

Damit die GitHub Action im Namen deines Google-Kontos pushen kann:

```bash
# Inhalt der Credentials-Datei anzeigen
cat ~/.clasprc.json
```

Den **kompletten JSON-Inhalt** kopieren, dann im Repo:

`Settings` → `Secrets and variables` → `Actions` → **`New repository secret`**

- Name: `CLASPRC_JSON`
- Secret: (eingefügter JSON-Inhalt)

→ `Add secret`

### Fertig.

Ab jetzt:
- Jeder Commit auf `main` oder `claude/debug-apps-script-wZ6bm`, der etwas in `apps-script/` ändert, wird automatisch nach Google Apps Script gepusht und versioniert deployed.
- Über `Actions` → `Apps Script - Pull from Google` → `Run workflow` kannst du jederzeit Änderungen, die jemand im Editor gemacht hat, zurück in den Repo holen.

---

## Tägliche Arbeit

### Code im Repo bearbeiten (empfohlen)

```bash
# bearbeiten in apps-script/*.gs
git add apps-script/
git commit -m "feat: neue Funktion"
git push
```

GitHub Action macht den Rest. Status: `Actions` Tab.

### Code im Apps Script Editor bearbeiten

Wenn du direkt im Apps Script Editor arbeitest, ziehe die Änderungen zurück:

- **Manuell**: GitHub `Actions` → `Apps Script - Pull from Google` → `Run workflow`
- **Automatisch**: passiert nightly um 03:17 UTC, öffnet einen Draft-PR

### Lokal pushen (ohne Commit)

```bash
cd apps-script
npm install     # einmalig
npm run push    # = clasp push -f
npm run logs    # live Stackdriver-Logs
npm run open    # öffnet das Projekt im Browser
```

---

## Fehlerbehebung

| Symptom | Ursache | Lösung |
|---|---|---|
| Action fehlt mit `Missing repo secret CLASPRC_JSON` | Secret nicht gesetzt | Schritt 4 oben durchführen |
| Action fehlt mit `invalid_grant` oder `Token has been expired` | Refresh-Token abgelaufen oder widerrufen | Lokal `clasp login` neu, `cat ~/.clasprc.json` ins Secret übernehmen |
| `User has not enabled the Apps Script API` | API-Toggle aus | Schritt 2 oben |
| `clasp pull` zieht nichts | Falsche `scriptId` in `.clasp.json` | ID prüfen — sollte `1Y4Ls602_4FfBZ09R6Lm0GeZufcI_jyfVbuSeLmzZa5zEf7ufU3C_zLM3` sein |
| Push schreibt Code, aber Web App zeigt alte Version | Apps Script unterscheidet "Head" und veröffentlichtes Deployment | Action erstellt automatisch ein neues versioniertes Deployment; sonst manuell im Editor → `Bereitstellen` → `Bereitstellung verwalten` |

---

## Sicherheit

- `~/.clasprc.json` und alle Varianten sind in `.gitignore` — niemals committen.
- Das `CLASPRC_JSON` Secret enthält ein Refresh-Token mit Vollzugriff auf deine Apps Script Projekte. Nur in einem privaten Repo verwenden.
- Bei Verdacht auf Leak: <https://myaccount.google.com/permissions> → `clasp – The Apps Script CLI` → Zugriff entfernen, dann lokal `clasp login` neu, Secret aktualisieren.
