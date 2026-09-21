# ============================================================================
# Planificateur de tâches Windows pour la démonstration (O02)
# Lance scripts/cron-tick.mjs toutes les heures.
# ============================================================================
param(
    [string]$Jeton,
    [string]$Url = "http://localhost:3000"
)

$Jeton = if ($Jeton) { $Jeton } else { $env:CRON_TOKEN }
if (-not $Jeton) {
    Write-Host "Jeton requis : ./creer_tache_planifiee.ps1 -Jeton votreJeton"
    exit 1
}

$Script = Resolve-Path "$PSScriptRoot\cron-tick.mjs" | Select-Object -ExpandProperty Path
$Action = New-ScheduledTaskAction -Execute "node.exe" -Argument "`"$Script`"" -WorkingDirectory (Split-Path $Script)
$Trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1) -RepetitionDuration (New-TimeSpan -Days 365)
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -MultipleInstances IgnoreNew

Register-ScheduledTask -TaskName "ITOM-Sauvegarde-Horaire" -Action $Action -Trigger $Trigger -Settings $Settings -Description "IT Operations Manager - tache planifiee de sauvegarde (demo)" -Force | Out-Null

Write-Host "Tache 'ITOM-Sauvegarde-Horaire' creee (toutes les heures)."
Write-Host "Attention : definissez CRON_TOKEN dans la tache (registre/Variables d'environnement) avant de demarrer."