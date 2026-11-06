"""
SAM 3 Inference Script
Evaluates a single image with prompt support, outputting predicted category, confidence, and mask.
"""

import os
import sys
import json
import base64
import io
import argparse
import torch
import torchvision.transforms as T
from PIL import Image
import numpy as np
from models.sam3_adapter import SAM3FintechClassifier

def run_inference(image_path: str, checkpoint_path: str = None, prompt_json: str = "{}"):
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    if not os.path.exists(image_path):
        print(json.dumps({"error": f"Image file not found: {image_path}"}))
        sys.exit(1)

    # 1. Load image
    orig_image = Image.open(image_path).convert("RGB")
    orig_w, orig_h = orig_image.size

    img_size = 256
    transform = T.Compose([
        T.Resize((img_size, img_size)),
        T.ToTensor(),
        T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    tensor_img = transform(orig_image).unsqueeze(0).to(device)

    # 2. Parse Prompt
    box_tensor = None
    try:
        p_data = json.loads(prompt_json) if prompt_json else {}
        if "box" in p_data:
            box_tensor = torch.tensor([p_data["box"]], dtype=torch.float32).to(device)
    except Exception:
        pass

    # 3. Model setup & checkpoint loading
    default_categories = {
        0: "Credit Card",
        1: "Identity Document (RG/CNH)",
        2: "Fiscal Invoice / Receipt",
        3: "Banknote / Currency",
        4: "Contract Signature Check"
    }
    num_classes = len(default_categories)
    idx_to_category = default_categories

    model = SAM3FintechClassifier(num_classes=num_classes, embed_dim=256, freeze_backbone=False)

    if checkpoint_path and os.path.exists(checkpoint_path):
        try:
            ckpt = torch.load(checkpoint_path, map_location=device)
            if "model_state_dict" in ckpt:
                model.load_state_dict(ckpt["model_state_dict"])
            if "idx_to_category" in ckpt:
                idx_to_category = ckpt["idx_to_category"]
        except Exception as e:
            print(f"Warning loading checkpoint: {e}", file=sys.stderr)

    model.to(device)
    model.eval()

    # 4. Forward Pass
    with torch.no_grad():
        preds = model(tensor_img, boxes=box_tensor)
        probs = torch.softmax(preds["class_logits"], dim=1)[0]
        top_idx = torch.argmax(probs).item()
        confidence = float(probs[top_idx].item())
        cat_name = idx_to_category.get(top_idx, default_categories.get(top_idx, f"Class-{top_idx}"))

        # Mask generation
        mask_logits = preds["mask_logits"][0, 0]
        mask_prob = torch.sigmoid(mask_logits).cpu().numpy()
        mask_binary = (mask_prob > 0.5).astype(np.uint8) * 255

        mask_img = Image.fromarray(mask_binary, mode="L").resize((orig_w, orig_h), Image.Resampling.NEAREST)
        buffer = io.BytesIO()
        mask_img.save(buffer, format="PNG")
        mask_base64 = base64.b64encode(buffer.getvalue()).decode("utf-8")

    result = {
        "category": cat_name,
        "confidence": round(confidence, 4),
        "class_index": top_idx,
        "mask_base64": mask_base64,
        "width": orig_w,
        "height": orig_h
    }

    print(json.dumps(result))

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--image", type=str, required=True, help="Path to input image")
    parser.add_argument("--checkpoint", type=str, default=None, help="Path to checkpoint .pt")
    parser.add_argument("--prompt", type=str, default="{}", help="JSON string with bounding box or prompt points")

    args = parser.parse_args()
    run_inference(args.image, args.checkpoint, args.prompt)
