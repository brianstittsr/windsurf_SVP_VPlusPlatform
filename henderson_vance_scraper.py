#!/usr/bin/env python3
"""
Henderson Vance Business Directory Scraper
Scrapes all companies from https://business.hendersonvance.org/list
"""

import requests
from bs4 import BeautifulSoup
import csv
import time
import re
from urllib.parse import urljoin, urlparse
from typing import List, Dict, Optional

class HendersonVanceScraper:
    def __init__(self):
        self.base_url = "https://business.hendersonvance.org"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.companies = []
        
    def get_page(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch and parse a webpage"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return BeautifulSoup(response.content, 'html.parser')
        except requests.RequestException as e:
            print(f"Error fetching {url}: {e}")
            return None
    
    def get_category_links(self) -> List[str]:
        """Get all category links from the main page"""
        soup = self.get_page(f"{self.base_url}/list")
        if not soup:
            return []
        
        category_links = []
        # Find all category links (they follow the pattern /list/ql/category-name-number)
        for link in soup.find_all('a', href=True):
            href = link['href']
            if '/list/ql/' in href:
                full_url = urljoin(self.base_url, href)
                category_links.append(full_url)
        
        return category_links
    
    def get_alphabetical_links(self) -> List[str]:
        """Get all alphabetical links"""
        soup = self.get_page(f"{self.base_url}/list")
        if not soup:
            return []
        
        alpha_links = []
        # Find alphabetical links (they follow the pattern /list/searchalpha/letter)
        for link in soup.find_all('a', href=True):
            href = link['href']
            if '/list/searchalpha/' in href:
                full_url = urljoin(self.base_url, href)
                alpha_links.append(full_url)
        
        return alpha_links
    
    def extract_company_from_list_page(self, company_element) -> Dict:
        """Extract company information from a list page element"""
        company_data = {}
        
        # Company name and link
        name_link = company_element.find('a')
        if name_link:
            company_data['name'] = name_link.get_text(strip=True)
            company_data['detail_url'] = urljoin(self.base_url, name_link['href'])
        else:
            return None
        
        # Extract address
        address_element = company_element.find('a', href=re.compile(r'google\.com/maps'))
        if address_element:
            address_text = address_element.get_text(strip=True)
            # Parse address components
            address_lines = [line.strip() for line in address_text.split('\n') if line.strip()]
            if len(address_lines) >= 3:
                company_data['address'] = address_lines[0]
                company_data['city'] = address_lines[1]
                company_data['state'] = address_lines[2] if len(address_lines[2]) == 2 else ''
                company_data['zip'] = address_lines[3] if len(address_lines) > 3 else ''
            elif len(address_lines) == 2:
                company_data['address'] = address_lines[0]
                company_data['city'] = address_lines[1].split(',')[0] if ',' in address_lines[1] else address_lines[1]
                company_data['state'] = address_lines[1].split(',')[1].strip().split()[0] if ',' in address_lines[1] and len(address_lines[1].split(',')) > 1 else ''
                company_data['zip'] = ' '.join(address_lines[1].split(',')[1].strip().split()[1:]) if ',' in address_lines[1] and len(address_lines[1].split(',')) > 1 and len(address_lines[1].split(',')[1].strip().split()) > 1 else ''
        
        # Extract phone numbers
        phone_links = company_element.find_all('a', href=re.compile(r'tel:'))
        phones = []
        for phone_link in phone_links:
            phone = phone_link['href'].replace('tel:', '').strip()
            phones.append(phone)
        
        company_data['phone1'] = phones[0] if len(phones) > 0 else ''
        company_data['phone2'] = phones[1] if len(phones) > 1 else ''
        
        return company_data
    
    def get_companies_from_page(self, url: str) -> List[Dict]:
        """Get all companies from a category or alphabetical page"""
        soup = self.get_page(url)
        if not soup:
            return []
        
        companies = []
        
        # Look for company entries - they seem to be in a specific pattern
        # Based on the structure I saw, companies are listed with their names as links
        content_area = soup.find('div', class_='content') or soup.find('main') or soup
        
        # Find all company entries
        company_elements = content_area.find_all('h5')  # Company names are in h5 tags
        
        for element in company_elements:
            # Get the parent container that holds all company info
            company_container = element.parent
            company_data = self.extract_company_from_list_page(company_container)
            if company_data:
                companies.append(company_data)
        
        # Also check for other patterns if h5 doesn't work
        if not companies:
            # Try alternative approach - look for links that look like company names
            all_links = content_area.find_all('a', href=re.compile(r'/list/member/'))
            seen_urls = set()
            
            for link in all_links:
                if link['href'] not in seen_urls:
                    seen_urls.add(link['href'])
                    # Get the parent container
                    container = link.parent
                    while container and container.name not in ['div', 'section', 'article']:
                        container = container.parent
                    
                    if container:
                        company_data = self.extract_company_from_list_page(container)
                        if company_data:
                            companies.append(company_data)
        
        return companies
    
    def get_company_details(self, company_data: Dict) -> Dict:
        """Get detailed information from a company's individual page"""
        if not company_data.get('detail_url'):
            return company_data
        
        soup = self.get_page(company_data['detail_url'])
        if not soup:
            return company_data
        
        # Look for website link
        website_link = soup.find('a', string=re.compile(r'Visit Website', re.IGNORECASE))
        if website_link:
            company_data['website'] = website_link['href']
        else:
            # Try to find any external links
            for link in soup.find_all('a', href=True):
                href = link['href']
                if href.startswith('http') and not href.startswith(self.base_url):
                    company_data['website'] = href
                    break
        
        # Look for categories
        categories_element = soup.find('h5', string=re.compile(r'Categories', re.IGNORECASE))
        if categories_element:
            categories_container = categories_element.find_next_sibling('div') or categories_element.parent
            if categories_container:
                category_links = categories_container.find_all('a')
                categories = [cat.get_text(strip=True) for cat in category_links if cat.get_text(strip=True)]
                company_data['categories'] = ', '.join(categories)
        
        # Look for description/about us
        about_section = soup.find('h2', string=re.compile(r'About Us', re.IGNORECASE))
        if about_section:
            about_container = about_section.find_next_sibling('div') or about_section.parent
            if about_container:
                description = about_container.get_text(strip=True)
                company_data['description'] = description
        
        return company_data
    
    def scrape_all_companies(self) -> List[Dict]:
        """Main method to scrape all companies"""
        print("Starting Henderson Vance Business Directory scrape...")
        
        # Get category links
        print("Getting category links...")
        category_links = self.get_category_links()
        print(f"Found {len(category_links)} category links")
        
        # Get alphabetical links
        print("Getting alphabetical links...")
        alpha_links = self.get_alphabetical_links()
        print(f"Found {len(alpha_links)} alphabetical links")
        
        all_links = list(set(category_links + alpha_links))  # Remove duplicates
        print(f"Total unique links to scrape: {len(all_links)}")
        
        # Scrape each page
        for i, link in enumerate(all_links, 1):
            print(f"Scraping page {i}/{len(all_links)}: {link}")
            
            companies = self.get_companies_from_page(link)
            print(f"Found {len(companies)} companies on this page")
            
            # Get detailed info for each company
            for j, company in enumerate(companies, 1):
                print(f"  Getting details for company {j}/{len(companies)}: {company.get('name', 'Unknown')}")
                company = self.get_company_details(company)
                self.companies.append(company)
                
                # Add a small delay to be respectful to the server
                time.sleep(0.5)
            
            # Delay between pages
            time.sleep(1)
        
        # Remove duplicates based on name and address
        unique_companies = []
        seen = set()
        
        for company in self.companies:
            # Create a unique key based on name and address
            key = (company.get('name', ''), company.get('address', ''))
            if key not in seen:
                seen.add(key)
                unique_companies.append(company)
        
        print(f"Scraping complete! Found {len(unique_companies)} unique companies")
        return unique_companies
    
    def save_to_csv(self, filename: str = "henderson_vance_companies.csv"):
        """Save companies to CSV file"""
        if not self.companies:
            print("No companies to save!")
            return
        
        # Define CSV headers
        headers = [
            'name', 'address', 'city', 'state', 'zip', 
            'phone1', 'phone2', 'website', 'categories', 'description', 'detail_url'
        ]
        
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=headers)
            writer.writeheader()
            
            for company in self.companies:
                # Ensure all fields exist
                row = {header: company.get(header, '') for header in headers}
                writer.writerow(row)
        
        print(f"Saved {len(self.companies)} companies to {filename}")

def main():
    scraper = HendersonVanceScraper()
    
    try:
        companies = scraper.scrape_all_companies()
        scraper.save_to_csv()
        
        print(f"\nScraping Summary:")
        print(f"- Total companies scraped: {len(companies)}")
        print(f"- CSV file created: henderson_vance_companies.csv")
        
        # Show sample data
        if companies:
            print(f"\nSample company:")
            sample = companies[0]
            for key, value in sample.items():
                if value:
                    print(f"  {key}: {value}")
    
    except KeyboardInterrupt:
        print("\nScraping interrupted by user")
    except Exception as e:
        print(f"Error during scraping: {e}")

if __name__ == "__main__":
    main()
