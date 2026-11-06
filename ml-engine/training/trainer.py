"""
PyTorch Fine-Tuning Loop for SAM 3
Coordinates epoch iterations, metric calculation, checkpoint serialization,
and HTTP webhook reporting back to the ASP.NET Core API.
"""

import os
import sys
import time
import requests
import torch
from torch.utils.data import DataLoader
from models.sam3_adapter import SAM3FintechClassifier, CombinedSAMLoss
from dataset.sam_dataset import SAMFintechDataset

class SAMTrainer:
    def __init__(
        self,
        job_id: str,
        manifest_path: str,
        api_url: str = "http://localhost:5000",
        epochs: int = 10,
        batch_size: int = 4,
        learning_rate: float = 0.0001,
        freeze_backbone: bool = True,
        checkpoint_dir: str = "./storage/checkpoints",
        device: str = None
    ):
        self.job_id = job_id
        self.manifest_path = manifest_path
        self.api_url = api_url.rstrip("/")
        self.epochs = epochs
        self.batch_size = batch_size
        self.learning_rate = learning_rate
        self.freeze_backbone = freeze_backbone
        self.checkpoint_dir = checkpoint_dir

        os.makedirs(self.checkpoint_dir, exist_ok=True)

        if device is None:
            self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        else:
            self.device = torch.device(device)

        print(f"[SAM-Trainer] Initialized for Job: {job_id} on Device: {self.device}")

    def notify_api_progress(self, epoch: int, step: int, train_loss: float, val_loss: float, acc: float, miou: float, msg: str):
        try:
            payload = {
                "epoch": epoch,
                "step": step,
                "trainLoss": round(float(train_loss), 4),
                "valLoss": round(float(val_loss), 4) if val_loss is not None else None,
                "accuracy": round(float(acc), 4) if acc is not None else None,
                "meanIoU": round(float(miou), 4) if miou is not None else None,
                "logMessage": msg
            }
            url = f"{self.api_url}/api/training/jobs/{self.job_id}/progress"
            requests.post(url, json=payload, timeout=5)
        except Exception as e:
            print(f"[SAM-Trainer] Progress webhook warning: {e}", file=sys.stderr)

    def notify_api_complete(self, checkpoint_path: str, best_acc: float, best_miou: float):
        try:
            payload = {
                "checkpointPath": checkpoint_path,
                "bestAccuracy": round(float(best_acc), 4) if best_acc else None,
                "bestMeanIoU": round(float(best_miou), 4) if best_miou else None
            }
            url = f"{self.api_url}/api/training/jobs/{self.job_id}/complete"
            requests.post(url, json=payload, timeout=5)
        except Exception as e:
            print(f"[SAM-Trainer] Completion webhook warning: {e}", file=sys.stderr)

    def notify_api_fail(self, error_message: str):
        try:
            payload = {"errorMessage": error_message}
            url = f"{self.api_url}/api/training/jobs/{self.job_id}/fail"
            requests.post(url, json=payload, timeout=5)
        except Exception as e:
            print(f"[SAM-Trainer] Failure webhook warning: {e}", file=sys.stderr)

    def compute_iou(self, pred_masks, target_masks, threshold: float = 0.5):
        preds = (torch.sigmoid(pred_masks) > threshold).float()
        intersection = (preds * target_masks).sum(dim=(2, 3))
        union = preds.sum(dim=(2, 3)) + target_masks.sum(dim=(2, 3)) - intersection
        iou = (intersection + 1e-6) / (union + 1e-6)
        return iou.mean().item()

    def run(self):
        try:
            # 1. Datasets & Dataloaders
            train_dataset = SAMFintechDataset(self.manifest_path, split="train")
            val_dataset = SAMFintechDataset(self.manifest_path, split="validation")

            if len(val_dataset) == 0:
                # Use train dataset for validation if user hasn't explicitly partitioned
                val_dataset = train_dataset

            if len(train_dataset) == 0:
                raise ValueError("Training dataset has 0 samples.")

            num_classes = max(len(train_dataset.category_to_idx), 2)
            train_loader = DataLoader(train_dataset, batch_size=min(self.batch_size, len(train_dataset)), shuffle=True)
            val_loader = DataLoader(val_dataset, batch_size=min(self.batch_size, len(val_dataset)), shuffle=False)

            # 2. Model, Loss & Optimizer
            model = SAM3FintechClassifier(
                num_classes=num_classes,
                embed_dim=256,
                freeze_backbone=self.freeze_backbone
            ).to(self.device)

            criterion = CombinedSAMLoss(cls_weight=1.0, seg_weight=1.0)
            trainable_params = [p for p in model.parameters() if p.requires_grad]
            optimizer = torch.optim.AdamW(trainable_params, lr=self.learning_rate, weight_decay=1e-4)
            scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=self.epochs, eta_min=1e-6)

            best_acc = 0.0
            best_miou = 0.0
            best_checkpoint_path = ""

            print(f"[SAM-Trainer] Starting fine-tuning across {self.epochs} epochs with {len(train_dataset)} samples...")

            for epoch in range(1, self.epochs + 1):
                model.train()
                epoch_loss = 0.0
                epoch_cls_loss = 0.0
                epoch_seg_loss = 0.0
                step = 0

                for batch in train_loader:
                    step += 1
                    images = batch["image"].to(self.device)
                    labels = batch["label"].to(self.device)
                    masks = batch["mask"].to(self.device)
                    boxes = batch["box"].to(self.device)

                    optimizer.zero_grad()
                    preds = model(images, boxes=boxes)
                    loss, cls_l, seg_l = criterion(preds, labels, masks)
                    loss.backward()
                    optimizer.step()

                    epoch_loss += loss.item()
                    epoch_cls_loss += cls_l.item()
                    epoch_seg_loss += seg_l.item()

                scheduler.step()
                avg_train_loss = epoch_loss / max(step, 1)

                # Validation Loop
                model.eval()
                val_loss = 0.0
                correct = 0
                total = 0
                total_miou = 0.0
                val_steps = 0

                with torch.no_grad():
                    for batch in val_loader:
                        val_steps += 1
                        images = batch["image"].to(self.device)
                        labels = batch["label"].to(self.device)
                        masks = batch["mask"].to(self.device)
                        boxes = batch["box"].to(self.device)

                        preds = model(images, boxes=boxes)
                        loss, _, _ = criterion(preds, labels, masks)
                        val_loss += loss.item()

                        # Classification Accuracy
                        pred_cls = preds["class_logits"].argmax(dim=1)
                        correct += (pred_cls == labels).sum().item()
                        total += labels.size(0)

                        # Segmentation mIoU
                        iou = self.compute_iou(preds["mask_logits"], masks)
                        total_miou += iou

                avg_val_loss = val_loss / max(val_steps, 1)
                accuracy = (correct / total) if total > 0 else 0.0
                avg_miou = (total_miou / max(val_steps, 1))

                msg = f"Val Loss: {avg_val_loss:.4f} | Accuracy: {accuracy*100:.2f}% | SAM mIoU: {avg_miou:.4f}"
                print(f"[SAM-Trainer] Epoch {epoch}/{self.epochs} - Train Loss: {avg_train_loss:.4f} | {msg}")

                # Save best checkpoint
                if accuracy >= best_acc or epoch == self.epochs:
                    best_acc = max(accuracy, best_acc)
                    best_miou = max(avg_miou, best_miou)
                    ckpt_filename = f"sam3_fintech_{self.job_id[:8]}_epoch{epoch}.pt"
                    full_ckpt_path = os.path.join(self.checkpoint_dir, ckpt_filename)
                    torch.save({
                        "epoch": epoch,
                        "model_state_dict": model.state_dict(),
                        "num_classes": num_classes,
                        "category_to_idx": train_dataset.category_to_idx,
                        "idx_to_category": train_dataset.idx_to_category,
                        "accuracy": accuracy,
                        "mean_iou": avg_miou
                    }, full_ckpt_path)
                    best_checkpoint_path = f"checkpoints/{ckpt_filename}"

                # Report to API
                self.notify_api_progress(
                    epoch=epoch,
                    step=step,
                    train_loss=avg_train_loss,
                    val_loss=avg_val_loss,
                    acc=accuracy,
                    miou=avg_miou,
                    msg=msg
                )

            # Finish Job
            self.notify_api_complete(best_checkpoint_path, best_acc, best_miou)
            print(f"[SAM-Trainer] Training finished successfully. Checkpoint saved: {best_checkpoint_path}")

        except Exception as e:
            err = f"Training failed with exception: {str(e)}"
            print(f"[SAM-Trainer] {err}", file=sys.stderr)
            self.notify_api_fail(err)
            raise e
