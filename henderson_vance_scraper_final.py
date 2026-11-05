#!/usr/bin/env python3
"""
Henderson Vance Business Directory Scraper - Final Version
Scrapes all companies from https://business.hendersonvance.org/list
"""

import requests
from bs4 import BeautifulSoup
import csv
import time
import re
from urllib.parse import urljoin
from typing import List, Dict, Optional

class HendersonVanceScraper:
    def __init__(self):
        self.base_url = "https://business.hendersonvance.org"
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        })
        self.companies = []
        self.scraped_urls = set()
        
    def get_page(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch and parse a webpage"""
        try:
            response = self.session.get(url, timeout=10)
            response.raise_for_status()
            return BeautifulSoup(response.content, 'html.parser')
        except requests.RequestException as e:
            print(f"Error fetching {url}: {e}")
            return None
    
    def get_all_links(self) -> List[str]:
        """Get all category and alphabetical links from the main page"""
        soup = self.get_page(f"{self.base_url}/list")
        if not soup:
            return []
        
        links = []
        # Find all category and alphabetical links
        for link in soup.find_all('a', href=True):
            href = link['href']
            if '/list/ql/' in href or '/list/searchalpha/' in href:
                full_url = urljoin(self.base_url, href)
                links.append(full_url)
        
        return list(set(links))  # Remove duplicates
    
    def extract_company_data(self, soup) -> List[Dict]:
        """Extract company data from a list page"""
        companies = []
        
        # Find all company entries by looking for member links
        member_links = soup.find_all('a', href=re.compile(r'/list/member/'))
        
        for link in member_links:
            company_url = urljoin(self.base_url, link['href'])
            if company_url in self.scraped_urls:
                continue
                
            company_data = {
                'name': link.get_text(strip=True),
                'detail_url': company_url,
                'address': '',
                'city': '',
                'state': '',
                'zip': '',
                'phone1': '',
                'phone2': '',
                'website': '',
                'categories': '',
                'description': ''
            }
            
            # Look for address and phone info in the surrounding elements
            parent = link.parent
            while parent and parent.name != 'body':
                # Check for Google Maps link
                maps_link = parent.find('a', href=re.compile(r'google\.com/maps'))
                if maps_link:
                    address_text = maps_link.get_text(strip=True)
                    lines = [line.strip() for line in address_text.split('\n') if line.strip()]
                    if len(lines) >= 2:
                        company_data['address'] = lines[0]
                        city_state_zip = lines[1]
                        if ',' in city_state_zip:
                            city_part, state_zip_part = city_state_zip.split(',', 1)
                            company_data['city'] = city_part.strip()
                            state_zip_parts = state_zip_part.strip().split()
                            if state_zip_parts:
                                company_data['state'] = state_zip_parts[0]
                                if len(state_zip_parts) > 1:
                                    company_data['zip'] = ' '.join(state_zip_parts[1:])
                
                # Check for phone links
                phone_links = parent.find_all('a', href=re.compile(r'tel:'))
                phones = []
                for phone_link in phone_links:
                    phone = phone_link['href'].replace('tel:', '').strip()
                    phones.append(phone)
                
                if len(phones) >= 1:
                    company_data['phone1'] = phones[0]
                if len(phones) >= 2:
                    company_data['phone2'] = phones[1]
                
                parent = parent.parent
            
            companies.append(company_data)
            self.scraped_urls.add(company_url)
        
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
        if website_link and website_link.get('href'):
            href = website_link['href']
            if href.startswith('http'):
                company_data['website'] = href
        
        # Look for categories
        categories = []
        category_links = soup.find_all('a', href=re.compile(r'/list/ql/'))
        for cat_link in category_links:
            cat_text = cat_link.get_text(strip=True)
            if cat_text and cat_text not in categories:
                categories.append(cat_text)
        
        if categories:
            company_data['categories'] = ', '.join(categories)
        
        # Look for description
        content_div = soup.find('div', class_='content')
        if content_div:
            text = content_div.get_text(strip=True)
            # Take first paragraph or first 200 chars as description
            if len(text) > 200:
                company_data['description'] = text[:200] + '...'
            else:
                company_data['description'] = text
        
        return company_data
    
    def scrape_all_companies(self) -> List[Dict]:
        """Main method to scrape all companies"""
        print("Starting Henderson Vance Business Directory scrape...")
        
        # Get all links to scrape
        links = self.get_all_links()
        print(f"Found {len(links)} pages to scrape")
        
        # Scrape each page
        for i, link in enumerate(links, 1):
            print(f"Scraping page {i}/{len(links)}: {link}")
            
            soup = self.get_page(link)
            if soup:
                companies = self.extract_company_data(soup)
                print(f"Found {len(companies)} new companies on this page")
                
                # Get detailed info for each company
                for j, company in enumerate(companies, 1):
                    print(f"  Getting details for {j}/{len(companies)}: {company['name']}")
                    company = self.get_company_details(company)
                    self.companies.append(company)
                    time.sleep(0.2)  # Small delay to be respectful
            
            time.sleep(0.5)  # Delay between pages
        
        print(f"Scraping complete! Found {len(self.companies)} companies")
        return self.companies
    
    def save_to_csv(self, filename: str = "henderson_vance_companies_final.csv"):
        """Save companies to CSV file"""
        if not self.companies:
            print("No companies to save!")
            return
        
        headers = [
            'name', 'address', 'city', 'state', 'zip', 
            'phone1', 'phone2', 'website', 'categories', 'description', 'detail_url'
        ]
        
        with open(filename, 'w', newline='', encoding='utf-8') as csvfile:
            writer = csv.DictWriter(csvfile, fieldnames=headers)
            writer.writeheader()
            
            for company in self.companies:
                row = {header: company.get(header, '') for header in headers}
                writer.writerow(row)
        
        print(f"Saved {len(self.companies)} companies to {filename}")
        
        # Print summary statistics
        with_address = sum(1 for c in self.companies if c['address'])
        with_phone = sum(1 for c in self.companies if c['phone1'])
        with_website = sum(1 for c in self.companies if c['website'] and c['website'] != 'https://www.hendersonvance.org/')
        
        print(f"\nData Quality Summary:")
        print(f"- Total companies: {len(self.companies)}")
        print(f"- With address: {with_address} ({with_address/len(self.companies)*100:.1f}%)")
        print(f"- With phone: {with_phone} ({with_phone/len(self.companies)*100:.1f}%)")
        print(f"- With website: {with_website} ({with_website/len(self.companies)*100:.1f}%)")

def main():
    scraper = HendersonVanceScraper()
    
    try:
        companies = scraper.scrape_all_companies()
        scraper.save_to_csv()
        
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
