$moduleName = "cold-blood-module"
$zipName = "module.zip"

if (Test-Path $zipName) {
    Remove-Item $zipName
}

# Compress the contents of the module directory
Compress-Archive -Path "$moduleName\*" -DestinationPath $zipName

Write-Host "Build complete: $zipName created."
