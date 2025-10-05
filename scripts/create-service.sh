#!/bin/bash

# Systemd service dosyası oluşturucu
# Dashboard'u sistem servisi olarak çalıştırmak için

cat > comfyui-dashboard.service << EOF
[Unit]
Description=ComfyUI Job Runner Dashboard
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$(pwd)
Environment="NODE_ENV=production"
Environment="PORT=3000"
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "✅ Service dosyası oluşturuldu: comfyui-dashboard.service"
echo ""
echo "Kurulum için:"
echo "  sudo cp comfyui-dashboard.service /etc/systemd/system/"
echo "  sudo systemctl daemon-reload"
echo "  sudo systemctl enable comfyui-dashboard"
echo "  sudo systemctl start comfyui-dashboard"
echo ""
echo "Durum kontrolü:"
echo "  sudo systemctl status comfyui-dashboard"
