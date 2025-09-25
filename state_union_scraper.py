#!/usr/bin/env python3
"""
CIS492/593 Big Data Lab Assignment 1
State of the Union Address Scraper

This script extracts State of the Union addresses from Infoplease.com
and creates a structured dataset for big data processing.

Author: Generated for CIS492/593 Lab Assignment 1
"""

import requests
from bs4 import BeautifulSoup
import pandas as pd
import re
import time
import csv
from urllib.parse import urljoin, urlparse
import logging
from typing import List, Dict, Tuple
import os

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class StateUnionScraper:
    """Main scraper class for State of the Union addresses"""
    
    def __init__(self, base_url: str = "https://www.infoplease.com"):
        self.base_url = base_url
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.addresses_data = []
        
    def get_page(self, url: str) -> BeautifulSoup:
        """Fetch and parse a webpage"""
        try:
            logger.info(f"Fetching: {url}")
            response = self.session.get(url, timeout=30)
            response.raise_for_status()
            return BeautifulSoup(response.content, 'lxml')
        except requests.RequestException as e:
            logger.error(f"Error fetching {url}: {e}")
            return None
    
    def extract_address_links(self, main_page_url: str) -> List[Dict[str, str]]:
        """Extract all State of the Union address links from the main page"""
        soup = self.get_page(main_page_url)
        if not soup:
            return []
        
        links = []
        
        # Find all address links in the table of contents
        toc_section = soup.find('div', class_='toc')
        if toc_section:
            dt_elements = toc_section.find_all('dt')
            
            for dt in dt_elements:
                link_elem = dt.find('a')
                if link_elem and link_elem.get('href'):
                    href = link_elem.get('href')
                    text = link_elem.get_text(strip=True)
                    
                    # Parse president name and date from link text
                    # Format: "George Washington (January 8, 1790)"
                    match = re.match(r'^(.+?)\s*\((.+?)\)$', text)
                    if match:
                        president_name = match.group(1).strip()
                        date_str = match.group(2).strip()
                        
                        # Convert relative URL to absolute
                        full_url = urljoin(self.base_url, href)
                        
                        links.append({
                            'president_name': president_name,
                            'date': date_str,
                            'url': full_url,
                            'original_text': text
                        })
        
        logger.info(f"Found {len(links)} address links")
        return links
    
    def extract_address_text(self, url: str) -> str:
        """Extract the full text of a State of the Union address"""
        soup = self.get_page(url)
        if not soup:
            return ""
        
        # Look for the main content area
        content_selectors = [
            'div.article-content',
            'div.content',
            'div.main-content',
            'article',
            'div[role="article"]'
        ]
        
        content_text = ""
        
        for selector in content_selectors:
            content_elem = soup.select_one(selector)
            if content_elem:
                # Remove script and style elements
                for script in content_elem(["script", "style"]):
                    script.decompose()
                
                content_text = content_elem.get_text(separator=' ', strip=True)
                if content_text:
                    break
        
        # If no specific content area found, try to get all text
        if not content_text:
            # Remove navigation and header elements
            for elem in soup(['nav', 'header', 'footer', 'aside']):
                elem.decompose()
            
            content_text = soup.get_text(separator=' ', strip=True)
        
        # Clean up the text
        content_text = re.sub(r'\s+', ' ', content_text)  # Normalize whitespace
        content_text = content_text.strip()
        
        return content_text
    
    def process_all_addresses(self, main_page_url: str) -> List[Dict[str, str]]:
        """Process all State of the Union addresses"""
        logger.info("Starting to process all State of the Union addresses...")
        
        # Get all address links
        address_links = self.extract_address_links(main_page_url)
        
        if not address_links:
            logger.error("No address links found")
            return []
        
        processed_addresses = []
        
        for i, link_info in enumerate(address_links, 1):
            logger.info(f"Processing address {i}/{len(address_links)}: {link_info['president_name']} - {link_info['date']}")
            
            try:
                # Extract the full text of the address
                address_text = self.extract_address_text(link_info['url'])
                
                if address_text:
                    processed_addresses.append({
                        'president_name': link_info['president_name'],
                        'date': link_info['date'],
                        'url': link_info['url'],
                        'address_text': address_text
                    })
                    logger.info(f"Successfully processed: {link_info['president_name']} - {link_info['date']}")
                else:
                    logger.warning(f"No text found for: {link_info['president_name']} - {link_info['date']}")
                
                # Be respectful to the server
                time.sleep(1)
                
            except Exception as e:
                logger.error(f"Error processing {link_info['president_name']} - {link_info['date']}: {e}")
                continue
        
        logger.info(f"Successfully processed {len(processed_addresses)} addresses")
        return processed_addresses
    
    def save_to_csv(self, data: List[Dict[str, str]], filename: str = "state_union_addresses.csv"):
        """Save data to CSV file"""
        if not data:
            logger.warning("No data to save")
            return
        
        df = pd.DataFrame(data)
        df.to_csv(filename, index=False, encoding='utf-8')
        logger.info(f"Data saved to {filename}")
        
        # Also save as TSV
        tsv_filename = filename.replace('.csv', '.tsv')
        df.to_csv(tsv_filename, sep='\t', index=False, encoding='utf-8')
        logger.info(f"Data also saved to {tsv_filename}")
    
    def create_combined_text_file(self, data: List[Dict[str, str]], filename: str = "all_state_union_addresses.txt"):
        """Create a combined text file with all addresses (Extra Credit)"""
        if not data:
            logger.warning("No data to combine")
            return
        
        with open(filename, 'w', encoding='utf-8') as f:
            for address in data:
                f.write(f"=== {address['president_name']} - {address['date']} ===\n")
                f.write(f"URL: {address['url']}\n\n")
                f.write(address['address_text'])
                f.write("\n\n" + "="*80 + "\n\n")
        
        logger.info(f"Combined text file saved to {filename}")
    
    def create_sql_table_script(self, table_name: str = "StateUnionAddresses") -> str:
        """Generate SQL script to create table"""
        sql_script = f"""
-- SQL Server table creation script for State of the Union addresses
CREATE TABLE {table_name} (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    PresidentName NVARCHAR(255) NOT NULL,
    DateOfAddress NVARCHAR(100) NOT NULL,
    LinkToAddress NVARCHAR(500) NOT NULL,
    AddressText NTEXT NOT NULL,
    CreatedDate DATETIME DEFAULT GETDATE()
);

-- Create index on President name for better query performance
CREATE INDEX IX_{table_name}_PresidentName ON {table_name} (PresidentName);

-- Create index on Date for chronological queries
CREATE INDEX IX_{table_name}_Date ON {table_name} (DateOfAddress);
"""
        return sql_script

def main():
    """Main execution function"""
    # Main page URL
    main_page_url = "https://www.infoplease.com/homework-help/history/collected-state-union-addresses-us-presidents"
    
    # Initialize scraper
    scraper = StateUnionScraper()
    
    try:
        # Process all addresses
        addresses_data = scraper.process_all_addresses(main_page_url)
        
        if addresses_data:
            # Save to CSV/TSV
            scraper.save_to_csv(addresses_data)
            
            # Create combined text file (Extra Credit)
            scraper.create_combined_text_file(addresses_data)
            
            # Generate SQL table creation script
            sql_script = scraper.create_sql_table_script()
            with open('create_table.sql', 'w', encoding='utf-8') as f:
                f.write(sql_script)
            logger.info("SQL table creation script saved to create_table.sql")
            
            # Print summary
            print(f"\n=== SCRAPING COMPLETE ===")
            print(f"Total addresses processed: {len(addresses_data)}")
            print(f"Output files created:")
            print(f"  - state_union_addresses.csv")
            print(f"  - state_union_addresses.tsv")
            print(f"  - all_state_union_addresses.txt (combined text)")
            print(f"  - create_table.sql (SQL table creation script)")
            
        else:
            logger.error("No data was extracted")
            
    except Exception as e:
        logger.error(f"Error in main execution: {e}")
        raise

if __name__ == "__main__":
    main()