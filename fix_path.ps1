$ErrorActionPreference = 'Stop'

# ตรวจสอบสิทธิ์ Admin ถ้ายิงไม่ได้ให้ขอสิทธิ์
if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Requesting Administrative privileges to fix the System PATH..."
    Start-Process PowerShell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    exit
}

Write-Host "Running with Administrator privileges..."
$regPath = 'HKLM:\System\CurrentControlSet\Control\Session Manager\Environment'
$currentPath = (Get-ItemProperty -Path $regPath -Name Path).Path

if ($currentPath -match '"') {
    Write-Host "Found a stray quote in the System PATH. Fixing it..."
    $newPath = $currentPath -replace '"', ''
    Set-ItemProperty -Path $regPath -Name Path -Value $newPath
    
    # Broadcast WM_SETTINGCHANGE so new terminals pick up the change immediately
    if ([System.Environment]::OSVersion.Platform -eq 'Win32NT') {
        $code = @'
        using System;
        using System.Runtime.InteropServices;
        public class Win32 {
            [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
            [return: MarshalAs(UnmanagedType.Bool)]
            public static extern bool SendMessageTimeout(
                IntPtr hWnd, int Msg, IntPtr wParam, string lParam, 
                int fuFlags, int uTimeout, out IntPtr lpdwResult);
        }
'@
        Add-Type -TypeDefinition $code
        $HWND_BROADCAST = [IntPtr]0xffff
        $WM_SETTINGCHANGE = 0x001A
        $SMTO_ABORTIFHUNG = 0x0002
        $result = [IntPtr]::Zero
        [Win32]::SendMessageTimeout($HWND_BROADCAST, $WM_SETTINGCHANGE, [IntPtr]::Zero, "Environment", $SMTO_ABORTIFHUNG, 5000, [ref]$result) | Out-Null
    }
    
    Write-Host "PATH has been fixed successfully!"
} else {
    Write-Host "No stray quote found in the System PATH."
}

Write-Host "Press any key to exit..."
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
