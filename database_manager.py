#!/usr/bin/env python3
"""
Database Manager for State of the Union Addresses
Handles SQL Server connection and bulk data operations
"""

import pyodbc
import pandas as pd
import logging
from typing import List, Dict
import os

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Handles database operations for State of the Union addresses"""
    
    def __init__(self, server: str, database: str, username: str = None, password: str = None, 
                 driver: str = "ODBC Driver 17 for SQL Server"):
        self.server = server
        self.database = database
        self.username = username
        self.password = password
        self.driver = driver
        self.connection = None
        
    def connect(self) -> bool:
        """Establish connection to SQL Server"""
        try:
            if self.username and self.password:
                # SQL Server authentication
                connection_string = (
                    f"DRIVER={{{self.driver}}};"
                    f"SERVER={self.server};"
                    f"DATABASE={self.database};"
                    f"UID={self.username};"
                    f"PWD={self.password};"
                )
            else:
                # Windows authentication
                connection_string = (
                    f"DRIVER={{{self.driver}}};"
                    f"SERVER={self.server};"
                    f"DATABASE={self.database};"
                    f"Trusted_Connection=yes;"
                )
            
            self.connection = pyodbc.connect(connection_string)
            logger.info("Successfully connected to SQL Server")
            return True
            
        except Exception as e:
            logger.error(f"Failed to connect to SQL Server: {e}")
            return False
    
    def create_table(self, table_name: str = "StateUnionAddresses") -> bool:
        """Create the State of the Union addresses table"""
        if not self.connection:
            logger.error("No database connection")
            return False
        
        try:
            cursor = self.connection.cursor()
            
            # Drop table if exists
            cursor.execute(f"IF OBJECT_ID('{table_name}', 'U') IS NOT NULL DROP TABLE {table_name}")
            
            # Create table
            create_sql = f"""
            CREATE TABLE {table_name} (
                ID INT IDENTITY(1,1) PRIMARY KEY,
                PresidentName NVARCHAR(255) NOT NULL,
                DateOfAddress NVARCHAR(100) NOT NULL,
                LinkToAddress NVARCHAR(500) NOT NULL,
                AddressText NTEXT NOT NULL,
                CreatedDate DATETIME DEFAULT GETDATE()
            )
            """
            
            cursor.execute(create_sql)
            
            # Create indexes
            cursor.execute(f"CREATE INDEX IX_{table_name}_PresidentName ON {table_name} (PresidentName)")
            cursor.execute(f"CREATE INDEX IX_{table_name}_Date ON {table_name} (DateOfAddress)")
            
            self.connection.commit()
            logger.info(f"Table {table_name} created successfully")
            return True
            
        except Exception as e:
            logger.error(f"Error creating table: {e}")
            return False
    
    def bulk_insert_from_csv(self, csv_file: str, table_name: str = "StateUnionAddresses") -> bool:
        """Bulk insert data from CSV file"""
        if not self.connection:
            logger.error("No database connection")
            return False
        
        try:
            # Read CSV file
            df = pd.read_csv(csv_file)
            
            # Prepare data for insertion
            data_tuples = [
                (row['president_name'], row['date'], row['url'], row['address_text'])
                for _, row in df.iterrows()
            ]
            
            # Insert data
            cursor = self.connection.cursor()
            insert_sql = f"""
            INSERT INTO {table_name} (PresidentName, DateOfAddress, LinkToAddress, AddressText)
            VALUES (?, ?, ?, ?)
            """
            
            cursor.executemany(insert_sql, data_tuples)
            self.connection.commit()
            
            logger.info(f"Successfully inserted {len(data_tuples)} records")
            return True
            
        except Exception as e:
            logger.error(f"Error bulk inserting data: {e}")
            return False
    
    def get_record_count(self, table_name: str = "StateUnionAddresses") -> int:
        """Get the number of records in the table"""
        if not self.connection:
            return 0
        
        try:
            cursor = self.connection.cursor()
            cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
            count = cursor.fetchone()[0]
            return count
        except Exception as e:
            logger.error(f"Error getting record count: {e}")
            return 0
    
    def close(self):
        """Close database connection"""
        if self.connection:
            self.connection.close()
            logger.info("Database connection closed")

def main():
    """Example usage of DatabaseManager"""
    # Database configuration - update these values for your environment
    db_config = {
        'server': 'localhost',  # or your SQL Server instance
        'database': 'BigDataLab',  # your database name
        'username': None,  # set if using SQL Server authentication
        'password': None,  # set if using SQL Server authentication
    }
    
    # Initialize database manager
    db_manager = DatabaseManager(**db_config)
    
    try:
        # Connect to database
        if db_manager.connect():
            # Create table
            if db_manager.create_table():
                # Insert data from CSV (assuming CSV file exists)
                csv_file = "state_union_addresses.csv"
                if os.path.exists(csv_file):
                    if db_manager.bulk_insert_from_csv(csv_file):
                        count = db_manager.get_record_count()
                        print(f"Successfully loaded {count} records into database")
                    else:
                        print("Failed to insert data")
                else:
                    print(f"CSV file {csv_file} not found. Run the scraper first.")
            else:
                print("Failed to create table")
        else:
            print("Failed to connect to database")
    
    finally:
        db_manager.close()

if __name__ == "__main__":
    main()