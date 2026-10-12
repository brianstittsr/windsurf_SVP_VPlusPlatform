#!/usr/bin/env python3
"""
Henderson Vance Business Directory Scraper - Complete Version
Scrapes all companies from https://business.hendersonvance.org/list
Extracts: Name, Address, City, State, ZIP, Phone(s), Website, Categories, Description
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
        self.processed_urls = set()
        
    def get_page(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch and parse a webpage"""
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            return BeautifulSoup(response.content, 'html.parser')
        except requests.RequestException as e:
            print(f"Error fetching {url}: {e}")
            return None
    
    def get_all_category_pages(self) -> List[str]:
        """Get all category and alphabetical links from the main page"""
        soup = self.get_page(f"{self.base_url}/list")
        if not soup:
            return []
        
        links = set()
        # Find all category and alphabetical links
        for link in soup.find_all('a', href=True):
            href = link['href']
            if '/list/ql/' in href or '/list/searchalpha/' in href:
                full_url = urljoin(self.base_url, href)
                links.add(full_url)
        
        return list(links)
    
    def parse_address_text(self, address_text: str) -> Dict[str, str]:
        """Parse address text into components"""
        lines = [line.strip() for line in address_text.split('\n') if line.strip()]
        
        result = {'address': '', 'city': '', 'state': '', 'zip': ''}
        
        if len(lines) >= 2:
            result['address'] = lines[0]
            city_state_zip = lines[1]
            
            # Handle "City, State ZIP" format
            if ',' in city_state_zip:
                city_part, state_zip_part = city_state_zip.split(',', 1)
                result['city'] = city_part.strip()
                state_zip_parts = state_zip_part.strip().split()
                if state_zip_parts:
                    result['state'] = state_zip_parts[0]
                    if len(state_zip_parts) > 1:
                        result['zip'] = ' '.join(state_zip_parts[1:])
            else:
                # Handle "City State ZIP" format
                parts = city_state_zip.split()
                if len(parts) >= 2:
                    result['city'] = parts[0]
                    result['state'] = parts[1]
                    if len(parts) >= 3:
                        result['zip'] = ' '.join(parts[2:])
        
        return result
    
    def extract_companies_from_page(self, soup, page_url: str) -> List[Dict]:
        """Extract company data from a list page"""
        companies = []
        
        # Find all links to company detail pages
        company_links = soup.find_all('a', href=re.compile(r'/list/member/'))
        
        for link in company_links:
            company_url = urljoin(self.base_url, link['href'])
            if company_url in self.processed_urls:
                continue
            
            company_name = link.get_text(strip=True)
            if not company_name:
                continue
            
            # Start with basic company data
            company_data = {
                'name': company_name,
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
            
            # Look for address and phone in the surrounding HTML
            # Navigate up the DOM tree to find the containing element
            parent = link.parent
            max_depth = 10
            depth = 0
            
            while parent and parent.name != 'body' and depth < max_depth:
                # Look for Google Maps link
                maps_link = parent.find('a', href=re.compile(r'google\.com/maps'))
                if maps_link and not company_data['address']:
                    address_text = maps_link.get_text(strip=True)
                    address_parts = self.parse_address_text(address_text)
                    company_data.update(address_parts)
                
                # Look for phone links
                phone_links = parent.find_all('a', href=re.compile(r'tel:'))
                if phone_links and not company_data['phone1']:
                    phones = []
                    for phone_link in phone_links:
                        phone = phone_link['href'].replace('tel:', '').strip()
                        if phone and phone not in phones:
                            phones.append(phone)
                    
                    if len(phones) >= 1:
                        company_data['phone1'] = phones[0]
                    if len(phones) >= 2:
                        company_data['phone2'] = phones[1]
                
                parent = parent.parent
                depth += 1
            
            companies.append(company_data)
            self.processed_urls.add(company_url)
        
        return companies
    
    def get_company_details(self, company_data: Dict) -> Dict:
        """Get detailed information from a company's individual page"""
        if not company_data.get('detail_url'):
            return company_data
        
        soup = self.get_page(company_data['detail_url'])
        if not soup:
            return company_data
        
        # Look for website link
        website_links = soup.find_all('a', href=True)
        for link in website_links:
            href = link['href']
            text = link.get_text(strip=True).lower()
            if 'website' in text or href.startswith('http') and not href.startswith(self.base_url):
                if href.startswith('http'):
                    company_data['website'] = href
                    break
        
        # Look for categories
        categories = []
        category_links = soup.find_all('a', href=re.compile(r'/list/ql/'))
        for cat_link in category_links:
            cat_text = cat_link.get_text(strip=True)
            if cat_text and cat_text not in categories:
                categories.append(cat_text)
        
        if categories:
            company_data['categories'] = ', '.join(categories)
        
        # Look for description in content area
        content_area = soup.find('div', class_='content') or soup.find('main') or soup
        if content_area:
            # Get text content, but exclude navigation and other boilerplate
            text_content = content_area.get_text(strip=True)
            
            # Remove common boilerplate text
            boilerplate = [
                'get in touch', 'additional resources', 'stay connected',
                'business directory search', 'categories', 'visit website'
            ]
            
            for phrase in boilerplate:
                text_content = text_content.replace(phrase, '')
            
            # Clean up and limit length
            text_content = re.sub(r'\s+', ' ', text_content).strip()
            if len(text_content) > 300:
                # Try to find a good breaking point
                sentences = text_content.split('. ')
                description = '. '.join(sentences[:2])
                if len(description) < 100:
                    description = text_content[:300] + '...'
            else:
                description = text_content
            
            company_data['description'] = description
        
        return company_data
    
    def scrape_all_companies(self) -> List[Dict]:
        """Main method to scrape all companies"""
        print("Starting Henderson Vance Business Directory scrape...")
        
        # Get all pages to scrape
        pages = self.get_all_category_pages()
        print(f"Found {len(pages)} pages to scrape")
        
        # Scrape each page
        for i, page_url in enumerate(pages, 1):
            print(f"\nScraping page {i}/{len(pages)}: {page_url}")
            
            soup = self.get_page(page_url)
            if soup:
                companies = self.extract_companies_from_page(soup, page_url)
                print(f"Found {len(companies)} companies on this page")
                
                # Get detailed info for each company
                for j, company in enumerate(companies, 1):
                    print(f"  {j}/{len(companies)}: {company['name']}")
                    company = self.get_company_details(company)
                    self.companies.append(company)
                    time.sleep(0.1)  # Small delay
            
            time.sleep(0.3)  # Delay between pages
        
        print(f"\nScraping complete! Found {len(self.companies)} total companies")
        return self.companies
    
    def save_to_csv(self, filename: str = "henderson_vance_companies_complete.csv"):
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
        
        print(f"\nSaved {len(self.companies)} companies to {filename}")
        
        # Print summary statistics
        with_address = sum(1 for c in self.companies if c['address'])
        with_phone = sum(1 for c in self.companies if c['phone1'])
        with_website = sum(1 for c in self.companies if c['website'] and c['website'] != 'https://www.hendersonvance.org/')
        with_categories = sum(1 for c in self.companies if c['categories'])
        with_description = sum(1 for c in self.companies if c['description'])
        
        print(f"\nData Quality Summary:")
        print(f"- Total companies: {len(self.companies)}")
        print(f"- With address: {with_address} ({with_address/len(self.companies)*100:.1f}%)")
        print(f"- With phone: {with_phone} ({with_phone/len(self.companies)*100:.1f}%)")
        print(f"- With website: {with_website} ({with_website/len(self.companies)*100:.1f}%)")
        print(f"- With categories: {with_categories} ({with_categories/len(self.companies)*100:.1f}%)")
        print(f"- With description: {with_description} ({with_description/len(self.companies)*100:.1f}%)")
        
        # Show sample data
        if self.companies:
            print(f"\nSample company with complete data:")
            complete_companies = [c for c in self.companies if c['address'] and c['phone1']]
            if complete_companies:
                sample = complete_companies[0]
                for key, value in sample.items():
                    if value:
                        print(f"  {key}: {value}")

def main():
    scraper = HendersonVanceScraper()
    
    try:
        companies = scraper.scrape_all_companies()
        scraper.save_to_csv()
        
    except KeyboardInterrupt:
        print("\nScraping interrupted by user")
        if scraper.companies:
            print(f"Saving {len(scraper.companies)} companies scraped so far...")
            scraper.save_to_csv("henderson_vance_companies_partial.csv")
    except Exception as e:
        print(f"Error during scraping: {e}")

if __name__ == "__main__":
    main()
