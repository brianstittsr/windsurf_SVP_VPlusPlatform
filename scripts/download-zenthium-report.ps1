# PowerShell script to download Zenthium report as Markdown
# Usage: .\scripts\download-zenthium-report.ps1

$baseUrl = Read-Host "Enter your site URL (default: http://localhost:3000)"
if ([string]::IsNullOrWhiteSpace($baseUrl)) {
    $baseUrl = "http://localhost:3000"
}

$outputDir = "_exports"
if (!(Test-Path $outputDir)) {
    New-Item -ItemType Directory -Path $outputDir -Force
}

$date = Get-Date -Format "yyyy-MM-dd"
$outputFile = "$outputDir\zenthium-submissions-$date.md"

Write-Host "📥 Downloading Zenthium report from $baseUrl..."

try {
    Invoke-WebRequest -Uri "$baseUrl/api/zenthium/report/markdown" -OutFile $outputFile -ErrorAction Stop
    Write-Host "✅ Report downloaded successfully!" -ForegroundColor Green
    Write-Host "📄 File saved to: $outputFile" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "File location: $(Resolve-Path $outputFile)"
} catch {
    Write-Host "❌ Failed to download report" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Make sure your Next.js dev server is running (npm run dev)" -ForegroundColor Yellow
}

Pause
