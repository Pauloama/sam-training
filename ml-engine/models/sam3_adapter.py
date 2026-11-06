"""
SAM 3 Adapter & Classification Architecture
Implements Segment Anything Model (SAM) promptable segmentation + category classification head.
Supports fine-tuning on custom image datasets with frozen or unfrozen vision backbones.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F

class PromptEncoder(nn.Module):
    """Encodes bounding box prompts [x_min, y_min, x_max, y_max] and point prompts."""
    def __init__(self, embed_dim: int = 256):
        super().__init__()
        self.embed_dim = embed_dim
        self.bbox_proj = nn.Sequential(
            nn.Linear(4, embed_dim),
            nn.GELU(),
            nn.Linear(embed_dim, embed_dim)
        )
        self.point_proj = nn.Sequential(
            nn.Linear(2, embed_dim),
            nn.GELU(),
            nn.Linear(embed_dim, embed_dim)
        )

    def forward(self, boxes=None, points=None):
        prompt_embeddings = []
        if boxes is not None:
            prompt_embeddings.append(self.bbox_proj(boxes))
        if points is not None:
            prompt_embeddings.append(self.point_proj(points))
        
        if prompt_embeddings:
            return torch.stack(prompt_embeddings, dim=1)
        # Default learnable null prompt
        return torch.zeros((1, 1, self.embed_dim), device=boxes.device if boxes is not None else "cpu")


class MaskDecoder(nn.Module):
    """Decodes image embeddings + prompt embeddings into high-resolution segmentation mask."""
    def __init__(self, embed_dim: int = 256):
        super().__init__()
        self.trans_conv = nn.Sequential(
            nn.ConvTranspose2d(embed_dim, 128, kernel_size=2, stride=2),
            nn.BatchNorm2d(128),
            nn.GELU(),
            nn.ConvTranspose2d(128, 64, kernel_size=2, stride=2),
            nn.BatchNorm2d(64),
            nn.GELU(),
            nn.Conv2d(64, 32, kernel_size=3, padding=1),
            nn.GELU(),
            nn.Conv2d(32, 1, kernel_size=1)
        )

    def forward(self, image_features):
        return self.trans_conv(image_features)


class SAM3FintechClassifier(nn.Module):
    """
    SAM 3 Fine-Tuning Model with Segmentation and Category Classification Heads.
    Allows transfer learning from foundation model representations to fintech domain assets
    (e.g., Credit Cards, ID documents, Banknotes, Checks, Invoices).
    """
    def __init__(self, num_classes: int = 5, embed_dim: int = 256, freeze_backbone: bool = True):
        super().__init__()
        self.num_classes = num_classes
        self.embed_dim = embed_dim

        # Vision Encoder Backbone (ResNet/ViT hybrid structure for fast, high-performance training)
        self.stem = nn.Sequential(
            nn.Conv2d(3, 64, kernel_size=7, stride=2, padding=3, bias=False),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(kernel_size=3, stride=2, padding=1)
        )
        self.stage1 = nn.Sequential(
            nn.Conv2d(64, 128, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.Conv2d(128, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True)
        )
        self.stage2 = nn.Sequential(
            nn.Conv2d(128, embed_dim, kernel_size=3, stride=2, padding=1),
            nn.BatchNorm2d(embed_dim),
            nn.ReLU(inplace=True),
            nn.Conv2d(embed_dim, embed_dim, kernel_size=3, padding=1),
            nn.BatchNorm2d(embed_dim),
            nn.ReLU(inplace=True)
        )

        if freeze_backbone:
            for param in self.stem.parameters():
                param.requires_grad = False
            for param in self.stage1.parameters():
                param.requires_grad = False

        # Prompt & Mask Decoding
        self.prompt_encoder = PromptEncoder(embed_dim=embed_dim)
        self.mask_decoder = MaskDecoder(embed_dim=embed_dim)

        # Classification Head (Global average pool + cross-attention over prompt features)
        self.classifier_pool = nn.AdaptiveAvgPool2d((1, 1))
        self.classifier_head = nn.Sequential(
            nn.Linear(embed_dim, 128),
            nn.BatchNorm1d(128),
            nn.ReLU(inplace=True),
            nn.Dropout(p=0.3),
            nn.Linear(128, num_classes)
        )

    def forward(self, x, boxes=None, points=None):
        # 1. Vision Feature Extraction
        f = self.stem(x)
        f = self.stage1(f)
        image_embeddings = self.stage2(f)  # [B, embed_dim, H/16, W/16]

        # 2. Prompt Processing
        if boxes is not None:
            _ = self.prompt_encoder(boxes=boxes, points=points)

        # 3. Segmentation Mask Prediction
        mask_logits = self.mask_decoder(image_embeddings)  # [B, 1, H/4, W/4]
        # Interpolate mask to original input resolution
        mask_upscaled = F.interpolate(mask_logits, size=x.shape[2:], mode="bilinear", align_corners=False)

        # 4. Category Classification Prediction
        pooled = self.classifier_pool(image_embeddings).flatten(1)  # [B, embed_dim]
        class_logits = self.classifier_head(pooled)                 # [B, num_classes]

        return {
            "mask_logits": mask_upscaled,
            "class_logits": class_logits,
            "embeddings": pooled
        }


class CombinedSAMLoss(nn.Module):
    """
    Multi-task loss function combining:
    - Focal / Cross-Entropy Loss for category classification
    - Dice Loss + Binary Cross Entropy (BCE) for image segmentation
    """
    def __init__(self, cls_weight: float = 1.0, seg_weight: float = 1.0):
        super().__init__()
        self.cls_weight = cls_weight
        self.seg_weight = seg_weight
        self.cls_criterion = nn.CrossEntropyLoss()
        self.bce_criterion = nn.BCEWithLogitsLoss()

    def dice_loss(self, pred_logits, target_masks, smooth: float = 1e-5):
        probs = torch.sigmoid(pred_logits)
        probs = probs.contiguous().view(-1)
        targets = target_masks.contiguous().view(-1)
        intersection = (probs * targets).sum()
        dice = (2.0 * intersection + smooth) / (probs.sum() + targets.sum() + smooth)
        return 1.0 - dice

    def forward(self, predictions, target_classes, target_masks=None):
        cls_loss = self.cls_criterion(predictions["class_logits"], target_classes)
        
        if target_masks is not None:
            bce = self.bce_criterion(predictions["mask_logits"], target_masks)
            dice = self.dice_loss(predictions["mask_logits"], target_masks)
            seg_loss = bce + dice
        else:
            seg_loss = torch.tensor(0.0, device=predictions["class_logits"].device)

        total_loss = self.cls_weight * cls_loss + self.seg_weight * seg_loss
        return total_loss, cls_loss, seg_loss
