<#
.SYNOPSIS
    Prepara shopcloud_test: crea la base si falta y aplica los scripts en orden.

.DESCRIPTION
    Solo trabaja sobre shopcloud_test. Se detiene sin cambiar nada si el esquema
    ya tiene tablas, porque 01 y 02 están pensados para aplicarse una sola vez.

    Requiere la variable de entorno DB_PASSWORD.

.EXAMPLE
    ./database/aplicar.ps1             # aplicación, esquema public
    ./database/aplicar.ps1 -Schema it  # pruebas de integración, esquema it
#>
param(
    [ValidateSet('public', 'it')]
    [string]$Schema = 'public',
    [string]$PsqlPath = 'C:\Program Files\PostgreSQL\17\bin\psql.exe',
    [string]$DbHost = 'localhost',
    [string]$DbUser = 'postgres'
)

$ErrorActionPreference = 'Stop'
$Database = 'shopcloud_test'

if (-not $env:DB_PASSWORD) {
    throw 'Define la variable de entorno DB_PASSWORD antes de ejecutar este script.'
}
$env:PGPASSWORD = $env:DB_PASSWORD
$env:PGCLIENTENCODING = 'UTF8'

function Invoke-Psql {
    param([string]$Db, [string[]]$Arguments)
    $salida = & $PsqlPath -h $DbHost -U $DbUser -d $Db -v ON_ERROR_STOP=1 -At @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "psql termino con error en la base $Db."
    }
    return $salida
}

$existe = Invoke-Psql 'postgres' @('-c', "SELECT 1 FROM pg_database WHERE datname = '$Database'")
if (-not $existe) {
    Invoke-Psql 'postgres' @('-c', "CREATE DATABASE $Database ENCODING 'UTF8' TEMPLATE template0") | Out-Null
    Write-Output "Base $Database creada."
}

Invoke-Psql $Database @('-c', "CREATE SCHEMA IF NOT EXISTS $Schema") | Out-Null

$tablas = Invoke-Psql $Database @('-c', "SELECT count(*) FROM pg_tables WHERE schemaname = '$Schema'")
if ([int]$tablas -gt 0) {
    throw "El esquema $Schema de $Database ya tiene $tablas tablas. No se aplico nada."
}

$env:PGOPTIONS = "-c search_path=$Schema"
try {
    foreach ($archivo in @(
        '01_shopcloud_postgresql.sql',
        '02_suscripciones_prueba_gratuita.sql',
        '03_datos_iniciales_planes.sql'
    )) {
        Invoke-Psql $Database @('-q', '-f', (Join-Path $PSScriptRoot $archivo)) | Out-Null
        Write-Output "Aplicado: $archivo"
    }
}
finally {
    Remove-Item Env:\PGOPTIONS -ErrorAction SilentlyContinue
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}

Write-Output "Esquema $Schema de $Database listo."
