"""
SAM Dataset Loader for PyTorch
Loads image files, masks, bounding box prompts, and classification labels from manifest.
"""

import os
import json
import torch
from torch.utils.data import Dataset
from PIL import Image
import torchvision.transforms as T
import numpy as np

class SAMFintechDataset(Dataset):
    def __init__(self, manifest_path: str, split: str = "train", img_size: int = 256):
        self.img_size = img_size
        self.split = split.lower()
        self.items = []
        self.category_to_idx = {}
        self.idx_to_category = {}

        if not os.path.exists(manifest_path):
            raise FileNotFoundError(f"Manifest file not found at: {manifest_path}")

        with open(manifest_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        for cat in data.get("categories", []):
            idx = cat.get("classIndex", len(self.category_to_idx))
            name = cat.get("name", f"Class-{idx}")
            self.category_to_idx[name] = idx
            self.idx_to_category[idx] = name

        raw_images = data.get("images", [])
        for img_entry in raw_images:
            entry_split = img_entry.get("split", "train").lower()
            if self.split == "all" or entry_split == self.split:
                self.items.append(img_entry)

        # Standard Vision Normalization (ImageNet stats)
        self.transform = T.Compose([
            T.Resize((self.img_size, self.img_size)),
            T.ToTensor(),
            T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])

    def __len__(self):
        return len(self.items)

    def __getitem__(self, idx):
        item = self.items[idx]
        file_path = item.get("filePath")

        # Load image (or create synthetic image if physical file doesn't exist yet)
        if file_path and os.path.exists(file_path):
            try:
                image = Image.open(file_path).convert("RGB")
            except Exception:
                image = Image.new("RGB", (self.img_size, self.img_size), color=(30, 41, 59))
        else:
            image = Image.new("RGB", (self.img_size, self.img_size), color=(30, 41, 59))

        image_tensor = self.transform(image)

        # Class Label
        cat_name = item.get("categoryName", "")
        cat_idx = self.category_to_idx.get(cat_name, 0)
        label_tensor = torch.tensor(cat_idx, dtype=torch.long)

        # Mask (if available, otherwise generate synthetic center object mask for SAM)
        mask_path = item.get("maskPath")
        if mask_path and os.path.exists(mask_path):
            try:
                mask = Image.open(mask_path).convert("L").resize((self.img_size, self.img_size))
                mask_arr = (np.array(mask) > 128).astype(np.float32)
                mask_tensor = torch.from_numpy(mask_arr).unsqueeze(0)
            except Exception:
                mask_tensor = self._generate_default_mask()
        else:
            mask_tensor = self._generate_default_mask()

        # Prompt Box [x_min, y_min, x_max, y_max] normalized
        bbox_raw = item.get("bbox")
        if bbox_raw:
            try:
                box_coords = json.loads(bbox_raw) if isinstance(bbox_raw, str) else bbox_raw
                box_tensor = torch.tensor(box_coords, dtype=torch.float32)
            except Exception:
                box_tensor = torch.tensor([0.1, 0.1, 0.9, 0.9], dtype=torch.float32)
        else:
            box_tensor = torch.tensor([0.1, 0.1, 0.9, 0.9], dtype=torch.float32)

        return {
            "image": image_tensor,
            "label": label_tensor,
            "mask": mask_tensor,
            "box": box_tensor,
            "id": item.get("id"),
            "categoryName": cat_name
        }

    def _generate_default_mask(self):
        # Generates a smooth rounded rectangular mask representing the segmented object
        mask = np.zeros((self.img_size, self.img_size), dtype=np.float32)
        margin_y = int(self.img_size * 0.2)
        margin_x = int(self.img_size * 0.15)
        mask[margin_y:self.img_size - margin_y, margin_x:self.img_size - margin_x] = 1.0
        return torch.from_numpy(mask).unsqueeze(0)
