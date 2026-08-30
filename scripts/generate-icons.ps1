# Erzeugt die PWA-Icons aus dem gleichen Motiv wie favicon.svg.
# Aufruf: powershell -File scripts/generate-icons.ps1
Add-Type -AssemblyName System.Drawing

function New-Icon([int]$size, [string]$path) {
    $bmp = New-Object System.Drawing.Bitmap($size, $size)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias

    $bg = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(31, 41, 55))
    $g.FillRectangle($bg, 0, 0, $size, $size)

    $s = $size / 32.0
    $pen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(249, 250, 251), (2 * $s))
    $g.DrawRectangle($pen, (7 * $s), (9 * $s), (18 * $s), (15 * $s))
    $g.DrawLine($pen, (7 * $s), (14 * $s), (25 * $s), (14 * $s))
    $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
    $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
    $g.DrawLine($pen, (11 * $s), (6 * $s), (11 * $s), (11 * $s))
    $g.DrawLine($pen, (21 * $s), (6 * $s), (21 * $s), (11 * $s))

    $dot = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(79, 70, 229))
    $g.FillEllipse($dot, (13.5 * $s), (16.5 * $s), (5 * $s), (5 * $s))

    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose(); $pen.Dispose(); $bg.Dispose(); $dot.Dispose()
}

$public = (Resolve-Path (Join-Path $PSScriptRoot '..\public')).Path
New-Icon 192 (Join-Path $public 'icon-192.png')
New-Icon 512 (Join-Path $public 'icon-512.png')
Write-Output 'Icons erzeugt.'
