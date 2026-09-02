"""
Synthetic Data Generation Module
Generates realistic multi-month financial transaction histories for multiple behavioral profiles.
"""

from .config import GenerationConfig, BehavioralProfileType
from .generator import SyntheticDataGenerator

__all__ = ["GenerationConfig", "BehavioralProfileType", "SyntheticDataGenerator"]
