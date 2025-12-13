from markdownify import markdownify as md
import requests
from urllib.parse import urljoin
from bs4 import BeautifulSoup

DOC_LINKS = [
    "https://diem-developers-components.netlify.app/papers/diem-move-a-language-with-programmable-resources/2020-05-26.pdf#:~:text=Move%3A%20A%20Language%20With%20Programmable,Outdated%20links%20have",
    "https://move-book.com/",
    "https://docs.sui.io/"
]


def get_soup(url):
    try:
        session = requests.Session()
        response = session.get(url)
        response.raise_for_status()

        return BeautifulSoup(response.text, "html.parser")

    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None


def get_all_links(soup, url):
    links = []
    for link in soup.find_all("a"):
        href = link.get("href")
        if href:
            full_url = urljoin(url, href)
            links.append(full_url)
    return links


def get_md_from_soup(soup):
    if soup is None:
        return
    for unwanted in soup.find_all(['script', 'style', 'nav', 'footer', 'iframe']):
        unwanted.decompose()
        
    return md(str(soup), heading_style="ATX", code_language="move")


def get_all_docs(doc_links=DOC_LINKS):
    counter = 0
    for doc_link in doc_links:
        soup = get_soup(doc_link)
        if soup is None:
            continue
        links = get_all_links(soup, doc_link)
        for link in links:
            content = get_soup(link)
            content = get_md_from_soup(content)
            if content is None:
                continue
            with open(f"./docs/doc{counter}.md", "w", encoding="utf-8") as f:
                f.write(content)
            counter += 1
            print(f"Generated doc{counter}")

if __name__ == "__main__":
    get_all_docs(DOC_LINKS)
