#!/usr/bin/env python3
"""
CIS492/593 Big Data Lab Assignment 1 - Complete Execution Script
This script runs the complete pipeline for extracting State of the Union addresses
"""

import subprocess
import sys
import os
import logging
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def install_requirements():
    """Install required Python packages"""
    logger.info("Installing required packages...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        logger.info("Requirements installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Failed to install requirements: {e}")
        return False

def run_scraper():
    """Run the main scraper"""
    logger.info("Starting State of the Union scraper...")
    try:
        subprocess.check_call([sys.executable, "state_union_scraper.py"])
        logger.info("Scraper completed successfully")
        return True
    except subprocess.CalledProcessError as e:
        logger.error(f"Scraper failed: {e}")
        return False

def check_output_files():
    """Check if output files were created"""
    expected_files = [
        "state_union_addresses.csv",
        "state_union_addresses.tsv", 
        "all_state_union_addresses.txt",
        "create_table.sql"
    ]
    
    missing_files = []
    for file in expected_files:
        if not os.path.exists(file):
            missing_files.append(file)
    
    if missing_files:
        logger.warning(f"Missing output files: {missing_files}")
        return False
    else:
        logger.info("All output files created successfully")
        return True

def print_summary():
    """Print execution summary"""
    print("\n" + "="*60)
    print("CIS492/593 Big Data Lab Assignment 1 - EXECUTION SUMMARY")
    print("="*60)
    
    # Check output files
    output_files = [
        ("state_union_addresses.csv", "CSV data file"),
        ("state_union_addresses.tsv", "TSV data file"),
        ("all_state_union_addresses.txt", "Combined text file (Extra Credit)"),
        ("create_table.sql", "SQL table creation script")
    ]
    
    print("\nOutput Files Created:")
    for filename, description in output_files:
        if os.path.exists(filename):
            size = os.path.getsize(filename)
            print(f"  ✓ {filename} ({size:,} bytes) - {description}")
        else:
            print(f"  ✗ {filename} - {description} (MISSING)")
    
    # Show sample data if CSV exists
    if os.path.exists("state_union_addresses.csv"):
        try:
            import pandas as pd
            df = pd.read_csv("state_union_addresses.csv")
            print(f"\nData Summary:")
            print(f"  Total records: {len(df)}")
            print(f"  Columns: {list(df.columns)}")
            
            if len(df) > 0:
                print(f"\nSample record:")
                sample = df.iloc[0]
                print(f"  President: {sample['president_name']}")
                print(f"  Date: {sample['date']}")
                print(f"  URL: {sample['url']}")
                print(f"  Text length: {len(sample['address_text'])} characters")
        except Exception as e:
            logger.warning(f"Could not analyze CSV file: {e}")
    
    print("\nNext Steps:")
    print("1. Review the generated CSV/TSV files")
    print("2. Use create_table.sql to create the database table")
    print("3. Load data into SQL Server using database_manager.py")
    print("4. Use all_state_union_addresses.txt for text mining analysis")
    
    print("\n" + "="*60)

def main():
    """Main execution function"""
    print("CIS492/593 Big Data Lab Assignment 1")
    print("State of the Union Address Scraper")
    print("="*50)
    
    try:
        # Step 1: Install requirements
        if not install_requirements():
            print("Failed to install requirements. Please check your Python environment.")
            return False
        
        # Step 2: Run scraper
        if not run_scraper():
            print("Scraper failed. Check the logs for details.")
            return False
        
        # Step 3: Check output files
        if not check_output_files():
            print("Some output files are missing. Check the logs for details.")
            return False
        
        # Step 4: Print summary
        print_summary()
        
        print("\nLab Assignment 1 completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        print(f"Execution failed: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)