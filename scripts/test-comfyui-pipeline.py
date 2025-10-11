#!/usr/bin/env python3
import json
import urllib.request
import time
import sys

COMFYUI_URL = "http://127.0.0.1:8188"

def queue_prompt(workflow):
    print("📦 Gönderilen JSON:")
    print(json.dumps(workflow, indent=2))
    data = json.dumps(workflow).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    response = urllib.request.urlopen(req)
    return json.loads(response.read())

def get_history(prompt_id):
    with urllib.request.urlopen(f"{COMFYUI_URL}/history/{prompt_id}") as response:
        return json.loads(response.read())

def wait_for_completion(prompt_id, max_wait=120):
    start_time = time.time()
    while time.time() - start_time < max_wait:
        history = get_history(prompt_id)
        if prompt_id in history:
            job = history[prompt_id]
            if 'outputs' in job and job['outputs']:
                return job
            if 'status' in job and job['status'].get('completed', False):
                return job
            if 'status' in job and 'error' in job['status']:
                print(f"❌ Hata: {job['status']['error']}")
                return None
        time.sleep(2)
        print("⏳ Bekleniyor...")
    print("❌ Zaman aşımı!")
    return None

workflow = {
  "prompt": {
    "1": {
      "class_type": "LoadImage",
      "inputs": {
        "image": "input.png"
      }
    },
    "2": {
      "class_type": "SaveImage",
      "inputs": {
        "images": ["1", 0],
        "filename_prefix": "test_output"
      }
    }
  }
}

if __name__ == "__main__":
    print("🎨 ComfyUI Test Pipeline Başlatılıyor...\n")
    try:
        with urllib.request.urlopen(f"{COMFYUI_URL}/system_stats") as response:
            stats = json.loads(response.read())
            print("✅ ComfyUI çalışıyor!")
            print(f"📊 VRAM: {stats.get('system', {}).get('vram_total', 0) / 1024:.1f} GB\n")
    except Exception as e:
        print(f"❌ ComfyUI'a bağlanılamıyor: {e}")
        sys.exit(1)

    print("📤 Workflow gönderiliyor...")
    result = queue_prompt(workflow)
    prompt_id = result['prompt_id']
    print(f"✅ Prompt ID: {prompt_id}\n")

    print("⏳ İşlem bekleniyor...")
    job = wait_for_completion(prompt_id)

    if job and 'outputs' in job:
        print("\n🎉 Başarılı!")
        for node_id, output in job['outputs'].items():
            if 'images' in output:
                for img in output['images']:
                    filename = img.get('filename', 'unknown')
                    print(f"✅ Görüntü oluşturuldu: {filename}")
    else:
        print("❌ İşlem başarısız!")
        sys.exit(1)
