"""
Service to retrieve external API credentials from the platform's central storage.
This allows modules to use platform-managed credentials without requiring user configuration.
"""

import logging
from typing import Optional, Dict, Any
from sqlalchemy import text
from sqlalchemy.orm import Session

logger = logging.getLogger(__name__)


def get_copernicus_credentials(db: Session) -> Optional[Dict[str, str]]:
    """
    Get Copernicus CDSE credentials from platform's external_api_credentials table.
    
    The credentials are stored centrally in the platform database, allowing
    all modules to use the same credentials without requiring per-module configuration.
    
    Args:
        db: Database session (must have access to platform database)
        
    Returns:
        Dictionary with 'client_id' and 'client_secret', or None if not found
        
    Note:
        This function queries the platform's external_api_credentials table.
        The service_name should be 'copernicus-cdse' as configured in the platform.
    """
    try:
        # Query external_api_credentials table (platform table, not module-specific)
        # Note: This table is in the platform database, not the module database
        result = db.execute(text("""
            SELECT 
                username,
                password_encrypted,
                service_url,
                auth_type
            FROM external_api_credentials
            WHERE service_name = 'copernicus-cdse'
            AND is_active = true
            LIMIT 1
        """))
        
        row = result.fetchone()
        
        if not row:
            logger.warning("Copernicus CDSE credentials not found in platform database")
            return None
        
        # Extract credentials
        # Note: password_encrypted might need decryption in production
        # For now, assuming it's stored in a way that can be used directly
        # In production, you might need to decrypt using pgcrypto or similar
        username = row[0]
        password_encrypted = row[1]
        service_url = row[2] or 'https://dataspace.copernicus.eu'
        auth_type = row[3] or 'basic_auth'
        
        if not username or not password_encrypted:
            logger.warning("Copernicus CDSE credentials incomplete (missing username or password)")
            return None
        
        # TODO: Decrypt password_encrypted if needed
        # For now, assuming the platform stores it in a way that can be used directly
        # In production, implement proper decryption based on platform's encryption method
        
        logger.info(f"Successfully retrieved Copernicus CDSE credentials from platform (username: {username[:10]}...)")
        
        return {
            'client_id': username,
            'client_secret': password_encrypted,  # May need decryption
            'service_url': service_url,
            'auth_type': auth_type
        }
        
    except Exception as e:
        # Table might not exist or not accessible - this is OK for modules
        logger.warning(f"Could not retrieve Copernicus credentials from platform: {e}")
        logger.info("Falling back to module-specific configuration")
        return None


def get_copernicus_credentials_with_fallback(
    db: Session,
    fallback_client_id: Optional[str] = None,
    fallback_client_secret: Optional[str] = None
) -> Optional[Dict[str, str]]:
    """
    Get Copernicus credentials with fallback to module-specific config.
    
    First tries to get credentials from platform's central storage.
    If not available, falls back to provided module-specific credentials.
    
    Args:
        db: Database session
        fallback_client_id: Fallback client ID (from module config)
        fallback_client_secret: Fallback client secret (from module config)
        
    Returns:
        Dictionary with credentials or None if neither source available
    """
    # Try platform credentials first
    platform_creds = get_copernicus_credentials(db)
    
    if platform_creds:
        return platform_creds
    
    # Fallback to module-specific config
    if fallback_client_id and fallback_client_secret:
        logger.info("Using module-specific Copernicus credentials (fallback)")
        return {
            'client_id': fallback_client_id,
            'client_secret': fallback_client_secret,
            'service_url': 'https://dataspace.copernicus.eu',
            'auth_type': 'basic_auth'
        }
    
    return None

