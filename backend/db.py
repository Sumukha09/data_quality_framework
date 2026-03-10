import os
from dotenv import load_dotenv
load_dotenv()
import datetime
from supabase import create_client, Client


_client: Client | None = None

def get_client() -> Client:
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL")
        key = os.getenv("SUPABASE_KEY")   
        if not url or not key:
            raise RuntimeError("SUPABASE_URL and SUPABASE_KEY env vars must be set")
        _client = create_client(url, key)
    return _client

def ensure_utc(dt: datetime.datetime) -> datetime.datetime:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=datetime.timezone.utc)
    return dt.astimezone(datetime.timezone.utc)

#
async def ensure_schema() -> None:
    """Table must exist in Supabase already. This is a no-op kept for compatibility."""
    print("[*] Database: Using Supabase REST — schema check skipped (manage via Supabase dashboard).")

async def close_pool() -> None:
    """No-op — no persistent pool with REST client."""
    pass


async def insert_file_metadata(metadata: dict) -> None:
    client = get_client()
    row = {
        "id":                  str(metadata.get("id")),
        "file_name":           metadata.get("file_name"),
        "file_path":           metadata.get("file_path"),
        "file_type":           metadata.get("file_type"),
        "source":              metadata.get("source"),
        "status":              metadata.get("status"),
        "size":                metadata.get("size"),
        "upload_date":         ensure_utc(metadata.get("upload_date")).isoformat() if metadata.get("upload_date") else None,
        "url":                 metadata.get("url"),
        "analysis_report_url": metadata.get("analysis_report_url"),
    }
    client.table("file_metadata").insert(row).execute()


async def update_file_status_and_report(file_id: str, status: str, report_url: str) -> None:
    get_client().table("file_metadata").update({
        "status":              status,
        "analysis_report_url": report_url,
    }).eq("id", file_id).execute()

async def update_parquet_urls(file_id: str, raw_url: str, cleaned_url: str) -> None:
    get_client().table("file_metadata").update({
        "raw_parquet_url":     raw_url,
        "cleaned_parquet_url": cleaned_url,
    }).eq("id", file_id).execute()

async def update_eda_urls(file_id: str, raw_eda_url: str, cleaned_eda_url: str) -> None:
    get_client().table("file_metadata").update({
        "raw_eda_profile_url": raw_eda_url,
        "eda_profile_url":     cleaned_eda_url,
    }).eq("id", file_id).execute()


async def get_record_by_id(file_id: str):
    result = get_client().table("file_metadata").select(
        "id, file_name, file_type, source, status, size, upload_date, "
        "analysis_report_url, eda_profile_url, raw_eda_profile_url, "
        "url, raw_parquet_url, cleaned_parquet_url"
    ).eq("id", file_id).execute()

    if not result.data:
        return None

    record = result.data[0]
    record["id"] = str(record["id"])
    record["raw_file_url"] = record.pop("url", None)

    upload_date = datetime.datetime.fromisoformat(record["upload_date"])
    upload_date = ensure_utc(upload_date)
    record["upload_date"] = upload_date.isoformat()

    now_utc = datetime.datetime.now(datetime.timezone.utc)
    days_old = (now_utc - upload_date).days

    if days_old >= 7:
        record["expired"] = True
        record["analysis_report_url"] = None
        record["eda_profile_url"] = None
        record["raw_eda_profile_url"] = None
    else:
        record["expired"] = False

    return record

async def get_expired_records(threshold_days: int = 7):
    cutoff = (datetime.datetime.now(datetime.timezone.utc) -
              datetime.timedelta(days=threshold_days)).isoformat()

    result = get_client().table("file_metadata").select(
        "id, url, analysis_report_url, eda_profile_url, raw_eda_profile_url, "
        "raw_parquet_url, cleaned_parquet_url"
    ).lt("upload_date", cutoff).neq("status", "purged").execute()

    return result.data or []

async def mark_as_purged(file_id: str) -> None:
    get_client().table("file_metadata").update({
        "status":              "purged",
        "analysis_report_url": None,
        "url":                 None,
    }).eq("id", file_id).execute()