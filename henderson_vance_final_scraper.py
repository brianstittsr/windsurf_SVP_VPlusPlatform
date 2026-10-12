#!/usr/bin/env python3
"""
Henderson Vance Business Directory Scraper - Final Version
Scrapes all companies from https://business.hendersonvance.org/list
Properly extracts address, phone, website from individual company pages using precise HTML parsing
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
    
    def extract_address_from_google_maps_link(self, soup) -> Dict[str, str]:
        """Extract address from Google Maps link"""
        # Look for Google Maps link
        maps_link = soup.find('a', href=re.compile(r'google\.com/maps'))
        if maps_link:
            href = maps_link['href']
            # Extract address from URL parameter
            match = re.search(r'q=([^&]+)', href)
            if match:
                address_encoded = match.group(1)
                # URL decode
                import urllib.parse
                address_text = urllib.parse.unquote(address_encoded)
                
                # Parse the address components
                # Format is typically: "Street Address, City, State ZIP"
                parts = address_text.split(',')
                if len(parts) >= 3:
                    address = parts[0].strip()
                    city = parts[1].strip()
                    state_zip = parts[2].strip()
                    
                    # Split state and zip - look for 5-digit zip code
                    zip_match = re.search(r'(\d{5})', state_zip)
                    if zip_match:
                        zip_code = zip_match.group(1)
                        # Remove zip from state part
                        state = re.sub(r'\d{5}', '', state_zip).strip()
                    else:
                        state = state_zip
                        zip_code = ''
                    
                    return {
                        'address': address,
                        'city': city,
                        'state': state,
                        'zip': zip_code
                    }
        
        return {'address': '', 'city': '', 'state': '', 'zip': ''}
    
    def extract_phone_numbers_from_page(self, soup) -> List[str]:
        """Extract phone numbers from tel: links"""
        phone_links = soup.find_all('a', href=re.compile(r'tel:'))
        phones = []
        for phone_link in phone_links:
            phone = phone_link['href'].replace('tel:', '').strip()
            # Format phone number consistently
            clean_phone = re.sub(r'[^\d]', '', phone)
            if len(clean_phone) == 10:
                formatted_phone = f"({clean_phone[:3]}) {clean_phone[3:6]}-{clean_phone[6:]}"
                if formatted_phone not in phones:
                    phones.append(formatted_phone)
        return phones
    
    def extract_website_from_page(self, soup) -> str:
        """Extract website URL from company page"""
        # Look for explicit "Visit Website" link first
        website_links = soup.find_all('a', string=re.compile(r'Visit Website', re.IGNORECASE))
        for link in website_links:
            href = link.get('href')
            if href and href.startswith('http') and 'hendersonvance.org' not in href:
                return href
        
        # Look for links that look like websites (not Google Maps, not internal)
        all_links = soup.find_all('a', href=True)
        for link in all_links:
            href = link['href']
            text = link.get_text(strip=True)
            
            # Skip Google Maps, tel: links, and internal chamber links
            if (href.startswith('http') and 
                'google.com/maps' not in href and 
                'tel:' not in href and
                'hendersonvance.org' not in href):
                return href
        
        # Check for website text patterns in the link text
        for link in all_links:
            href = link['href']
            text = link.get_text(strip=True).lower()
            if ('www.' in text or '.com' in text) and not any(skip in text for skip in ['google', 'maps', 'hendersonvance']):
                if href.startswith('http'):
                    return href
                elif href.startswith('www.'):
                    return 'https://' + href
        
        return ''
    
    def extract_categories_from_page(self, soup) -> str:
        """Extract categories from company page"""
        categories = []
        
        # Look for "Categories" header and following links
        categories_header = soup.find('h5', string=re.compile(r'Categories', re.IGNORECASE))
        if categories_header:
            # Look for category links after the header
            next_element = categories_header.find_next_sibling()
            if next_element:
                category_links = next_element.find_all('a')
                for link in category_links:
                    cat_text = link.get_text(strip=True)
                    if cat_text and cat_text not in categories:
                        categories.append(cat_text)
        
        # Fallback: look for category links in general
        if not categories:
            category_links = soup.find_all('a', href=re.compile(r'/list/ql/'))
            for link in category_links:
                cat_text = link.get_text(strip=True)
                if cat_text and cat_text not in categories and len(cat_text) > 2:
                    categories.append(cat_text)
        
        return ', '.join(categories)
    
    def extract_description_from_page(self, soup) -> str:
        """Extract clean description from company page"""
        # Look for "About Us" section
        about_header = soup.find('h2', string=re.compile(r'About Us', re.IGNORECASE))
        if about_header:
            about_content = about_header.find_next_sibling()
            if about_content:
                description = about_content.get_text(strip=True)
                # Clean up and limit length
                if len(description) > 300:
                    description = description[:300] + '...'
                return description
        
        # Fallback: extract from page content but exclude boilerplate
        content_div = soup.find('div', class_='content') or soup.find('main') or soup
        if content_div:
            # Remove navigation and boilerplate elements
            for element in content_div.find_all(['nav', 'header', 'footer']):
                element.decompose()
            
            text = content_div.get_text(strip=True)
            
            # Remove boilerplate patterns
            boilerplate = [
                r'Skip to content.*?Menu',
                r'HomeAbout.*?Resources',
                r'Contact Us.*?LinkedIn',
                r'Get In Touch.*?Site by',
                r'Share×PrintEmail.*?Cancel',
                r'© \d{4} Henderson-Vance',
                r'252\.438\.8414.*?Box',
                r'Hours:.*?$',
                r'Driving Directions:.*?$'
            ]
            
            clean_text = text
            for pattern in boilerplate:
                clean_text = re.sub(pattern, '', clean_text, flags=re.IGNORECASE | re.DOTALL)
            
            clean_text = re.sub(r'\s+', ' ', clean_text).strip()
            
            # Take first meaningful part
            if len(clean_text) > 200:
                clean_text = clean_text[:200] + '...'
            
            return clean_text
        
        return ''
    
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
        
        # Extract address
        address_info = self.extract_address_from_google_maps_link(soup)
        
        # Extract phone numbers
        phones = self.extract_phone_numbers_from_page(soup)
        phone1 = phones[0] if len(phones) > 0 else ''
        phone2 = phones[1] if len(phones) > 1 else ''
        
        # Extract website
        website = self.extract_website_from_page(soup)
        
        # Extract categories
        categories = self.extract_categories_from_page(soup)
        
        # Extract description
        description = self.extract_description_from_page(soup)
        
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
                if company_data['phone1']:
                    print(f"    Phone: {company_data['phone1']}")
                if company_data['website']:
                    print(f"    Website: {company_data['website']}")
            else:
                print(f"  ✗ Failed to scrape")
            
            time.sleep(0.3)  # Be respectful to the server
        
        print(f"\nScraping complete! Found {len(self.companies)} companies")
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
