# Draws the app icons and the social preview image (Windows, no extra tools needed).
# Run: powershell -File scripts/icons.ps1
Add-Type -AssemblyName System.Drawing
$out = Join-Path $PSScriptRoot "..\public"
$pink = [System.Drawing.ColorTranslator]::FromHtml("#ff5c8a")
$bg = [System.Drawing.ColorTranslator]::FromHtml("#0e1020")

function Draw-Bubble($g, [float]$x, [float]$y, [float]$s) {
  # Chat bubble with two eyes, same shape as favicon.svg (64-unit grid).
  $k = $s / 64
  $white = [System.Drawing.Brushes]::White
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $path.AddArc($x + 10 * $k, $y + 18 * $k, 12 * $k, 12 * $k, 180, 90)
  $path.AddArc($x + 42 * $k, $y + 18 * $k, 12 * $k, 12 * $k, 270, 90)
  $path.AddArc($x + 42 * $k, $y + 32 * $k, 12 * $k, 12 * $k, 0, 90)
  $path.AddLine($x + 30 * $k, $y + 44 * $k, $x + 20 * $k, $y + 52 * $k)
  $path.AddLine($x + 20 * $k, $y + 52 * $k, $x + 20 * $k, $y + 44 * $k)
  $path.AddArc($x + 10 * $k, $y + 32 * $k, 12 * $k, 12 * $k, 90, 90)
  $path.CloseFigure()
  $g.FillPath($white, $path)
  $eye = New-Object System.Drawing.SolidBrush($pink)
  $g.FillEllipse($eye, $x + 22 * $k, $y + 28 * $k, 6 * $k, 6 * $k)
  $g.FillEllipse($eye, $x + 36 * $k, $y + 28 * $k, 6 * $k, 6 * $k)
}

function New-Canvas($w, $h) {
  $bmp = New-Object System.Drawing.Bitmap($w, $h)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = "AntiAlias"
  $g.TextRenderingHint = "AntiAliasGridFit"
  return $bmp, $g
}

foreach ($size in 180, 192, 512) {
  $bmp, $g = New-Canvas $size $size
  $g.Clear($pink)
  Draw-Bubble $g ($size * 0.1) ($size * 0.08) ($size * 0.8)
  $bmp.Save("$out\icon-$size.png", [System.Drawing.Imaging.ImageFormat]::Png)
  $g.Dispose(); $bmp.Dispose()
}

# 1200x630 social preview (WhatsApp, Facebook, X link cards)
$bmp, $g = New-Canvas 1200 630
$g.Clear($bg)
$g.FillEllipse((New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(60, 123, 108, 255))), 700, -250, 800, 800)
$tile = New-Object System.Drawing.Drawing2D.GraphicsPath
$tile.AddArc(90, 90, 40, 40, 180, 90); $tile.AddArc(230, 90, 40, 40, 270, 90)
$tile.AddArc(230, 230, 40, 40, 0, 90); $tile.AddArc(90, 230, 40, 40, 90, 90); $tile.CloseFigure()
$g.FillPath((New-Object System.Drawing.SolidBrush($pink)), $tile)
Draw-Bubble $g 98 94 164
$white = [System.Drawing.Brushes]::White
$muted = New-Object System.Drawing.SolidBrush([System.Drawing.ColorTranslator]::FromHtml("#a3aacb"))
$g.DrawString("Yaari", (New-Object System.Drawing.Font("Segoe UI", 64, [System.Drawing.FontStyle]::Bold)), $white, 300, 112)
$g.DrawString("Meet", (New-Object System.Drawing.Font("Segoe UI", 64, [System.Drawing.FontStyle]::Bold)), (New-Object System.Drawing.SolidBrush($pink)), 545, 112)
$g.DrawString("Random video chat with strangers in India", (New-Object System.Drawing.Font("Segoe UI", 40, [System.Drawing.FontStyle]::Bold)), $white, 90, 340)
$g.DrawString("Free  ·  No download  ·  Verified profiles", (New-Object System.Drawing.Font("Segoe UI", 30)), $muted, 92, 430)
$bmp.Save("$out\og.png", [System.Drawing.Imaging.ImageFormat]::Png)
$g.Dispose(); $bmp.Dispose()
Write-Output "icons written"
