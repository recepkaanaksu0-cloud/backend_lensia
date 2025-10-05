# 🚦 Telemetri Sistemi - Hızlı Başlangıç

## Lensia.ai için API İstekleri

### 1. Basit Ping (Her 1 dakika)

```javascript
// Lensia.ai backend'inden
async function checkDashboardStatus() {
  try {
    const response = await fetch('https://api.lensia.ai/api/ping')
    const data = await response.json()
    
    console.log('Dashboard Status:', data.status) // "ok"
    return data.status === 'ok'
  } catch (error) {
    console.error('Dashboard unreachable!')
    return false
  }
}

// Her 60 saniyede bir çalıştır
setInterval(checkDashboardStatus, 60000)
```

---

### 2. Health Check (Her 5 dakika)

```javascript
async function getDashboardHealth() {
  try {
    const response = await fetch('https://api.lensia.ai/api/health')
    const health = await response.json()
    
    console.log({
      status: health.status,              // "healthy" | "degraded"
      comfyui: health.services.comfyui.status,  // "up" | "down"
      queueSize: health.statistics.pending,
      queueHealth: health.statistics.queueHealth  // "good" | "moderate" | "high"
    })
    
    // Alert logic
    if (health.status === 'degraded') {
      await sendSlackAlert('⚠️ Dashboard degraded!')
    }
    
    if (health.services.comfyui.status === 'down') {
      await sendSlackAlert('🚨 ComfyUI is down!')
    }
    
    if (health.statistics.queueHealth === 'high') {
      await sendSlackAlert(`📊 High queue: ${health.statistics.pending} jobs`)
    }
    
    return health
  } catch (error) {
    await sendSlackAlert('❌ Health check failed!')
    return null
  }
}

// Her 5 dakikada bir
setInterval(getDashboardHealth, 300000)
```

---

### 3. Detaylı Telemetri (Her 15 dakika)

```javascript
async function getDashboardTelemetry() {
  try {
    const response = await fetch('https://api.lensia.ai/api/telemetry', {
      headers: {
        'X-API-Key': process.env.DASHBOARD_API_KEY
      }
    })
    
    const telemetry = await response.json()
    
    // Veritabanına kaydet
    await db.telemetry.create({
      timestamp: new Date(),
      jobsTotal: telemetry.jobs.total,
      jobsPending: telemetry.jobs.byStatus.pending,
      jobsCompleted: telemetry.jobs.byStatus.completed,
      successRate: telemetry.jobs.performance.successRate,
      avgProcessingTime: telemetry.jobs.performance.averageProcessingTime,
      webhookSuccessRate: telemetry.webhooks.successRate,
      queueHealth: telemetry.queue.health
    })
    
    // Metrics'e gönder (Datadog, NewRelic, etc.)
    await metrics.gauge('dashboard.jobs.total', telemetry.jobs.total)
    await metrics.gauge('dashboard.jobs.pending', telemetry.jobs.byStatus.pending)
    await metrics.gauge('dashboard.queue.size', telemetry.queue.size)
    
    return telemetry
  } catch (error) {
    console.error('Telemetry failed:', error)
    return null
  }
}

// Her 15 dakikada bir
setInterval(getDashboardTelemetry, 900000)
```

---

### 4. İş Gönderirken Health Kontrolü

```javascript
async function submitJobToDashboard(jobData) {
  // 1. Önce health check
  const health = await fetch('https://api.lensia.ai/api/health')
  const healthData = await health.json()
  
  // 2. Durum kontrolü
  if (healthData.status !== 'healthy') {
    console.warn('⚠️ Dashboard degraded but continuing...')
  }
  
  if (healthData.services.comfyui.status === 'down') {
    throw new Error('ComfyUI is down! Cannot process jobs.')
  }
  
  if (healthData.statistics.queueHealth === 'high') {
    console.warn(`⏱️ High queue: ${healthData.statistics.pending} pending jobs`)
    // Kullanıcıya bilgi göster: "İşleminiz kuyruğa alındı, gecikme olabilir"
  }
  
  // 3. İşi gönder
  const response = await fetch('https://api.lensia.ai/api/jobs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.DASHBOARD_API_KEY
    },
    body: JSON.stringify({
      job_id: jobData.id,
      prompt: jobData.prompt,
      input_image_url: jobData.imageUrl,
      webhook_url: 'https://www.lensia.ai/api/jobs/webhook',
      params: jobData.params
    })
  })
  
  return await response.json()
}
```

---

### 5. Telegram Bot ile Monitoring

```javascript
const TelegramBot = require('node-telegram-bot-api')
const bot = new TelegramBot(TELEGRAM_TOKEN)
const ADMIN_CHAT_ID = 'your-chat-id'

async function monitorDashboard() {
  const health = await fetch('https://api.lensia.ai/api/health')
  const data = await health.json()
  
  if (data.status === 'degraded') {
    await bot.sendMessage(
      ADMIN_CHAT_ID,
      `⚠️ <b>Dashboard Degraded!</b>\n\n` +
      `ComfyUI: ${data.services.comfyui.status}\n` +
      `Queue: ${data.statistics.pending} jobs\n` +
      `Queue Health: ${data.statistics.queueHealth}`,
      { parse_mode: 'HTML' }
    )
  }
  
  if (data.services.comfyui.status === 'down') {
    await bot.sendMessage(
      ADMIN_CHAT_ID,
      `🚨 <b>ALERT: ComfyUI is DOWN!</b>\n\n` +
      `Time: ${new Date().toLocaleString()}\n` +
      `Action: Immediate restart required`,
      { parse_mode: 'HTML' }
    )
  }
}

// Her 2 dakikada bir
setInterval(monitorDashboard, 120000)
```

---

### 6. Discord Webhook ile Alerting

```javascript
async function sendDiscordAlert(message, severity = 'info') {
  const colors = {
    info: 3447003,    // Mavi
    warning: 16776960, // Sarı
    critical: 16711680 // Kırmızı
  }
  
  await fetch(process.env.DISCORD_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      embeds: [{
        title: 'Dashboard Alert',
        description: message,
        color: colors[severity],
        timestamp: new Date().toISOString()
      }]
    })
  })
}

async function monitorWithDiscord() {
  const health = await fetch('https://api.lensia.ai/api/health')
  const data = await health.json()
  
  if (data.status === 'degraded') {
    await sendDiscordAlert(
      `Dashboard is degraded!\nComfyUI: ${data.services.comfyui.status}\nQueue: ${data.statistics.pending} jobs`,
      'warning'
    )
  }
}

setInterval(monitorWithDiscord, 300000)
```

---

### 7. Prometheus Metrics Export

```javascript
// Express.js endpoint
app.get('/metrics', async (req, res) => {
  try {
    const telemetry = await fetch('https://api.lensia.ai/api/telemetry', {
      headers: { 'X-API-Key': process.env.DASHBOARD_API_KEY }
    })
    const data = await telemetry.json()
    
    // Prometheus format
    const metrics = `
# HELP dashboard_jobs_total Total number of jobs
# TYPE dashboard_jobs_total gauge
dashboard_jobs_total ${data.jobs.total}

# HELP dashboard_jobs_pending Pending jobs in queue
# TYPE dashboard_jobs_pending gauge
dashboard_jobs_pending ${data.jobs.byStatus.pending}

# HELP dashboard_jobs_processing Currently processing jobs
# TYPE dashboard_jobs_processing gauge
dashboard_jobs_processing ${data.jobs.byStatus.processing}

# HELP dashboard_jobs_completed Completed jobs
# TYPE dashboard_jobs_completed counter
dashboard_jobs_completed ${data.jobs.byStatus.completed}

# HELP dashboard_queue_health Queue health status (0=healthy, 1=warning, 2=critical)
# TYPE dashboard_queue_health gauge
dashboard_queue_health ${data.queue.health === 'healthy' ? 0 : data.queue.health === 'warning' ? 1 : 2}

# HELP dashboard_webhook_success_rate Webhook success rate
# TYPE dashboard_webhook_success_rate gauge
dashboard_webhook_success_rate ${parseFloat(data.webhooks.successRate) / 100}
    `.trim()
    
    res.set('Content-Type', 'text/plain')
    res.send(metrics)
  } catch (error) {
    res.status(500).send('# Error fetching metrics')
  }
})
```

---

### 8. Grafana Dashboard JSON

```json
{
  "dashboard": {
    "title": "ComfyUI Dashboard Monitoring",
    "panels": [
      {
        "title": "Dashboard Status",
        "targets": [{
          "expr": "up{job=\"dashboard\"}"
        }],
        "type": "stat"
      },
      {
        "title": "Queue Size",
        "targets": [{
          "expr": "dashboard_jobs_pending"
        }],
        "type": "graph",
        "thresholds": [
          { "value": 10, "color": "green" },
          { "value": 50, "color": "yellow" },
          { "value": 100, "color": "red" }
        ]
      },
      {
        "title": "Success Rate",
        "targets": [{
          "expr": "dashboard_webhook_success_rate * 100"
        }],
        "type": "gauge"
      }
    ]
  }
}
```

---

## Özet: Lensia.ai'ye Entegrasyon

### Minimum (Başlangıç):
```javascript
// Sadece ping
setInterval(async () => {
  const res = await fetch('https://api.lensia.ai/api/ping')
  const data = await res.json()
  if (data.status !== 'ok') console.error('Dashboard down!')
}, 60000)
```

### Önerilen (Production):
```javascript
// Ping + Health Check
setInterval(async () => {
  const ping = await fetch('https://api.lensia.ai/api/ping')
  // ...
}, 60000)

setInterval(async () => {
  const health = await fetch('https://api.lensia.ai/api/health')
  // Alert logic
}, 300000)
```

### Tam Monitoring (Enterprise):
```javascript
// Ping + Health + Telemetry + Alerts
// Telegram/Discord/Slack entegrasyonu
// Prometheus/Grafana metrics
// Veritabanına kayıt
```

---

## Test Komutları

```bash
# Ping test
curl https://api.lensia.ai/api/ping

# Health check test
curl https://api.lensia.ai/api/health

# Telemetry test (API key gerekli)
curl https://api.lensia.ai/api/telemetry \
  -H "X-API-Key: your-api-key"

# Telemetry POST test
curl -X POST https://api.lensia.ai/api/telemetry \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"source":"test","metrics":{"test":1}}'
```

---

**Tüm detaylar için:** `TELEMETRY_DOCUMENTATION.md`
