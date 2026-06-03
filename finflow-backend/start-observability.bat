@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo   FinFlow Observability Stack - local optimized
echo ===================================================

:: Set the base observability path based on the current script location
set "BASE_DIR=%~dp0"

:: Set customizable environment-overrideable paths
if not defined PROMETHEUS_DIR set "PROMETHEUS_DIR=%BASE_DIR%prometheus-3.1.0.windows-amd64"
if not defined LOKI_DIR set "LOKI_DIR=%BASE_DIR%loki"
if not defined PROMTAIL_DIR set "PROMTAIL_DIR=%BASE_DIR%promtail"
if not defined GRAFANA_DIR set "GRAFANA_DIR=%BASE_DIR%GrafanaLabs\grafana\bin"
if not defined SONARQUBE_DIR set "SONARQUBE_DIR=%BASE_DIR%sonarqube\bin\windows-x86-64"
if not defined ZIPKIN_PATH set "ZIPKIN_PATH=%BASE_DIR%zipkin.jar"

:: 1. Start Loki FIRST
echo [*] Starting Grafana Loki from !LOKI_DIR!...
if exist "!LOKI_DIR!\loki-windows-amd64.exe" (
    start "Loki" cmd /k "cd /d !LOKI_DIR! && loki-windows-amd64.exe --config.file=loki-config.yaml"
    timeout /t 5 >nul
) else (
    echo [!] WARNING: Grafana Loki not found at !LOKI_DIR!. Skipping...
)

:: 2. Start Zipkin
echo [*] Starting Zipkin Distributed Tracing...
if exist "!ZIPKIN_PATH!" (
    start "Zipkin" cmd /k "java -jar "!ZIPKIN_PATH!""
    timeout /t 2 >nul
) else if exist "E:\zipkin.jar" (
    start "Zipkin" cmd /k "java -jar E:\zipkin.jar"
    timeout /t 2 >nul
) else (
    echo [!] WARNING: Zipkin binary not found at !ZIPKIN_PATH! or E:\zipkin.jar. Skipping...
)

:: 3. Start Prometheus
echo [*] Starting Prometheus from !PROMETHEUS_DIR!...
set "PROM_CONFIG=%BASE_DIR%observability\prometheus.yml"
if exist "!PROMETHEUS_DIR!\prometheus.exe" (
    start "Prometheus" cmd /k "cd /d !PROMETHEUS_DIR! && prometheus.exe --config.file="!PROM_CONFIG!""
    timeout /t 2 >nul
) else (
    echo [!] WARNING: Prometheus not found at !PROMETHEUS_DIR!. Skipping...
)

:: 4. Start Promtail
echo [*] Starting Promtail Log Scraper from !PROMTAIL_DIR!...
if exist "!PROMTAIL_DIR!\promtail-windows-amd64.exe" (
    start "Promtail" cmd /k "cd /d !PROMTAIL_DIR! && promtail-windows-amd64.exe --config.file=promtail-config.yaml"
    timeout /t 2 >nul
) else (
    echo [!] WARNING: Promtail not found at !PROMTAIL_DIR!. Skipping...
)

:: 5. Start Grafana
echo [*] Starting Grafana Visualization from !GRAFANA_DIR!...
if exist "!GRAFANA_DIR!\grafana-server.exe" (
    start "Grafana" cmd /k "cd /d !GRAFANA_DIR! && grafana-server.exe"
    timeout /t 2 >nul
) else (
    echo [!] WARNING: Grafana not found at !GRAFANA_DIR!. Skipping...
)

:: 6. Start SonarQube
echo [*] Starting SonarQube Code Quality from !SONARQUBE_DIR!...
if exist "!SONARQUBE_DIR!\StartSonar.bat" (
    start "SonarQube" cmd /k "cd /d !SONARQUBE_DIR! && StartSonar.bat"
) else if exist "E:\backup\toppings\sonarqube-9.9.5.90363\bin\windows-x86-64\StartSonar.bat" (
    start "SonarQube" cmd /k "cd /d E:\backup\toppings\sonarqube-9.9.5.90363\bin\windows-x86-64 && StartSonar.bat"
) else (
    echo [!] WARNING: SonarQube not found at !SONARQUBE_DIR! or fallback path. Skipping...
)

echo.
echo ===================================================
echo [SUCCESS] Observability Stack is coming up!
echo ---------------------------------------------------
echo Loki Push: http://localhost:3100/loki/api/v1/push
echo Zipkin:    http://localhost:9411
echo Grafana:   http://localhost:3000
echo SonarQube: http://localhost:9000
echo ===================================================
echo.
pause
