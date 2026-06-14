from __future__ import annotations

from pathlib import Path
from typing import Optional, Tuple

import numpy as np
import torch
import torch.nn as nn
from torch.utils.data import DataLoader, TensorDataset


class _LSTMNet(nn.Module):
    def __init__(self, input_size: int, hidden_size: int = 64, num_layers: int = 1, dropout: float = 0.1):
        super().__init__()
        self.lstm = nn.LSTM(input_size, hidden_size, num_layers=num_layers, batch_first=True, dropout=dropout)
        self.head = nn.Sequential(nn.Linear(hidden_size, 32), nn.ReLU(), nn.Dropout(dropout), nn.Linear(32, 1))

    def forward(self, x):
        # x: (batch, seq_len, features)
        out, _ = self.lstm(x)
        # use last timestep
        last = out[:, -1, :]
        return self.head(last).squeeze(-1)


class LSTMModel:
    def __init__(self, input_size: int, hidden_size: int = 64, num_layers: int = 1, lr: float = 1e-3, device: Optional[str] = None):
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.net = _LSTMNet(input_size=input_size, hidden_size=hidden_size, num_layers=num_layers).to(self.device)
        self.optimizer = torch.optim.Adam(self.net.parameters(), lr=lr)
        self.criterion = nn.BCEWithLogitsLoss()

    def fit(self, X: np.ndarray, y: np.ndarray, X_val: Optional[np.ndarray] = None, y_val: Optional[np.ndarray] = None, epochs: int = 50, batch_size: int = 64, early_stopping: int = 5, checkpoint_path: Optional[Path] = None):
        ds = TensorDataset(torch.tensor(X, dtype=torch.float32), torch.tensor(y, dtype=torch.float32))
        loader = DataLoader(ds, batch_size=batch_size, shuffle=True)

        best_loss = float("inf")
        epochs_no_improve = 0

        for epoch in range(1, epochs + 1):
            self.net.train()
            total_loss = 0.0
            for xb, yb in loader:
                xb = xb.to(self.device)
                yb = yb.to(self.device)
                self.optimizer.zero_grad()
                logits = self.net(xb)
                loss = self.criterion(logits, yb)
                loss.backward()
                self.optimizer.step()
                total_loss += float(loss.detach().cpu().numpy()) * xb.size(0)
            avg_loss = total_loss / len(ds)

            val_loss = None
            if X_val is not None and y_val is not None:
                self.net.eval()
                with torch.no_grad():
                    xb = torch.tensor(X_val, dtype=torch.float32).to(self.device)
                    yb = torch.tensor(y_val, dtype=torch.float32).to(self.device)
                    logits = self.net(xb)
                    val_loss = float(self.criterion(logits, yb).cpu().numpy())

            # Early stopping logic
            monitor = val_loss if val_loss is not None else avg_loss
            if monitor < best_loss:
                best_loss = monitor
                epochs_no_improve = 0
                # save checkpoint
                if checkpoint_path:
                    self.save(checkpoint_path)
            else:
                epochs_no_improve += 1
                if epochs_no_improve >= early_stopping:
                    break

        return {"train_loss": avg_loss, "val_loss": val_loss}

    def predict_proba(self, X: np.ndarray, batch_size: int = 128) -> np.ndarray:
        self.net.eval()
        preds = []
        with torch.no_grad():
            for i in range(0, len(X), batch_size):
                xb = torch.tensor(X[i : i + batch_size], dtype=torch.float32).to(self.device)
                logits = self.net(xb)
                probs = torch.sigmoid(logits).cpu().numpy()
                preds.append(probs)
        if preds:
            return np.concatenate(preds, axis=0)
        return np.array([])

    def predict(self, X: np.ndarray, threshold: float = 0.5) -> np.ndarray:
        probs = self.predict_proba(X)
        return (probs >= threshold).astype(int)

    def save(self, path: Path | str):
        path = Path(path)
        path.parent.mkdir(parents=True, exist_ok=True)
        torch.save({"state_dict": self.net.state_dict(), "optimizer": self.optimizer.state_dict()}, path)

    def load(self, path: Path | str):
        data = torch.load(path, map_location=self.device)
        self.net.load_state_dict(data["state_dict"]) 
        if "optimizer" in data:
            try:
                self.optimizer.load_state_dict(data["optimizer"])
            except Exception:
                pass
