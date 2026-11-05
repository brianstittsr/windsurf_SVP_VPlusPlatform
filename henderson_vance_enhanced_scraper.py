#!/usr/bin/env python3
"""
Henderson Vance Business Directory Scraper - Enhanced Version
Scrapes all companies from https://business.hendersonvance.org/list
Properly extracts address, phone, website from individual company pages
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
        
    def get_page(self, url: str) -> Optional[BeautifulSoup]:
        """Fetch and parse a webpage"""
        try:
            response = self.session.get(url, timeout=15)
            response.raise_for_status()
            return BeautifulSoup(response.content, 'html.parser')
        except requests.RequestException as e:
            print(f"Error fetching {url}: {e}")
            return None
    
    def get_all_company_urls(self) -> List[str]:
        """Get all company detail page URLs"""
        soup = self.get_page(f"{self.base_url}/list")
        if not soup:
            return []
        
        # Get all category and alphabetical links
        page_links = []
        for link in soup.find_all('a', href=True):
            href = link['href']
            if '/list/ql/' in href or '/list/searchalpha/' in href:
                full_url = urljoin(self.base_url, href)
                page_links.append(full_url)
        
        # Scrape each page to find company URLs
        company_urls = set()
        for page_url in page_links:
            print(f"Scanning page: {page_url}")
            soup = self.get_page(page_url)
            if soup:
                company_links = soup.find_all('a', href=re.compile(r'/list/member/'))
                for link in company_links:
                    company_url = urljoin(self.base_url, link['href'])
                    company_urls.add(company_url)
            time.sleep(0.2)
        
        return list(company_urls)
    
    def extract_address_from_text(self, text: str) -> Dict[str, str]:
        """Extract address components from text using multiple patterns"""
        # Clean up the text first
        text = re.sub(r'\s+', ' ', text).strip()
        
        # Pattern 1: Street, City, State ZIP
        pattern1 = r'(\d+\s+[^,]+?),\s*([^,]+?),\s*([A-Z]{2})\s*(\d{5})'
        match1 = re.search(pattern1, text)
        if match1:
            return {
                'address': match1.group(1).strip(),
                'city': match1.group(2).strip(),
                'state': match1.group(3).strip(),
                'zip': match1.group(4).strip()
            }
        
        # Pattern 2: Street\nCity, State ZIP
        pattern2 = r'(\d+\s+[^,\n]+?)\n([^,\n]+?),\s*([A-Z]{2})\s*(\d{5})'
        match2 = re.search(pattern2, text)
        if match2:
            return {
                'address': match2.group(1).strip(),
                'city': match2.group(2).strip(),
                'state': match2.group(3).strip(),
                'zip': match2.group(4).strip()
            }
        
        # Pattern 3: Street\nCity\nState ZIP
        pattern3 = r'(\d+\s+[^,\n]+?)\n([^,\n]+?)\n([A-Z]{2})\s*(\d{5})'
        match3 = re.search(pattern3, text)
        if match3:
            return {
                'address': match3.group(1).strip(),
                'city': match3.group(2).strip(),
                'state': match3.group(3).strip(),
                'zip': match3.group(4).strip()
            }
        
        # Pattern 4: Look for address-like text with street numbers
        pattern4 = r'(\d+\s+[^\n]+?)\n([A-Za-z\s]+?),\s*([A-Z]{2})\s*(\d{5})'
        match4 = re.search(pattern4, text)
        if match4:
            return {
                'address': match4.group(1).strip(),
                'city': match4.group(2).strip(),
                'state': match4.group(3).strip(),
                'zip': match4.group(4).strip()
            }
        
        return {'address': '', 'city': '', 'state': '', 'zip': ''}
    
    def extract_phone_numbers(self, text: str) -> List[str]:
        """Extract phone numbers from text"""
        phone_patterns = [
            r'\(\d{3}\)\s*\d{3}-\d{4}',
            r'\d{3}-\d{3}-\d{4}',
            r'\d{3}\.\d{3}\.\d{4}',
            r'\d{3}\s*\d{3}\s*\d{4}',
            r'\d{10}'
        ]
        
        phones = []
        for pattern in phone_patterns:
            matches = re.findall(pattern, text)
            for match in matches:
                # Clean up the phone number format
                clean_phone = re.sub(r'[^\d]', '', match)
                if len(clean_phone) == 10:
                    formatted_phone = f"({clean_phone[:3]}) {clean_phone[3:6]}-{clean_phone[6:]}"
                    if formatted_phone not in phones:
                        phones.append(formatted_phone)
        
        return phones
    
    def extract_website_from_page(self, soup) -> str:
        """Extract website URL from company page"""
        # Look for explicit "Visit Website" link
        website_links = soup.find_all('a', string=re.compile(r'Visit Website', re.IGNORECASE))
        for link in website_links:
            href = link.get('href')
            if href and href.startswith('http'):
                return href
        
        # Look for website-like URLs in the content
        content_div = soup.find('div', class_='content') or soup.find('main') or soup
        if content_div:
            text = content_div.get_text()
            
            # Look for website patterns
            website_patterns = [
                r'www\.[^\s\|]+',
                r'https?://[^\s\|]+',
                r'\.com[^\s\|]*'
            ]
            
            for pattern in website_patterns:
                match = re.search(pattern, text, re.IGNORECASE)
                if match:
                    url = match.group(0)
                    # Clean up the URL
                    url = url.rstrip('.,;|')
                    if not url.startswith('http'):
                        url = 'https://' + url
                    # Exclude chamber website
                    if 'hendersonvance.org' not in url:
                        return url
        
        return ''
    
    def extract_categories_from_page(self, soup) -> str:
        """Extract categories from company page"""
        categories = []
        
        # Look for category links
        category_links = soup.find_all('a', href=re.compile(r'/list/ql/'))
        for link in category_links:
            cat_text = link.get_text(strip=True)
            if cat_text and cat_text not in categories and len(cat_text) > 2:
                categories.append(cat_text)
        
        return ', '.join(categories)
    
    def extract_clean_description(self, soup) -> str:
        """Extract clean description from company page"""
        content_div = soup.find('div', class_='content') or soup.find('main') or soup
        if not content_div:
            return ''
        
        # Get all text content
        page_text = content_div.get_text()
        
        # Remove boilerplate text
        boilerplate_patterns = [
            r'Skip to content.*?Menu',
            r'HomeAboutBoard of Directors.*?Resources',
            r'Contact UsLogin.*?LinkedIn',
            r'Get In Touch.*?Site byGrowthZone',
            r'Share×PrintEmail.*?Cancel',
            r'Tell a Friend.*?Cancel',
            r'© \d{4} Henderson-Vance County Chamber of Commerce',
            r'252\.438\.8414.*?P\.O',
            r'Hours:.*?$',
            r'Rep/Contact Info.*?$',
            r'Send an Email.*?$',
            r'Close.*?$',
            r'×Close.*?$'
        ]
        
        clean_text = page_text
        for pattern in boilerplate_patterns:
            clean_text = re.sub(pattern, '', clean_text, flags=re.IGNORECASE | re.DOTALL)
        
        # Clean up whitespace
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        
        # Extract the actual description (usually after the company name and before contact info)
        lines = clean_text.split('\n')
        description_parts = []
        
        for line in lines:
            line = line.strip()
            # Skip lines that look like addresses, phone numbers, or boilerplate
            if (not line or 
                re.match(r'^\d+\s+', line) or  # Address
                re.match(r'\(\d{3}\)', line) or  # Phone
                re.match(r'\d{3}-', line) or  # Phone
                'www.' in line or 'http' in line or  # Website
                'Categories' in line or
                'Hours:' in line or
                'About Us' in line or
                len(line) < 10):
                continue
            
            description_parts.append(line)
        
        description = ' '.join(description_parts)
        
        # Limit length and clean up
        if len(description) > 500:
            # Try to find a good breaking point
            sentences = description.split('. ')
            if len(sentences) > 2:
                description = '. '.join(sentences[:2]) + '.'
            else:
                description = description[:500] + '...'
        
        return description.strip()
    
    def scrape_company_details(self, company_url: str) -> Optional[Dict]:
        """Scrape detailed information from a company page"""
        soup = self.get_page(company_url)
        if not soup:
            return None
        
        # Get company name from page title
        name = ''
        title_tag = soup.find('title')
        if title_tag:
            title_text = title_tag.get_text(strip=True)
            name = title_text.split(' | ')[0] if ' | ' in title_text else title_text
        
        if not name:
            return None
        
        # Get all text content for parsing
        content_div = soup.find('div', class_='content') or soup.find('main') or soup
        page_text = content_div.get_text() if content_div else ''
        
        # Extract address
        address_info = self.extract_address_from_text(page_text)
        
        # Extract phone numbers
        phones = self.extract_phone_numbers(page_text)
        phone1 = phones[0] if len(phones) > 0 else ''
        phone2 = phones[1] if len(phones) > 1 else ''
        
        # Extract website
        website = self.extract_website_from_page(soup)
        
        # Extract categories
        categories = self.extract_categories_from_page(soup)
        
        # Extract clean description
        description = self.extract_clean_description(soup)
        
        return {
            'name': name,
            'address': address_info['address'],
            'city': address_info['city'],
            'state': address_info['state'],
            'zip': address_info['zip'],
            'phone1': phone1,
            'phone2': phone2,
            'website': website,
            'categories': categories,
            'description': description,
            'detail_url': company_url
        }
    
    def scrape_all_companies(self) -> List[Dict]:
        """Main method to scrape all companies"""
        print("Starting Henderson Vance Business Directory scrape...")
        
        # Get all company URLs
        company_urls = self.get_all_company_urls()
        print(f"Found {len(company_urls)} companies to scrape")
        
        # Scrape each company
        for i, company_url in enumerate(company_urls, 1):
            print(f"Scraping company {i}/{len(company_urls)}")
            
            company_data = self.scrape_company_details(company_url)
            if company_data:
                self.companies.append(company_data)
                print(f"  ✓ {company_data['name']}")
                if company_data['address']:
                    print(f"    Address: {company_data['address']}, {company_data['city']}, {company_data['state']} {company_data['zip']}")
            else:
                print(f"  ✗ Failed to scrape")
            
            time.sleep(0.3)  # Be respectful to the server
        
        print(f"\nScraping complete! Found {len(self.companies)} companies")
        return self.companies
    
    def save_to_csv(self, filename: str = "henderson_vance_companies_enhanced.csv"):
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
        with_website = sum(1 for c in self.companies if c['website'])
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
