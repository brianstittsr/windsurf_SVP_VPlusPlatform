#!/usr/bin/env python3

from henderson_vance_final_scraper import HendersonVanceScraper

def test_scraper():
    scraper = HendersonVanceScraper()
    
    # Test with a few sample company URLs
    test_urls = [
        'https://business.hendersonvance.org/list/member/vance-furniture-company-209',
        'https://business.hendersonvance.org/list/member/city-of-henderson-217',
        'https://business.hendersonvance.org/list/member/aaa-gas-appliance-313'
    ]
    
    print('Testing final scraper with sample companies...')
    for i, url in enumerate(test_urls, 1):
        print(f'\n--- Test {i} ---')
        company = scraper.scrape_company_details(url)
        if company:
            print(f'Name: {company["name"]}')
            print(f'Address: {company["address"]}')
            print(f'City: {company["city"]}')
            print(f'State: {company["state"]}')
            print(f'ZIP: {company["zip"]}')
            print(f'Phone: {company["phone1"]}')
            print(f'Phone2: {company["phone2"]}')
            print(f'Website: {company["website"]}')
            print(f'Categories: {company["categories"]}')
            print(f'Description: {company["description"][:100]}...')
        else:
            print('Failed to extract data')

if __name__ == "__main__":
    test_scraper()
