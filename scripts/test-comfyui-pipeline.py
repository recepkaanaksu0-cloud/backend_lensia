#!/usr/bin/env python3
"""
ComfyUI Test Pipeline
Bu script ComfyUI'a örnek bir workflow gönderir ve sonucu alır
"""

import json
import urllib.request
import urllib.parse
import time
import sys

COMFYUI_URL = "http://127.0.0.1:8188"

def queue_prompt(workflow):
    """Workflow'u ComfyUI'a gönder"""
    p = {"prompt": workflow}
    data = json.dumps(p).encode('utf-8')
    req = urllib.request.Request(f"{COMFYUI_URL}/prompt", data=data)
    req.add_header('Content-Type', 'application/json')
    
    response = urllib.request.urlopen(req)
    return json.loads(response.read())

def get_history(prompt_id):
    """Prompt history'yi al"""
    with urllib.request.urlopen(f"{COMFYUI_URL}/history/{prompt_id}") as response:
        return json.loads(response.read())

def wait_for_completion(prompt_id, max_wait=300):
    """İşlemin tamamlanmasını bekle"""
    start_time = time.time()
    
    while time.time() - start_time < max_wait:
        history = get_history(prompt_id)
        
        if prompt_id in history:
            job = history[prompt_id]
            
            if 'outputs' in job and job['outputs']:
                print("✅ İşlem tamamlandı!")
                return job
            
            if 'status' in job:
                if job['status'].get('completed', False):
                    return job
                if 'error' in job['status']:
                    print(f"❌ Hata: {job['status']['error']}")
                    return None
        
        time.sleep(2)
        print("⏳ İşlem devam ediyor...")
    
    print("❌ Zaman aşımı!")
    return None

# Basit Text-to-Image Workflow
workflow = {
    "3": {
        "inputs": {
            "seed": 42,
            "steps": 20,
            "cfg": 8.0,
            "sampler_name": "euler",
            "scheduler": "normal",
            "denoise": 1,
            "model": ["4", 0],
            "positive": ["6", 0],
            "negative": ["7", 0],
            "latent_image": ["5", 0]
        },
        "class_type": "KSampler"
    },
    "4": {
        "inputs": {
            "ckpt_name": "sd_xl_base_1.0.safetensors"
        },
        "class_type": "CheckpointLoaderSimple"
    },
    "5": {
        "inputs": {
            "width": 1024,
            "height": 1024,
            "batch_size": 1
        },
        "class_type": "EmptyLatentImage"
    },
    "6": {
        "inputs": {
            "text": "beautiful landscape, mountains, sunset, photorealistic, 8k, masterpiece",
            "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode"
    },
    "7": {
        "inputs": {
            "text": "ugly, blurry, low quality, watermark, text",
            "clip": ["4", 1]
        },
        "class_type": "CLIPTextEncode"
    },
    "8": {
        "inputs": {
            "samples": ["3", 0],
            "vae": ["4", 2]
        },
        "class_type": "VAEDecode"
    },
    "9": {
        "inputs": {
            "filename_prefix": "ComfyUI_test",
            "images": ["8", 0]
        },
        "class_type": "SaveImage"
    }
}

if __name__ == "__main__":
    print("🎨 ComfyUI Test Pipeline Başlatılıyor...")
    print()
    
    # Durum kontrolü
    try:
        with urllib.request.urlopen(f"{COMFYUI_URL}/system_stats") as response:
            stats = json.loads(response.read())
            print("✅ ComfyUI çalışıyor!")
            print(f"📊 VRAM: {stats.get('system', {}).get('vram_total', 0) / 1024:.1f} GB")
            print()
    except Exception as e:
        print(f"❌ ComfyUI'a bağlanılamıyor: {e}")
        sys.exit(1)
    
    # Workflow gönder
    print("📤 Workflow gönderiliyor...")
    result = queue_prompt(workflow)
    prompt_id = result['prompt_id']
    print(f"✅ Prompt ID: {prompt_id}")
    print()
    
    # Tamamlanmasını bekle
    print("⏳ İşlem bekleniyor...")
    job = wait_for_completion(prompt_id)
    
    if job and 'outputs' in job:
        print()
        print("🎉 Başarılı!")
        print(f"📁 Çıktı klasörü: ./comfyui/output/")
        print()
        
        # Çıktı bilgilerini göster
        for node_id, output in job['outputs'].items():
            if 'images' in output:
                for img in output['images']:
                    filename = img.get('filename', 'unknown')
                    print(f"✅ Oluşturulan görüntü: {filename}")
                    print(f"   Tam yol: ./comfyui/output/{filename}")
    else:
        print("❌ İşlem başarısız!")
        sys.exit(1)
