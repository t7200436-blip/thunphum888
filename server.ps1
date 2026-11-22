# ==============================================================================
# Royal VIP Club & PG SOFT™ Simulated Server
# Serves static assets and provides an official PG Soft backend API simulation
# ==============================================================================

$port = 8000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Prefixes.Add("http://127.0.0.1:$port/")

try {
    $listener.Start()
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host " [PG SOFT GAME SERVER BACKEND] Running at:" -ForegroundColor Green
    Write-Host " Base URL:  http://localhost:$port/" -ForegroundColor Yellow
    Write-Host " Game Spin: http://localhost:$port/game-api/{gameId}/v2/Spin" -ForegroundColor Magenta
    Write-Host " (Press Ctrl+C to stop the server)" -ForegroundColor Gray
    Write-Host "=================================================" -ForegroundColor Cyan
} catch {
    Write-Host "Failed to start listener on port $port : $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".htm"  = "text/html; charset=utf-8"
    ".css"  = "text/css; charset=utf-8"
    ".js"   = "application/javascript; charset=utf-8"
    ".json" = "application/json; charset=utf-8"
    ".png"  = "image/png"
    ".jpg"  = "image/jpeg"
    ".jpeg" = "image/jpeg"
    ".webp" = "image/webp"
    ".svg"  = "image/svg+xml"
    ".ico"  = "image/x-icon"
    ".woff" = "font/woff"
    ".woff2"= "font/woff2"
    ".wasm" = "application/wasm"
}

$root = $PSScriptRoot
if (-not $root) { $root = (Get-Location).Path }

# Balance & State persistence
$balanceFile = [System.IO.Path]::Combine($root, "balance.json")
if (-not [System.IO.File]::Exists($balanceFile)) {
    @{ balance = 50000.0; godMode = "none" } | ConvertTo-Json | Set-Content $balanceFile
}

function Get-ServerState {
    try {
        if ([System.IO.File]::Exists($balanceFile)) {
            $json = Get-Content $balanceFile -Raw | ConvertFrom-Json
            return $json
        }
    } catch {}
    return @{ balance = 50000.0; godMode = "none" }
}

function Save-ServerState($state) {
    try {
        $state | ConvertTo-Json | Set-Content $balanceFile
    } catch {}
}

# Aztec Symbols & Payout Table (Multipliers for 3, 4, 5, 6 of a kind)
$PAYTABLE = @{
    "mask_gold"    = @(0, 0, 0, 30, 40, 60, 80)
    "mask_red"     = @(0, 0, 0, 20, 25, 50, 70)
    "pink_dragon"  = @(0, 0, 0, 10, 25, 40, 60)
    "purple_totem" = @(0, 0, 0, 8,  15, 20, 30)
    "green_totem"  = @(0, 0, 0, 6,  10, 12, 15)
    "blue_disc"    = @(0, 0, 0, 6,  10, 12, 15)
    "card_A"       = @(0, 0, 0, 4,  6,  8,  10)
    "card_K"       = @(0, 0, 0, 4,  6,  8,  10)
    "card_Q"       = @(0, 0, 0, 2,  3,  5,  6)
    "card_J"       = @(0, 0, 0, 2,  3,  5,  6)
    "card_10"      = @(0, 0, 0, 1,  2,  3,  4)
}

$SYM_LIST = @("mask_gold", "mask_red", "pink_dragon", "purple_totem", "green_totem", "blue_disc", "card_A", "card_K", "card_Q", "card_J", "card_10")

# Spin Engine Simulator for PG Soft (Treasures of Aztec 6x5 + Top Carousel)
function Invoke-PgAztecSpin($bet, $forcedMode) {
    $state = Get-ServerState
    $currentBal = [double]$state.balance
    if ($currentBal -lt $bet) {
        return @{ err = @{ cd = "1002"; msg = "Insufficient Balance" } }
    }

    # Deduct bet
    $currentBal -= $bet

    # Generate 6 Columns (Reels 1..6) and 1 Top Carousel (4 symbols on reels 2..5)
    $grid = @()
    $topReel = @()

    if ($forcedMode -eq "big_win") {
        # Forced 5-of-a-kind Gold Mask on all reels
        for ($c = 0; $c -lt 6; $c++) {
            $col = @()
            for ($r = 0; $r -lt 5; $r++) {
                if ($c -lt 5) {
                    $col += "mask_gold"
                } else {
                    $col += $SYM_LIST[(Get-Random -Maximum $SYM_LIST.Count)]
                }
            }
            $grid += ,$col
        }
        $topReel = @("mask_gold", "wild", "mask_gold", "wild")
    } elseif ($forcedMode -eq "scatter") {
        # Forced 4 Scatters for Free Spins
        for ($c = 0; $c -lt 6; $c++) {
            $col = @()
            for ($r = 0; $r -lt 5; $r++) {
                if ($r -eq 0 -and ($c -eq 0 -or $c -eq 2 -or $c -eq 4 -or $c -eq 5)) {
                    $col += "scatter"
                } else {
                    $col += $SYM_LIST[(Get-Random -Maximum $SYM_LIST.Count)]
                }
            }
            $grid += ,$col
        }
        $topReel = @("wild", "card_A", "mask_gold", "card_K")
    } elseif ($forcedMode -eq "wild") {
        for ($c = 0; $c -lt 6; $c++) {
            $col = @()
            for ($r = 0; $r -lt 5; $r++) {
                if ($r -eq 1 -or $r -eq 2) { $col += "wild" }
                else { $col += $SYM_LIST[(Get-Random -Maximum $SYM_LIST.Count)] }
            }
            $grid += ,$col
        }
        $topReel = @("wild", "wild", "wild", "wild")
    } elseif ($forcedMode -eq "lose") {
        # No matching symbols
        for ($c = 0; $c -lt 6; $c++) {
            $col = @()
            for ($r = 0; $r -lt 5; $r++) {
                $col += $SYM_LIST[($c + $r * 2) % $SYM_LIST.Count]
            }
            $grid += ,$col
        }
        $topReel = @("card_10", "card_J", "card_Q", "blue_disc")
    } else {
        # Normal High-RTP random spin
        for ($c = 0; $c -lt 6; $c++) {
            $col = @()
            for ($r = 0; $r -lt 5; $r++) {
                $rnd = Get-Random -Maximum 100
                if ($rnd -lt 3 -and $c -gt 0 -and $c -lt 5) {
                    $col += "wild"
                } elseif ($rnd -lt 7) {
                    $col += "scatter"
                } else {
                    $col += $SYM_LIST[(Get-Random -Maximum $SYM_LIST.Count)]
                }
            }
            $grid += ,$col
        }
        for ($t = 0; $t -lt 4; $t++) {
            $rnd = Get-Random -Maximum 100
            if ($rnd -lt 15) { $topReel += "wild" }
            else { $topReel += $SYM_LIST[(Get-Random -Maximum $SYM_LIST.Count)] }
        }
    }

    # Evaluate Ways & Wins
    $totalWin = 0.0
    $multiplier = 1
    $winLines = @{}
    $scatterCount = 0

    # Count Scatters
    foreach ($col in $grid) {
        foreach ($s in $col) { if ($s -eq "scatter") { $scatterCount++ } }
    }

    # Evaluate wins for each symbol
    foreach ($sym in $SYM_LIST) {
        $payouts = $PAYTABLE[$sym]
        $matchColCount = 0
        $ways = 1

        for ($c = 0; $c -lt 6; $c++) {
            $symInCol = 0
            foreach ($s in $grid[$c]) {
                if ($s -eq $sym -or $s -eq "wild") { $symInCol++ }
            }
            # Top reel check (reels 1,2,3,4 mapped to columns 1,2,3,4)
            if ($c -ge 1 -and $c -le 4) {
                $ts = $topReel[$c - 1]
                if ($ts -eq $sym -or $ts -eq "wild") { $symInCol++ }
            }

            if ($symInCol -gt 0) {
                $matchColCount++
                $ways *= $symInCol
            } else {
                break
            }
        }

        if ($matchColCount -ge 3) {
            $basePayout = $payouts[$matchColCount]
            $lineWin = ($bet / 20.0) * $basePayout * $ways
            $totalWin += $lineWin
            $winLines[$sym] = @{
                match = $matchColCount
                ways  = $ways
                win   = [Math]::Round($lineWin, 2)
            }
        }
    }

    $isFreeSpin = $scatterCount -ge 4
    if ($isFreeSpin) {
        $multiplier = 8
        $totalWin *= 2
    }

    $totalWin = [Math]::Round($totalWin, 2)
    $currentBal += $totalWin

    # Save state
    $state.balance = [Math]::Round($currentBal, 2)
    Save-ServerState $state

    $spinId = [System.Guid]::NewGuid().ToString()

    return @{
        dt = @{
            si = @{
                sid      = $spinId
                tb       = $bet
                tw       = $totalWin
                rw       = $totalWin
                bl       = $state.balance
                ml       = $multiplier
                cwc      = if ($totalWin -gt 0) { 2 } else { 0 }
                rl       = $grid
                top      = $topReel
                lw       = $winLines
                sc       = $scatterCount
                fs       = if ($isFreeSpin) { @{ count = 10; multiplier = 8 } } else { $null }
                server   = "PG-SOFT-SIMULATED-ENGINE-87"
                godApplied = $forcedMode
            }
        }
        err = $null
    }
}

while ($listener.IsListening) {
    try {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        # Full CORS & Cross-Origin support
        $response.AddHeader("Access-Control-Allow-Origin", "*")
        $response.AddHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT")
        $response.AddHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, otk, traceId")
        $response.AddHeader("Cross-Origin-Resource-Policy", "cross-origin")
        $response.AddHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups")

        if ($request.HttpMethod -eq "OPTIONS") {
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        $rawUrl = [System.Uri]::UnescapeDataString($request.Url.AbsolutePath)
        $logLine = "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] $($request.HttpMethod) $rawUrl"
        Add-Content -Path (Join-Path $root "server.log") -Value $logLine -ErrorAction SilentlyContinue
        Write-Host "[REQ] $($request.HttpMethod) $rawUrl" -ForegroundColor Cyan
        
        # Read body for POST requests
        $bodyText = ""
        if ($request.HasEntityBody) {
            $reader = New-Object System.IO.StreamReader($request.InputStream, [System.Text.Encoding]::UTF8)
            $bodyText = $reader.ReadToEnd()
        }

        # ==============================================================
        # 1. PG SOFT SIMULATED API: Session Verification & Initial Wallet
        # ==============================================================
        if ($rawUrl -match "/web-api/auth/session/" -or $rawUrl -match "verifyOperatorPlayerSession" -or $rawUrl -match "verifySession") {
            $state = Get-ServerState
            Write-Host "[PG SIM SERVER] Session Verified! Player Balance: $($state.balance) THB" -ForegroundColor Green
            $respData = @{
                dt = @{
                    pbc = "ROYAL_VIP_CLUB"
                    cc  = "THB"
                    cs  = @(0.02, 0.2, 2.0)
                    ml  = @(1, 2, 3, 4, 5, 6, 7, 8, 9, 10)
                    bm  = 20
                    bl  = $state.balance
                    tb  = 0
                    tw  = 0
                    tk  = "simulated_pg_session_token_888"
                    pid = "vip_player_001"
                    pfn = "VIP High Roller"
                    gi  = 87
                    gn  = "Treasures of Aztec"
                    server = "PG-SOFT-SIMULATED-v2.1"
                }
                err = $null
            }
            $jsonBytes = [System.Text.Encoding]::UTF8.GetBytes(($respData | ConvertTo-Json -Depth 6))
            $response.ContentType = "application/json; charset=utf-8"
            $response.ContentLength64 = $jsonBytes.Length
            $response.OutputStream.Write($jsonBytes, 0, $jsonBytes.Length)
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        # ==============================================================
        # 2. PG SOFT SIMULATED API: Game Rule / Operator Trial Launcher / Table Info
        # ==============================================================
        if ($rawUrl -match "/web-api/game-proxy/" -or $rawUrl -match "/web-api/operator-proxy/" -or $rawUrl -match "GameRule" -or $rawUrl -match "GetTable" -or $rawUrl -match "Resources") {
            $state = Get-ServerState
            $respData = @{
                dt = @{
                    gameId = 87
                    gameName = "Treasures of Aztec"
                    balance = $state.balance
                    ways = 32400
                    rtp = 96.71
                }
                err = $null
            }
            $jsonBytes = [System.Text.Encoding]::UTF8.GetBytes(($respData | ConvertTo-Json))
            $response.ContentType = "application/json; charset=utf-8"
            $response.ContentLength64 = $jsonBytes.Length
            $response.OutputStream.Write($jsonBytes, 0, $jsonBytes.Length)
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        # ==============================================================
        # 3. PG SOFT SIMULATED API: Game Spin & Outcome Engine
        # ==============================================================
        if ($rawUrl -match "/game-api/87/v2/Spin" -or $rawUrl -match "/game-api/treasures-of-aztec/v2/Spin" -or $rawUrl -match "/api/pg/spin") {
            $bet = 20.0
            $forced = "none"

            # Parse bet and options from request body
            if ($bodyText) {
                try {
                    $parsed = $bodyText | ConvertFrom-Json
                    if ($parsed.tb) { $bet = [double]$parsed.tb }
                    elseif ($parsed.bet) { $bet = [double]$parsed.bet }
                    if ($parsed.god) { $forced = [string]$parsed.god }
                } catch {
                    # Form-urlencoded fallback
                    if ($bodyText -match "tb=([0-9\.]+)") { $bet = [double]$matches[1] }
                }
            }

            $state = Get-ServerState
            if ($forced -eq "none" -and $state.godMode -and $state.godMode -ne "none") {
                $forced = $state.godMode
            }

            $spinResult = Invoke-PgAztecSpin $bet $forced
            $tw = $spinResult.dt.si.tw
            $newBal = $spinResult.dt.si.bl
            Write-Host "[PG SIM SERVER] SPIN: Bet=฿$bet | Win=฿$tw | Balance=฿$newBal | Mode=$forced" -ForegroundColor Yellow

            $jsonBytes = [System.Text.Encoding]::UTF8.GetBytes(($spinResult | ConvertTo-Json -Depth 8))
            $response.ContentType = "application/json; charset=utf-8"
            $response.ContentLength64 = $jsonBytes.Length
            $response.OutputStream.Write($jsonBytes, 0, $jsonBytes.Length)
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        # ==============================================================
        # 4. PG SOFT SIMULATED API: Real-Time Balance & God Mode Sync
        # ==============================================================
        if ($rawUrl -eq "/api/pg/balance") {
            $state = Get-ServerState
            if ($request.HttpMethod -eq "POST" -and $bodyText) {
                try {
                    $data = $bodyText | ConvertFrom-Json
                    if ($data.balance -ne $null) {
                        $state.balance = [double]$data.balance
                        Save-ServerState $state
                        Write-Host "[PG SIM SERVER] Balance Updated: $($state.balance) THB" -ForegroundColor Cyan
                    }
                } catch {}
            }
            $jsonBytes = [System.Text.Encoding]::UTF8.GetBytes(($state | ConvertTo-Json))
            $response.ContentType = "application/json; charset=utf-8"
            $response.ContentLength64 = $jsonBytes.Length
            $response.OutputStream.Write($jsonBytes, 0, $jsonBytes.Length)
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        # PG SOFT SIMULATED API: Server Status
        if ($rawUrl -eq "/api/pg/status") {
            $state = Get-ServerState
            $respData = @{
                server = "PG-SOFT-SIMULATOR-v2.5"
                port = $port
                status = "ONLINE"
                activeGame = @{ id = 87; name = "Treasures of Aztec"; rtp = 96.71 }
                supportedGames = @(
                    @{ id = 87; name = "Treasures of Aztec" },
                    @{ id = 65; name = "Mahjong Ways" },
                    @{ id = 89; name = "Lucky Neko" },
                    @{ id = 104; name = "Wild Bandito" },
                    @{ id = 1543462; name = "Fortune Rabbit" }
                )
                balance = $state.balance
                godMode = $state.godMode
            }
            $jsonBytes = [System.Text.Encoding]::UTF8.GetBytes(($respData | ConvertTo-Json -Depth 5))
            $response.ContentType = "application/json; charset=utf-8"
            $response.ContentLength64 = $jsonBytes.Length
            $response.OutputStream.Write($jsonBytes, 0, $jsonBytes.Length)
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        # PG SOFT SIMULATED API: Monte Carlo Batch Simulation
        if ($rawUrl -eq "/api/pg/simulate") {
            $count = 100
            $bet = 20.0
            if ($bodyText) {
                try {
                    $p = $bodyText | ConvertFrom-Json
                    if ($p.count) { $count = [int]$p.count }
                    if ($p.bet) { $bet = [double]$p.bet }
                } catch {}
            }
            if ($count -gt 1000) { $count = 1000 }
            
            $totalBet = 0.0
            $totalWin = 0.0
            $hits = 0
            $freeSpinsCount = 0

            for ($i = 0; $i -lt $count; $i++) {
                $totalBet += $bet
                $res = Invoke-PgAztecSpin $bet "none"
                $w = $res.dt.si.tw
                $totalWin += $w
                if ($w -gt 0) { $hits++ }
                if ($res.dt.si.fs) { $freeSpinsCount++ }
            }

            $rtp = if ($totalBet -gt 0) { [Math]::Round(($totalWin / $totalBet) * 100, 2) } else { 0 }
            $hitRate = if ($count -gt 0) { [Math]::Round(($hits / $count) * 100, 2) } else { 0 }

            $state = Get-ServerState
            $respData = @{
                count = $count
                betPerSpin = $bet
                totalBet = $totalBet
                totalWin = [Math]::Round($totalWin, 2)
                rtp = $rtp
                hitRate = $hitRate
                freeSpinsTriggered = $freeSpinsCount
                balance = $state.balance
            }

            $jsonBytes = [System.Text.Encoding]::UTF8.GetBytes(($respData | ConvertTo-Json))
            $response.ContentType = "application/json; charset=utf-8"
            $response.ContentLength64 = $jsonBytes.Length
            $response.OutputStream.Write($jsonBytes, 0, $jsonBytes.Length)
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        if ($rawUrl -eq "/api/pg/god") {
            $state = Get-ServerState
            if ($request.HttpMethod -eq "POST" -and $bodyText) {
                try {
                    $data = $bodyText | ConvertFrom-Json
                    if ($data.mode -ne $null) {
                        $state.godMode = [string]$data.mode
                        Save-ServerState $state
                        Write-Host "[PG SIM SERVER] God Mode Set: $($state.godMode)" -ForegroundColor Magenta
                    }
                } catch {}
            }
            $jsonBytes = [System.Text.Encoding]::UTF8.GetBytes(($state | ConvertTo-Json))
            $response.ContentType = "application/json; charset=utf-8"
            $response.ContentLength64 = $jsonBytes.Length
            $response.OutputStream.Write($jsonBytes, 0, $jsonBytes.Length)
            $response.StatusCode = 200
            $response.Close()
            continue
        }

        # ==============================================================
        # 5. Static File Serving (HTML, CSS, JS, Images, Audio)
        # ==============================================================
        if ($rawUrl -eq "/" -or $rawUrl -eq "") {
            $rawUrl = "/index.html"
        }

        $filePath = [System.IO.Path]::Combine($root, $rawUrl.TrimStart('/'))

        if ([System.IO.File]::Exists($filePath)) {
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = "application/octet-stream"
            if ($mimeTypes.ContainsKey($ext)) {
                $mime = $mimeTypes[$ext]
            }

            $fileName = [System.IO.Path]::GetFileName($filePath).ToLower()
            if ($fileName -eq "js" -or $fileName.EndsWith(".js.download")) {
                $mime = "application/javascript; charset=utf-8"
            }

            $response.ContentType = $mime
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
            $response.StatusCode = 200
        } else {
            # ==============================================================
            # 6. CDN Proxy: forward unknown paths to m.pg-demo.com
            # ==============================================================
            $proxied = $false
            $proxyBases = @("https://m.pg-demo.com", "https://static.pg-demo.com")
            foreach ($base in $proxyBases) {
                if ($proxied) { break }
                $proxyUrl = "$base$rawUrl"
                try {
                    $wc = New-Object System.Net.WebClient
                    $wc.Headers.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36")
                    $wc.Headers.Add("Referer", "https://m.pg-demo.com/")
                    $wc.Headers.Add("Accept", "*/*")
                    $wc.Headers.Add("Accept-Language", "th-TH,th;q=0.9,en;q=0.8")
                    if ($request.HasEntityBody -and $request.ContentType) {
                        $wc.Headers.Add("Content-Type", $request.ContentType)
                    }
                    $bytes = $wc.DownloadData($proxyUrl)
                    $ct = $wc.ResponseHeaders["Content-Type"]
                    if (-not $ct) {
                        $ext2 = [System.IO.Path]::GetExtension($rawUrl).ToLower()
                        $ct = if ($mimeTypes.ContainsKey($ext2)) { $mimeTypes[$ext2] } else { "application/octet-stream" }
                    }
                    $response.ContentType = $ct
                    $response.ContentLength64 = $bytes.Length
                    $response.AddHeader("Cache-Control", "public, max-age=3600")
                    $response.OutputStream.Write($bytes, 0, $bytes.Length)
                    $response.StatusCode = 200
                    Write-Host "[PROXY] $rawUrl => $proxyUrl ($($bytes.Length) bytes)" -ForegroundColor DarkGreen
                    $proxied = $true
                } catch {
                    Write-Host "[PROXY FAIL] $proxyUrl : $($_.Exception.Message)" -ForegroundColor DarkRed
                }
            }
            if (-not $proxied) {
                $response.StatusCode = 404
                $errBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found: $rawUrl")
                $response.OutputStream.Write($errBytes, 0, $errBytes.Length)
            }
        }
        $response.Close()
    } catch {
        # Handle client disconnect
    }
}
