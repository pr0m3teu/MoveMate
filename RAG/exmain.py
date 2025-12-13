import os
from urllib.parse import urljoin
import requests
from bs4 import BeautifulSoup
import json
from markdownify import markdownify as md
import sys
import datetime
from dotenv import load_dotenv
from typing import List, Optional
from langchain_openai import OpenAIEmbeddings, ChatOpenAI
from langchain_chroma import Chroma
from langchain_core.prompts import PromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser
from langchain_core.documents import Document
from langchain_text_splitters import MarkdownHeaderTextSplitter, RecursiveCharacterTextSplitter
    
load_dotenv()

BASE_URL = "https://move-book.com/"
OUTPUT_FILE = "data.json"
TOKEN_SIZE = 6
CHUNK_LEN = 400 * TOKEN_SIZE

PINECONE_API_KEY = os.getenv("PINECONE_API")

def get_soup(url):
    try:
        session = requests.Session()
        response = session.get(url)
        response.raise_for_status()

        return BeautifulSoup(response.text, "html.parser")

    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None


def get_all_links(soup):
    links = []
    for link in soup.find_all("a"):
        href = link.get("href")
        if href:
            full_url = urljoin(BASE_URL, href)
            links.append(full_url)
    return links


def get_md_from_soup(soup):
    for unwanted in soup.find_all(['script', 'style', 'nav', 'footer', 'iframe']):
        unwanted.decompose()
        
    return md(str(soup), heading_style="ATX", code_language="move")



def main():
    soup = get_soup(BASE_URL)
    links = get_all_links(soup)

    for link in links:
        content = get_soup(link)
        content = get_md_from_soup(content)

        print(content)
    

if __name__ == "__main__":
    # Run the demonstration

    main()