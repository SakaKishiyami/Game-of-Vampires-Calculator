# CIS492/593 Big Data Lab Assignment 1
## State of the Union Address Scraper

This project implements a web scraping solution to extract State of the Union addresses from Infoplease.com and create a structured dataset for big data processing.

## Project Overview

The solution extracts the following information from each State of the Union address:
- Name of President
- Date of Union Address  
- Link to Address
- Full Text of Union Address

## Files Structure

```
├── state_union_scraper.py      # Main scraper script
├── database_manager.py         # SQL Server database operations
├── run_lab1.py                # Complete execution script
├── requirements.txt            # Python dependencies
├── README_Lab1.md             # This documentation
└── Output Files (generated):
    ├── state_union_addresses.csv      # CSV data file
    ├── state_union_addresses.tsv      # TSV data file  
    ├── all_state_union_addresses.txt # Combined text file (Extra Credit)
    └── create_table.sql               # SQL table creation script
```

## Setup Instructions

### Prerequisites
- Python 3.7 or higher
- SQL Server (for database operations)
- Internet connection

### Installation

1. **Clone or download the project files**

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Verify installation:**
   ```bash
   python -c "import requests, bs4, pandas, pyodbc; print('All packages installed successfully')"
   ```

## Usage

### Option 1: Complete Automated Execution
```bash
python run_lab1.py
```

This will:
- Install all required packages
- Run the scraper
- Generate all output files
- Display execution summary

### Option 2: Manual Execution

1. **Run the scraper:**
   ```bash
   python state_union_scraper.py
   ```

2. **Set up database (optional):**
   ```bash
   python database_manager.py
   ```

## Output Files

### 1. CSV/TSV Data Files
- **state_union_addresses.csv**: Structured data in CSV format
- **state_union_addresses.tsv**: Structured data in TSV format

**Format:**
```
president_name,date,url,address_text
George Washington,January 8 1790,https://...,Fellow-Citizens of the Senate...
```

### 2. Combined Text File (Extra Credit)
- **all_state_union_addresses.txt**: All addresses combined into one text file for text mining

### 3. SQL Table Creation Script
- **create_table.sql**: SQL Server script to create the database table

## Database Setup

### SQL Server Table Schema
```sql
CREATE TABLE StateUnionAddresses (
    ID INT IDENTITY(1,1) PRIMARY KEY,
    PresidentName NVARCHAR(255) NOT NULL,
    DateOfAddress NVARCHAR(100) NOT NULL,
    LinkToAddress NVARCHAR(500) NOT NULL,
    AddressText NTEXT NOT NULL,
    CreatedDate DATETIME DEFAULT GETDATE()
);
```

### Loading Data into SQL Server

1. **Create the table:**
   ```sql
   -- Run the create_table.sql script in SQL Server Management Studio
   ```

2. **Load data using Python:**
   ```python
   from database_manager import DatabaseManager
   
   db = DatabaseManager(
       server='your_server',
       database='your_database',
       username='your_username',  # optional for Windows auth
       password='your_password'  # optional for Windows auth
   )
   
   if db.connect():
       db.create_table()
       db.bulk_insert_from_csv('state_union_addresses.csv')
   ```

## Technical Implementation

### Web Scraping Method
- **Method**: DOM Parser with BeautifulSoup4 and XPath-like selectors
- **Approach**: Semi-structured data extraction from HTML
- **Respectful scraping**: 1-second delay between requests

### Data Processing Pipeline
1. **Parse main collection page** to extract all address links
2. **Visit each address page** to extract full text
3. **Clean and normalize** extracted data
4. **Export to multiple formats** (CSV, TSV, combined text)
5. **Generate SQL scripts** for database integration

### Error Handling
- Robust error handling for network issues
- Graceful handling of missing or malformed data
- Comprehensive logging for debugging

## Expected Results

The scraper should extract approximately 200+ State of the Union addresses from:
- George Washington (1790-1796)
- John Adams (1797-1800)  
- Thomas Jefferson (1801-1808)
- James Madison (1809-1816)
- James Monroe (1817-1824)
- And many more through modern presidents

## Troubleshooting

### Common Issues

1. **Network Connection Errors**
   - Ensure stable internet connection
   - Check if Infoplease.com is accessible

2. **Missing Dependencies**
   ```bash
   pip install --upgrade -r requirements.txt
   ```

3. **Database Connection Issues**
   - Verify SQL Server is running
   - Check connection parameters in database_manager.py

4. **Empty Output Files**
   - Check the logs for specific error messages
   - Verify the target website structure hasn't changed

### Debug Mode
Enable detailed logging by modifying the logging level:
```python
logging.basicConfig(level=logging.DEBUG)
```

## Lab Assignment Requirements Compliance

### Part 1: Data Extraction ✅
- [x] Extract President Name
- [x] Extract Date of Union Address  
- [x] Extract Link to Address
- [x] Extract Full Text of Address
- [x] Create CSV/TSV output files
- [x] Generate SQL table creation script

### Part 2: Extra Credit ✅
- [x] Create combined text file with all addresses
- [x] Format suitable for text mining analysis

### Technical Requirements ✅
- [x] Server-side Python script
- [x] DOM Parser with BeautifulSoup4
- [x] XPath-like element selection
- [x] Structured data extraction
- [x] Database integration capabilities
- [x] Bulk data operations

## Performance Notes

- **Processing time**: Approximately 5-10 minutes for full extraction
- **Data size**: ~50-100MB for all combined text
- **Memory usage**: Minimal (processes one address at a time)
- **Network usage**: Respectful with 1-second delays

## Future Enhancements

- Parallel processing for faster extraction
- Advanced text cleaning and normalization
- Integration with other data sources
- Machine learning analysis capabilities
- Real-time monitoring dashboard

## Support

For issues or questions:
1. Check the logs for specific error messages
2. Verify all dependencies are installed
3. Test network connectivity to target website
4. Review the troubleshooting section above

---

**Lab Assignment 1 - CIS492/593 Big Data**  
**State of the Union Address Scraper**  
**Generated for Academic Use**