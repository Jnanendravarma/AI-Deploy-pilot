const os = require('os');

function getSystemMetrics() {
  const cpus = os.cpus();
  const avgCpu = cpus.length
    ? cpus.reduce((sum, cpu) => sum + (1 - cpu.times.idle / Object.values(cpu.times).reduce((a, b) => a + b, 0)), 0) / cpus.length
    : 0;

  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  return {
    cpuUsagePercent: Number((avgCpu * 100).toFixed(2)),
    memoryUsedMb: Math.round((totalMem - freeMem) / (1024 * 1024)),
    memoryTotalMb: Math.round(totalMem / (1024 * 1024)),
    uptimeSeconds: Math.round(process.uptime()),
    loadAverage: os.loadavg(),
    platform: os.platform()
  };
}

module.exports = { getSystemMetrics };
