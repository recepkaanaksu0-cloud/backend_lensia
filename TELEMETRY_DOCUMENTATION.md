# 📊 Telemetri ve Health Check API Dokümantasyonu

## Genel Bakış

Dashboard, Lensia.ai'nin sistem durumunu izlemesi için 3 farklı endpoint sunar:

1. **`/api/ping`** - Basit canlılık kontrolü (hızlı)
2. **`/api/health`** - Detaylı sağlık durumu
3. **`/api/telemetry`** - Tam metrik ve istatistikler (kimlik doğrulama gerekli)

---

## 1. Ping Endpoint

### GET /api/ping

En hızlı canlılık kontrolü. Sistemin çalışıp çalışmadığını kontrol eder.

**Request:**
```bash
curl https://api.lensia.ai/api/ping
```

**Response: (200 OK)**
```json
{
  "status": "ok",
  "message": "pong",
  "timestamp": "2025-10-03T12:00:00.000Z",
  "service": "comfyui-dashboard",
  "version": "1.0.0"
}
```

**Kullanım Senaryoları:**
- Uptime monitoring
- Load balancer health checks
- Hızlı canlılık kontrolü

**Özellikler:**
- ✅ Kimlik doğrulama gerektirmez
- ✅ Çok hızlı (<10ms)
- ✅ HEAD request destekler
- ✅ Cache yok

---

## 2. Health Check Endpoint

### GET /api/health

Sistem bileşenlerinin durumunu ve temel istatistikleri döner.

**Request:**
```bash
curl https://api.lensia.ai/api/health
```

**Response: (200 OK - Healthy)**
```json
{
  "status": "healthy",
  "timestamp": "2025-10-03T12:00:00.000Z",
  "responseTime": "45ms",
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "up",
      "type": "sqlite"
    },
    "comfyui": {
      "status": "up",
      "url": "http://127.0.0.1:8188"
    },
    "webhook": {
      "status": "up",
      "target": "https://www.lensia.ai/api/jobs/webhook"
    }
  },
  "statistics": {
    "total": 150,
    "pending": 5,
    "processing": 2,
    "completed": 140,
    "failed": 3,
    "last24Hours": 45,
    "averageProcessingTime": "120s",
    "queueHealth": "good"
  },
  "system": {
    "nodeVersion": "v20.x.x",
    "platform": "linux",
    "arch": "x64",
    "uptime": "3600s",
    "memoryUsage": {
      "used": "150MB",
      "total": "512MB"
    }
  }
}
```

**Response: (503 Service Unavailable - Degraded)**
```json
{
  "status": "degraded",
  "timestamp": "2025-10-03T12:00:00.000Z",
  "responseTime": "50ms",
  "version": "1.0.0",
  "services": {
    "database": {
      "status": "up",
      "type": "sqlite"
    },
    "comfyui": {
      "status": "down",
      "url": "http://127.0.0.1:8188"
    },
    "webhook": {
      "status": "up",
      "target": "https://www.lensia.ai/api/jobs/webhook"
    }
  },
  ...
}
```

**Status Codes:**
- `200` - System healthy (tüm servisler çalışıyor)
- `503` - System degraded (bir veya daha fazla servis down)

**Kullanım Senaryoları:**
- Sistem durumu dashboard'u
- Otomatik alerting
- Servis bağımlılık kontrolü
- Kapasite planlama

**Özellikler:**
- ✅ Kimlik doğrulama gerektirmez
- ✅ Hızlı (<100ms)
- ✅ Tüm kritik servisleri kontrol eder
- ✅ Temel istatistikler içerir

**Queue Health Değerleri:**
- `good` - Pending jobs < 10
- `moderate` - Pending jobs 10-50
- `high` - Pending jobs > 50

---

## 3. Telemetry Endpoint

### GET /api/telemetry

Detaylı metrikler ve istatistikler. **API Key gerektirir.**

**Request:**
```bash
curl https://api.lensia.ai/api/telemetry \
  -H "X-API-Key: your-api-key-here"
```

**Response: (200 OK)**
```json
{
  "timestamp": "2025-10-03T12:00:00.000Z",
  "service": {
    "name": "comfyui-dashboard",
    "version": "1.0.0",
    "environment": "production",
    "uptime": 3600
  },
  "jobs": {
    "total": 1500,
    "byStatus": {
      "pending": 5,
      "processing": 2,
      "completed": 1200,
      "sent": 1150,
      "error": 50
    },
    "timeline": {
      "lastHour": 12,
      "last24Hours": 250,
      "last7Days": 1400
    },
    "performance": {
      "averageProcessingTime": 125000,
      "averageProcessingTimeFormatted": "2m",
      "successRate": "96%"
    }
  },
  "webhooks": {
    "sent": 1150,
    "failed": 50,
    "successRate": "96%"
  },
  "queue": {
    "size": 5,
    "health": "healthy",
    "processing": 2
  },
  "recentJobs": [
    {
      "id": "clxxx...",
      "lensiaJobId": "lensia_123",
      "status": "completed",
      "createdAt": "2025-10-03T11:55:00.000Z",
      "processingTime": 120000,
      "webhookSent": true
    },
    ...
  ],
  "system": {
    "nodeVersion": "v20.x.x",
    "platform": "linux",
    "memory": {
      "used": 256,
      "total": 512,
      "unit": "MB"
    },
    "cpu": {
      "usage": {
        "user": 1234567,
        "system": 234567
      }
    }
  }
}
```

**Response: (401 Unauthorized)**
```json
{
  "error": "Unauthorized"
}
```

**Status Codes:**
- `200` - Success
- `401` - Unauthorized (invalid API key)
- `500` - Server error

**Kullanım Senaryoları:**
- Detaylı monitoring ve analytics
- Performance tracking
- Business intelligence
- Anomaly detection

**Özellikler:**
- 🔒 API Key zorunlu
- 📊 Detaylı metrikler
- 📈 Trend analizi
- 🕐 Zaman bazlı istatistikler

---

### POST /api/telemetry

Lensia.ai'nin kendi metriklerini dashboard'a göndermesi için (opsiyonel).

**Request:**
```bash
curl -X POST https://api.lensia.ai/api/telemetry \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key-here" \
  -d '{
    "source": "lensia-main-site",
    "metrics": {
      "activeUsers": 1250,
      "requestsLast24h": 15000,
      "jobsSubmitted": 250
    },
    "timestamp": "2025-10-03T12:00:00.000Z"
  }'
```

**Response: (200 OK)**
```json
{
  "status": "received",
  "timestamp": "2025-10-03T12:00:00.000Z"
}
```

---

## Lensia.ai Entegrasyon Önerileri

### 1. Temel Monitoring (Minimum)

```javascript
// Her 1 dakikada bir ping at
setInterval(async () => {
  try {
    const response = await fetch('https://api.lensia.ai/api/ping')
    const data = await response.json()
    
    if (data.status !== 'ok') {
      // Alert gönder
      sendAlert('Dashboard down!')
    }
  } catch (error) {
    // Dashboard erişilemez
    sendAlert('Dashboard unreachable!')
  }
}, 60000)
```

### 2. Gelişmiş Monitoring (Önerilen)

```javascript
// Her 5 dakikada bir health check
setInterval(async () => {
  try {
    const response = await fetch('https://api.lensia.ai/api/health')
    const health = await response.json()
    
    // Veritabanına kaydet
    await db.healthChecks.create({
      timestamp: new Date(),
      status: health.status,
      comfyuiStatus: health.services.comfyui.status,
      queueSize: health.statistics.pending,
      queueHealth: health.statistics.queueHealth
    })
    
    // Alerting
    if (health.status === 'degraded') {
      sendAlert('Dashboard degraded!', health)
    }
    
    if (health.statistics.queueHealth === 'high') {
      sendAlert('High queue detected!', {
        pending: health.statistics.pending
      })
    }
    
    if (health.services.comfyui.status === 'down') {
      sendAlert('ComfyUI is down!')
    }
    
  } catch (error) {
    sendAlert('Health check failed!', error)
  }
}, 300000) // 5 dakika
```

### 3. Tam Telemetri (Kurumsal)

```javascript
// Her 15 dakikada bir detaylı telemetri
setInterval(async () => {
  try {
    const response = await fetch('https://api.lensia.ai/api/telemetry', {
      headers: {
        'X-API-Key': process.env.DASHBOARD_API_KEY
      }
    })
    const telemetry = await response.json()
    
    // Analytics dashboard'una gönder
    await analytics.track('dashboard_telemetry', {
      timestamp: telemetry.timestamp,
      jobsTotal: telemetry.jobs.total,
      jobsPending: telemetry.jobs.byStatus.pending,
      successRate: telemetry.jobs.performance.successRate,
      avgProcessingTime: telemetry.jobs.performance.averageProcessingTime,
      webhookSuccessRate: telemetry.webhooks.successRate,
      queueHealth: telemetry.queue.health
    })
    
    // Grafana/Prometheus'a gönder
    await prometheus.gauge('dashboard_jobs_total', telemetry.jobs.total)
    await prometheus.gauge('dashboard_jobs_pending', telemetry.jobs.byStatus.pending)
    await prometheus.gauge('dashboard_queue_size', telemetry.queue.size)
    
  } catch (error) {
    console.error('Telemetry failed:', error)
  }
}, 900000) // 15 dakika
```

---

## Monitoring Dashboard Örneği

### Grafana Dashboard Metrikleri

```yaml
panels:
  - title: "Dashboard Status"
    query: dashboard_status
    type: stat
    
  - title: "Queue Size"
    query: dashboard_jobs_pending
    type: gauge
    thresholds:
      - value: 10
        color: green
      - value: 50
        color: yellow
      - value: 100
        color: red
        
  - title: "Success Rate"
    query: dashboard_success_rate
    type: graph
    
  - title: "Processing Time"
    query: dashboard_avg_processing_time
    type: graph
    
  - title: "Webhook Success Rate"
    query: dashboard_webhook_success_rate
    type: gauge
```

---

## Alert Kuralları Önerileri

### 1. Kritik Alertler

```yaml
alerts:
  - name: "Dashboard Down"
    condition: ping fails 3 consecutive times
    severity: critical
    action: page on-call engineer
    
  - name: "ComfyUI Down"
    condition: health.services.comfyui.status == 'down'
    severity: critical
    action: restart ComfyUI service
    
  - name: "Database Down"
    condition: health.services.database.status == 'down'
    severity: critical
    action: immediate investigation
```

### 2. Uyarı Alertleri

```yaml
alerts:
  - name: "High Queue Size"
    condition: telemetry.queue.size > 50
    severity: warning
    action: notify team
    
  - name: "Low Success Rate"
    condition: telemetry.jobs.performance.successRate < 90%
    severity: warning
    action: investigate failures
    
  - name: "Webhook Failures"
    condition: telemetry.webhooks.successRate < 95%
    severity: warning
    action: check webhook endpoint
```

### 3. Bilgilendirme

```yaml
alerts:
  - name: "Moderate Queue Size"
    condition: telemetry.queue.size > 10 && < 50
    severity: info
    action: monitor
    
  - name: "High Memory Usage"
    condition: health.system.memoryUsage.used > 80%
    severity: info
    action: consider scaling
```

---

## Örnek İstek Sırası (Lensia.ai → Dashboard)

### Senaryo: Yeni iş gönderimi ve monitoring

```javascript
// 1. Önce sistem sağlığını kontrol et
const health = await fetch('https://api.lensia.ai/api/health')
const healthData = await health.json()

if (healthData.status !== 'healthy') {
  console.warn('Dashboard degraded, but continuing...')
}

if (healthData.statistics.queueHealth === 'high') {
  console.warn('High queue detected, job may be delayed')
}

// 2. İşi gönder
const job = await fetch('https://api.lensia.ai/api/jobs', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
  },
  body: JSON.stringify({
    job_id: 'lensia_12345',
    prompt: 'A beautiful sunset',
    input_image_url: 'https://...',
    webhook_url: 'https://www.lensia.ai/api/jobs/webhook'
  })
})

// 3. Telemetri al (periyodik)
const telemetry = await fetch('https://api.lensia.ai/api/telemetry', {
  headers: { 'X-API-Key': API_KEY }
})
const telemetryData = await telemetry.json()

// 4. Dashboard'a bilgi gönder (opsiyonel)
await fetch('https://api.lensia.ai/api/telemetry', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-API-Key': API_KEY
  },
  body: JSON.stringify({
    source: 'lensia-main-site',
    metrics: {
      activeUsers: 1250,
      jobsSubmittedToday: 450
    }
  })
})
```

---

## Performans ve Rate Limiting

### Önerilen İstek Sıklıkları

| Endpoint | Önerilen Sıklık | Max Sıklık |
|----------|----------------|------------|
| `/api/ping` | 1 dakika | 10 saniye |
| `/api/health` | 5 dakika | 1 dakika |
| `/api/telemetry` | 15 dakika | 5 dakika |

### Response Times (Ortalama)

| Endpoint | Ortalama | Max |
|----------|---------|-----|
| `/api/ping` | <10ms | 50ms |
| `/api/health` | <100ms | 500ms |
| `/api/telemetry` | <200ms | 1000ms |

---

## Güvenlik

### API Key Yönetimi

```env
# .env.local (Dashboard)
LENSIA_API_KEY="secure-random-generated-key-here"

# Lensia.ai backend
DASHBOARD_API_KEY="secure-random-generated-key-here"
```

**Önemli:**
- API key'leri güvenli sakla
- Rotate et (3-6 ayda bir)
- Asla commit etme
- Environment variables kullan

---

## Troubleshooting

### Problem: Health check başarısız

```bash
# Kontrol et
curl https://api.lensia.ai/api/health

# Dashboard loglarını kontrol et
tail -f logs/dashboard.log

# Cloudflare Tunnel kontrol et
sudo systemctl status cloudflared
```

### Problem: Telemetry 401 döner

```bash
# API key'i kontrol et
echo $LENSIA_API_KEY

# Header'ı kontrol et
curl https://api.lensia.ai/api/telemetry \
  -H "X-API-Key: $LENSIA_API_KEY" \
  -v
```

---

## Özet

✅ **3 Endpoint:** ping, health, telemetry  
✅ **Hızlı:** <10ms - 200ms  
✅ **Güvenli:** API key koruması  
✅ **Detaylı:** Kapsamlı metrikler  
✅ **Monitoring:** Uptime, queue, performance  
✅ **Alerting:** Otomatik uyarılar  

**En İyi Pratikler:**
1. Ping ile uptime monitoring
2. Health ile servis kontrolü
3. Telemetry ile detaylı analiz
4. Alert kuralları tanımla
5. Dashboard ve grafikler oluştur
