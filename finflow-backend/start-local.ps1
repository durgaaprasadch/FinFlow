# Start FinFlow Microservices Locally
# This script opens a new PowerShell window for each microservice.

Write-Host "Starting FinFlow Microservices Locally..." -ForegroundColor Cyan
Write-Host "Please ensure MySQL, RabbitMQ, and Redis are running locally." -ForegroundColor Yellow

$services = @(
    "config-server",
    "eureka-server",
    "api-gateway",
    "auth-service",
    "application-service",
    "admin-service",
    "document-service",
    "notification-service"
)

foreach ($service in $services) {
    Write-Host "Starting $service..."
    Start-Process powershell -ArgumentList "-NoExit -Command `"cd $service; `$env:MAVEN_OPTS='-Xmx256m -Xms128m'; mvn spring-boot:run`""
    
    # Wait a bit before starting the next service to allow config/eureka to boot
    if ($service -eq "config-server" -or $service -eq "eureka-server") {
        Start-Sleep -Seconds 15
    } else {
        Start-Sleep -Seconds 5
    }
}

Write-Host "All services have been started in separate windows." -ForegroundColor Green
