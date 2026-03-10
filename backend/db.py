import os
from dotenv import load_dotenv
load_dotenv()
import uuid
import datetime
import asyncpg

# Initialize a connection pool (reuse across requests)
_pool: asyncpg.Pool | None = None

def ensure_utc(dt: datetime.datetime) -> datetime.datetime:
    """Ensure a datetime object is timezone-aware and set to UTC."""
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=datetime.timezone.utc)
    return dt.astimezone(datetime.timezone.utc)

async def get_pool() -> asyncpg.Pool:
    global _pool
    if _pool is None:
        db_url = os.getenv("SUPABASE_DB_URL")  # e.g. postgres://user:pass@host:5432/database
        if not db_url:
            raise RuntimeError("SUPABASE_DB_URL environment variable not set")
            
        retries = 3
        for attempt in range(retries):
            try:
                # Restrict pool size to avoid 'remaining connection slots are reserved for roles with the SUPERUSER attribute'
                _pool = await asyncpg.create_pool(dsn=db_url, min_size=1, max_size=4)
                break
            except Exception as e:
                import asyncio
                if attempt == retries - 1:
                    print(f"[!] Database Connection Exhausted: {e}")
                    raise
                print(f"[*] Database Connection Failed (Attempt {attempt+1}/{retries}): {e}. Retrying in {2 ** attempt}s...")
                await asyncio.sleep(2 ** attempt)  # Exponential backoff: 1s, 2s
                
    return _pool

async def close_pool() -> None:
    """Close the database connection pool."""
    global _pool
    if _pool is not None:
        await _pool.close()
        _pool = None

async def ensure_schema() -> None:
    """Ensure the file_metadata table exists with all required columns."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS file_metadata (
                id UUID PRIMARY KEY,
                file_name TEXT,
                file_path TEXT,
                file_type TEXT,
                source TEXT,
                status TEXT,
                size BIGINT,
                upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                url TEXT,
                analysis_report_url TEXT,
                raw_parquet_url TEXT,
                cleaned_parquet_url TEXT,
                raw_eda_profile_url TEXT,
                eda_profile_url TEXT
            );
            """
        )
        print("[*] Database: Schema verified/created.")

async def insert_file_metadata(metadata: dict) -> None:
    """Insert a row into the metadata table.
    Expected keys in metadata dict:
        id (UUID), file_name, file_path, file_type, source, status,
        size (int), upload_date (datetime), url, analysis_report_url (optional)
    """
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            INSERT INTO file_metadata (
                id, file_name, file_path, file_type, source, status,
                size, upload_date, url, analysis_report_url
            ) VALUES (
                $1::uuid, $2, $3, $4, $5, $6,
                $7, $8, $9, $10
            )
            """,
            metadata.get("id"),
            metadata.get("file_name"),
            metadata.get("file_path"),
            metadata.get("file_type"),
            metadata.get("source"),
            metadata.get("status"),
            metadata.get("size"),
            metadata.get("upload_date"),
            metadata.get("url"),
            metadata.get("analysis_report_url"),
        )

async def update_file_status_and_report(file_id: str, status: str, report_url: str) -> None:
    """Update the status and analysis_report_url of an existing file record."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE file_metadata 
            SET status = $2, analysis_report_url = $3 
            WHERE id = $1::uuid
            """,
            file_id, status, report_url
        )

async def update_parquet_urls(file_id: str, raw_url: str, cleaned_url: str) -> None:
    """Update raw and cleaned parquet URLs."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE file_metadata SET raw_parquet_url = $2, cleaned_parquet_url = $3 WHERE id = $1::uuid",
            file_id, raw_url, cleaned_url
        )

async def update_eda_urls(file_id: str, raw_eda_url: str, cleaned_eda_url: str) -> None:
    """Update raw and cleaned EDA profile URLs."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            """
            UPDATE file_metadata 
            SET raw_eda_profile_url = $2, eda_profile_url = $3 
            WHERE id = $1::uuid
            """,
            file_id, raw_eda_url, cleaned_eda_url
        )

async def get_record_by_id(file_id: str):
    """Fetch a specific record by ID, checking for 7-day expiry."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        row = await conn.fetchrow(
            """
            SELECT id, file_name, file_type, source, status, size, upload_date, 
                   analysis_report_url, eda_profile_url, raw_eda_profile_url,
                   url as raw_file_url, raw_parquet_url, cleaned_parquet_url
            FROM file_metadata
            WHERE id = $1::uuid
            """,
            file_id
        )
        if not row:
            return None
            
        record = dict(row)
        # Ensure JSON serializable types
        record['id'] = str(record['id'])
        record['upload_date'] = ensure_utc(record['upload_date']).isoformat()
        
        # Check if record is older than 7 days
        # Use ensure_utc to handle both naive and aware datetimes from the DB
        now_utc = datetime.datetime.now(datetime.timezone.utc)
        record_date = datetime.datetime.fromisoformat(record['upload_date'])
        
        days_old = (now_utc - record_date).days
        if days_old >= 7:
            record['expired'] = True
            # Optional: Hide urls if expired
            record['analysis_report_url'] = None
            record['eda_profile_url'] = None
            record['raw_eda_profile_url'] = None
        else:
            record['expired'] = False
            
        return record

async def get_expired_records(threshold_days: int = 7):
    """Find records older than N days for cleanup."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        rows = await conn.fetch(
            """
            SELECT id, url, analysis_report_url, eda_profile_url, raw_eda_profile_url,
                   raw_parquet_url, cleaned_parquet_url
            FROM file_metadata
            WHERE upload_date < NOW() - INTERVAL '1 day' * $1
            AND status != 'purged'
            """,
            threshold_days
        )
        return [dict(row) for row in rows]

async def mark_as_purged(file_id: str):
    """Mark a record as purged after files are deleted from storage."""
    pool = await get_pool()
    async with pool.acquire() as conn:
        await conn.execute(
            "UPDATE file_metadata SET status = 'purged', analysis_report_url = NULL, url = NULL WHERE id = $1::uuid",
            file_id
        )
