import os
import pandas as pd
import logging
from paths import get_workspace_dir

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)
if not logger.handlers:
    ch = logging.StreamHandler()
    formatter = logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s")
    ch.setFormatter(formatter)
    logger.addHandler(ch)


class DataProfiler:
    def __init__(self):
        workspace = get_workspace_dir()
        self.output_dir = workspace["processed"]

    def generate(self, df: pd.DataFrame, title: str = "Gesix EDA Profile", output_filename: str = "eda_profile.html") -> str | None:
        try:
            from ydata_profiling import ProfileReport
        except ImportError:
            logger.warning("ydata-profiling is not installed.")
            return None

        if df is None or df.empty:
            return None

        df = df.drop(columns=[c for c in ['remediation_notes', 'ingested_at', 'source' ] if c in df.columns])

        try:
            profile = ProfileReport(
                df,
                title=title,
                minimal=True,          
                progress_bar=False,
                correlations=None,    
                missing_diagrams=None, 
                interactions=None,    
                samples=None,          
            )

            output_path = os.path.join(self.output_dir, output_filename)
            profile.to_file(output_path)
            logger.info(f"DataProfiler: EDA report saved → {output_path}")
            return output_path

        except Exception as e:
            logger.error(f"DataProfiler: Failed — {e}")
            return None

    def generate_from_parquet(self, parquet_path: str) -> str | None:
        if not os.path.exists(parquet_path):
            return None
        try:
            df = pd.read_parquet(parquet_path)
            return self.generate(df)
        except Exception as e:
            logger.error(f"DataProfiler: Could not read parquet — {e}")
            return None