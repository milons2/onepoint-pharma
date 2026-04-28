const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const fs = require("fs");
const { setupDatabaseHandlers } = require("./db-bridge");
require("dotenv").config();

let mainWindow;
let backendProcess;
const isDev = !app.isPackaged;

// Backup scripts path
const scriptsPath = isDev
  ? path.join(__dirname, "scripts")
  : path.join(process.resourcesPath, "scripts");

// ---------------- BACKEND START ----------------
function startBackend() {
  const logPath = path.join(app.getPath("userData"), "backend_debug.log");
  const baseDir = isDev ? __dirname : process.resourcesPath;
  const backendFile = isDev
    ? path.join(__dirname, "src", "pos", "server.js")
    : path.join(process.resourcesPath, "app.asar.unpacked", "src", "pos", "server.js");

  const nodeModulesPath = path.join(baseDir, "node_modules");
  const prismaLib = path.join(
    nodeModulesPath,
    ".prisma",
    "client",
    "query_engine-windows.dll.node"
  );

  if (!isDev) {
    process.env.PRISMA_QUERY_ENGINE_LIBRARY = prismaLib;
  }

  const nodeExec = isDev ? "node" : process.execPath;

  backendProcess = spawn(nodeExec, [backendFile], {
    cwd: isDev ? __dirname : process.resourcesPath,
    env: {
      ...process.env,
      NODE_ENV: "production",
      ELECTRON_RUN_AS_NODE: "1",
      NODE_PATH: nodeModulesPath,
    },
    shell: false,
    windowsHide: true,
  });

  backendProcess.stderr.on("data", (data) =>
    fs.appendFileSync(logPath, `[ERROR] ${data}`)
  );

  backendProcess.stdout.on("data", (data) =>
    fs.appendFileSync(logPath, `[INFO] ${data}`)
  );
}
// ---------------- BACKEND END ----------------


// ---------------- WINDOW CREATE ----------------
function createWindow() {
  const preloadPath = path.join(__dirname, "preload.js");
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    autoHideMenuBar: true,
    titleBarOverlay: {
      color: '#0f172a',
      symbolColor: '#ffffff',
      height: 35
    },
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: true,
      contextIsolation: false,
      sandbox: false,
    },
  });

  const indexPath = app.isPackaged
    ? path.join(process.resourcesPath, "app.asar", "pos-ui", "dist", "index.html")
    : path.join(__dirname, "pos-ui", "dist", "index.html");

  mainWindow.loadFile(indexPath);
}
// ---------------- WINDOW END ----------------


// ---------------- PRINT HANDLER ----------------
ipcMain.handle("print-invoice", async (event, options) => {
  const content = event.sender; 
  const printOptions = {
    silent: options.silent || false,
    printBackground: true,
    deviceName: options.deviceName || "", 
    margins: { marginType: "none" },
    pageSize: options.silent ? { width: 80000, height: 200000 } : 'A4'
  };

  return new Promise((resolve) => {
    content.print(printOptions, (success, failureReason) => {
      if (!success) {
        console.error("Print Failed:", failureReason);
        resolve({ success: false, error: failureReason });
      } else {
        resolve({ success: true });
      }
    });
  });
});

// ---------------- DASHBOARD PDF EXPORT ----------------
ipcMain.handle("export-dashboard-pdf", async (event, data) => {
  try {
    const { fileName, stats } = data;
    const today = new Date().toLocaleDateString("en-GB");
    const systemID = "OP-" + Math.random().toString(36).substring(2, 7).toUpperCase();

    // 1. Logo Asset Handling (PRODUCTION READY)
    let logoBase64 = "";
    try {
      // Logic: If installed (isPackaged), look in 'resources'. If in dev, look in 'src'.
      const logoPath = app.isPackaged
        ? path.join(process.resourcesPath, "pos-ui", "src", "assets", "op_logo.png")
        : path.join(__dirname, "pos-ui", "src", "assets", "op_logo.png");

      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      } else {
        console.error("Logo not found at:", logoPath);
      }
    } catch (e) { 
      console.log("Logo skipped due to error: ", e.message); 
    }

    const printWindow = new BrowserWindow({
      show: false,
      webPreferences: { nodeIntegration: false, contextIsolation: true }
    });

    // 2. Chart Scaling (Calculated for clean A4 visual)
    const maxVal = Math.max(stats.todaySales, stats.monthlyRevenue / 4, 1000);
    const getH = (val) => Math.min((val / maxVal) * 110, 110);

    const htmlContent = `
      <html>
        <head>
          <style>
            @page { size: A4; margin: 0; }
            body { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; color: #334155; margin: 0; padding: 0; background: #fff; -webkit-print-color-adjust: exact; }
            .page { width: 210mm; height: 297mm; padding: 18mm; box-sizing: border-box; position: relative; }
            
            /* Header & Typography */
            .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 1.5px solid #0f172a; padding-bottom: 15px; margin-bottom: 25px; }
            .brand-box { display: flex; align-items: center; gap: 12px; }
            .logo { width: 55px; height: 55px; object-fit: contain; }
            .brand-box h1 { margin: 0; font-size: 24px; color: #0f172a; font-weight: 600; letter-spacing: -0.5px; }
            .shop-info { font-size: 10px; color: #64748b; line-height: 1.4; margin-top: 4px; }
            
            .meta-info { text-align: right; }
            .doc-label { font-size: 10px; font-weight: 600; color: #10b981; text-transform: uppercase; letter-spacing: 1px; }
            .date-stamp { font-size: 14px; color: #0f172a; margin-top: 2px; }

            /* Sectioning */
            .section { margin-bottom: 28px; }
            .section-header { margin-bottom: 12px; }
            .section-title { font-size: 13px; font-weight: 600; color: #0f172a; text-transform: uppercase; letter-spacing: 0.5px; margin: 0; }
            .section-subtitle { font-size: 10.5px; color: #64748b; margin-top: 2px; }

            /* Data Grid */
            .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
            .card { padding: 14px; background: #fcfcfc; border: 1px solid #f1f5f9; border-radius: 4px; }
            .card-label { font-size: 9px; color: #94a3b8; font-weight: 600; text-transform: uppercase; }
            .card-value { font-size: 17px; font-weight: 500; margin-top: 4px; color: #1e293b; }
            .card-value.navy { color: #0f172a; font-weight: 600; }
            .card-value.profit { color: #10b981; font-weight: 600; }

            /* Visualization */
            .visual-box { background: #fff; border: 1px solid #f8fafc; padding: 15px; border-radius: 6px; }
            .chart-row { display: flex; align-items: flex-end; justify-content: space-around; height: 120px; padding-bottom: 10px; border-bottom: 1px solid #f1f5f9; }
            .bar-group { display: flex; flex-direction: column; align-items: center; width: 80px; }
            .bar { width: 32px; background: #0f172a; border-radius: 2px 2px 0 0; }
            .bar.alt { background: #10b981; }
            .bar-tag { font-size: 9.5px; font-weight: 600; margin-top: 8px; color: #475569; }
            .bar-val { font-size: 8px; color: #94a3b8; margin-top: 2px; }

            /* Insight Block */
            .insight-container { margin-top: 30px; padding: 16px; background: #f8fafc; border-left: 4px solid #0ea5e9; }
            .insight-label { font-size: 11px; font-weight: 700; color: #0369a1; text-transform: uppercase; }
            .insight-text { font-size: 12px; color: #334155; margin-top: 6px; line-height: 1.5; }

            .seal-wrapper {
              position: absolute;
              bottom: 35mm;
              right: 20mm;
              width: 90px;
              height: 90px;
              display: flex;
              justify-content: center;
              align-items: center;
              transform: rotate(-15deg); /* Professional tilt */
              opacity: 0.8;
              user-select: none;
            }

            /* The circular micro-text */
            .micro-text-svg {
              position: absolute;
              width: 100%;
              height: 100%;
              animation: rotate-slow 20s linear infinite; /* Optional: adds a digital feel */
            }

            .micro-text-path {
              fill: #1e40af;
              font-size: 5.5px;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1.5px;
            }

            /* Central Verification Block */
            .seal-center {
              width: 60px;
              height: 60px;
              border: 1.5px double #1e40af;
              border-radius: 50%;
              background: rgba(255, 255, 255, 0.9);
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              z-index: 2;
            }

            .seal-main {
              font-size: 9px;
              font-weight: 900;
              color: #1e40af;
              border-top: 1px solid #1e40af;
              border-bottom: 1px solid #1e40af;
              padding: 1px 3px;
              margin: 2px 0;
            }

            .seal-sub {
              font-size: 5px;
              color: #64748b;
              font-weight: 700;
            }

            @keyframes rotate-slow {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
              

            /* Footer */
            .footer { position: absolute; bottom: 15mm; left: 18mm; right: 18mm; border-top: 1px solid #f1f5f9; padding-top: 12px; text-align: center; }
            .footer-text { font-size: 9px; color: #94a3b8; line-height: 1.4; }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="header">
              <div class="brand-box">
                ${logoBase64 ? `<img src="${logoBase64}" class="logo" />` : ''}
                <div>
                  <h1>Onepoint Pharma</h1>
                  <div class="shop-info">
                    Shop #39, 4th Floor, Somobay Bank Shopping Complex, Station Road, Rangpur <br>
                   
                  </div>
                </div>
              </div>
              <div class="meta-info">
                <div class="doc-label">Executive Financial Summary</div>
                <div class="date-stamp">${today}</div>
              </div>
            </div>

            <div class="section">
              <div class="section-header">
                <div class="section-title">Capital & Valuation Assets</div>
                <div class="section-subtitle">Analysis of total stock acquisition cost and liquidity health score.</div>
              </div>
              <div class="grid">
                <div class="card">
                  <div class="card-label">Whole Investment</div>
                  <div class="card-value">BDT ${stats.wholeInvestAmount.toLocaleString()}</div>
                </div>
                <div class="card">
                  <div class="card-label">Liquidity Score</div>
                  <div class="card-value" style="color: #0ea5e9;">${stats.liquidityScore}%</div>
                </div>
                <div class="card" style="background: #f8fafc;">
                  <div class="card-label">Portfolio Risk</div>
                  <div class="card-value" style="font-size: 14px; color: #64748b;">Minimal / Stable</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-header">
                <div class="section-title">Revenue & Net Profitability</div>
                <div class="section-subtitle">Tracking daily sales volume against monthly targets and actual net earnings.</div>
              </div>
              <div class="grid">
                <div class="card">
                  <div class="card-label">Today's Sales</div>
                  <div class="card-value">BDT ${stats.todaySales.toLocaleString()}</div>
                </div>
                <div class="card">
                  <div class="card-label">Monthly Revenue</div>
                  <div class="card-value">BDT ${stats.monthlyRevenue.toLocaleString()}</div>
                </div>
                <div class="card" style="background: #0f172a; border-color: #0f172a;">
                  <div class="card-label" style="color: #94a3b8;">Monthly Net Profit</div>
                  <div class="card-value profit">BDT ${stats.monthlyNetProfit.toLocaleString()}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-header">
                <div class="section-title">Performance Metrics Visualization</div>
                <div class="section-subtitle">Real-time distribution of liquidity vs. net earnings.</div>
              </div>
              
              <div class="visual-box">
                <div class="chart-row">
                  <div class="bar-group">
                    <div class="bar" style="height: ${getH(stats.todaySales)}px;"></div>
                    <div class="bar-tag">Daily Momentum</div>
                    <div class="bar-val">BDT ${stats.todaySales}</div>
                  </div>
                  
                  <div class="bar-group">
                    <div class="bar" style="height: ${getH(stats.monthlyRevenue / 4)}px;"></div>
                    <div class="bar-tag">Revenue Scale</div>
                    <div class="bar-val">BDT ${stats.monthlyRevenue.toLocaleString()}</div>
                  </div>
                  
                  <div class="bar-group">
                    <div class="bar alt" style="height: ${getH(stats.monthlyNetProfit)}px;"></div>
                    <div class="bar-tag">Net Efficiency</div>
                    <div class="bar-val">BDT ${stats.monthlyNetProfit}</div>
                  </div>
                </div>
              </div>
            </div>

            <div class="insight-container">
              <div class="insight-label">Executive Performance Insight</div>
              <div class="insight-text">
                Monthly growth rate is currently at <strong>${stats.monthlyGrowth}%</strong> with an average order value of 
                <strong>BDT ${stats.avgOrderValue}</strong>. The business continues to maintain stable liquidity 
                and revenue momentum, indicating a healthy operational trajectory.
              </div>
            </div>

            <div class="footer">
              <div class="footer-text">
                <strong>Confidential Owner-Access Document</strong><br>
                This report contains sensitive financial data and is intended for Onepoint Pharma ownership only.<br>
                System Verified PDF | Generated via OnePoint ERP System
              </div>
            </div>

            <div class="seal-wrapper">
              <svg class="micro-text-svg" viewBox="0 0 100 100">
                <path id="circlePath" d="M 50, 50 m -37, 0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" fill="transparent" />
                <text class="micro-text-path">
                  <textPath href="#circlePath">
                    • AUTHENTIC SYSTEM GENERATED REPORT • ONEPOINT PHARMA SECURE NODE • 
                  </textPath>
                </text>
              </svg>

              <div class="seal-center">
                <span class="seal-sub">OFFICIAL</span>
                <span class="seal-main">VERIFIED</span>
                <span class="seal-sub">#${Math.random().toString(36).substring(7).toUpperCase()}</span>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await printWindow.loadURL("data:text/html;charset=utf-8," + encodeURIComponent(htmlContent));

    const pdfData = await printWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: "A4",
      margins: { top: 0, bottom: 0, left: 0, right: 0 }
    });

    const { filePath } = await dialog.showSaveDialog({
      title: "Save Business Summary",
      defaultPath: path.join(app.getPath("documents"), fileName),
      filters: [{ name: "PDF Files", extensions: ["pdf"] }]
    });

    if (!filePath) return { success: false };

    fs.writeFileSync(filePath, pdfData);
    printWindow.close();
    return { success: true };

  } catch (error) {
    console.error("PDF Export Error:", error);
    return { success: false, error: error.message };
  }
});
// ---------------- EXPORT END ----------------
app.disableHardwareAcceleration();
// ---------------- APP READY ----------------
app.whenReady().then(() => {
  startBackend();
  setupDatabaseHandlers(scriptsPath);
  setTimeout(createWindow, 3000);
});

app.on("will-quit", () => {
  if (backendProcess) {
    spawn("taskkill", ["/pid", backendProcess.pid, "/f", "/t"]);
  }
});