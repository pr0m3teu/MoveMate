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
    return md(str(soup), heading_style="ATX", code_language="move")


def prepare_markdown_for_chromadb(
    markdown_text: str,
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
    headers_to_split_on: Optional[List[tuple]] = None
) -> List[Document]:
    """
    Prepares Markdown text for ingestion into ChromaDB using a hybrid splitting strategy.
    
    This function employs a two-stage splitting approach:
    1. First, uses MarkdownHeaderTextSplitter to segment the text by headers (H1, H2, H3),
       preserving the header context in the metadata. This maintains the document's hierarchical
       structure and semantic context.
    2. Then, applies RecursiveCharacterTextSplitter to each header section to ensure chunks
       fit within the specified token window, maintaining readability by splitting on natural
       boundaries (paragraphs, sentences, words).
    
    The resulting Document objects contain both the chunked text content and rich metadata
    including header information, making them ideal for RAG systems where context preservation
    is crucial for accurate retrieval.
    
    Args:
        markdown_text (str): The raw Markdown text to be processed. Must be a non-empty string.
        chunk_size (int, optional): The maximum size of each chunk in characters. Defaults to 1000.
            This should be set based on your embedding model's context window and desired
            granularity of retrieval.
        chunk_overlap (int, optional): The number of overlapping characters between consecutive
            chunks. Defaults to 200. Overlap helps maintain context across chunk boundaries
            and improves retrieval quality.
        headers_to_split_on (Optional[List[tuple]], optional): List of tuples specifying which
            headers to split on. Each tuple should be (header_marker, metadata_key).
            Defaults to [("#", "Header 1"), ("##", "Header 2"), ("###", "Header 3")].
    
    Returns:
        List[Document]: A list of LangChain Document objects, each containing:
            - page_content (str): The chunked text content
            - metadata (dict): Dictionary containing header information and other metadata
                Keys may include: "Header 1", "Header 2", "Header 3" with their respective values
    
    Raises:
        ValueError: If markdown_text is empty or None, or if chunk_size or chunk_overlap
            are invalid (non-positive values).
        TypeError: If markdown_text is not a string.
        Exception: If an unexpected error occurs during the splitting process.
    
    Example:
        >>> markdown = "# Introduction\\n\\nWelcome to the docs.\\n\\n## Getting Started\\n\\nInstall the package."
        >>> documents = prepare_markdown_for_chromadb(markdown, chunk_size=500)
        >>> len(documents)
        2
        >>> documents[0].metadata
        {'Header 1': 'Introduction'}
    """
    # Input validation
    if not isinstance(markdown_text, str):
        raise TypeError(f"markdown_text must be a string, got {type(markdown_text).__name__}")
    
    if not markdown_text or not markdown_text.strip():
        raise ValueError("markdown_text cannot be empty or contain only whitespace")
    
    if chunk_size <= 0:
        raise ValueError(f"chunk_size must be positive, got {chunk_size}")
    
    if chunk_overlap < 0:
        raise ValueError(f"chunk_overlap must be non-negative, got {chunk_overlap}")
    
    if chunk_overlap >= chunk_size:
        raise ValueError(f"chunk_overlap ({chunk_overlap}) must be less than chunk_size ({chunk_size})")
    
    # Set default headers if not provided
    if headers_to_split_on is None:
        headers_to_split_on = [
            ("#", "Header 1"),
            ("##", "Header 2"),
            ("###", "Header 3"),
        ]
    
    try:
        # Stage 1: Split by Markdown headers to preserve document structure
        markdown_splitter = MarkdownHeaderTextSplitter(
            headers_to_split_on=headers_to_split_on
        )
        
        # Split the Markdown text by headers
        # This returns a list of Document objects with header metadata
        header_splits = markdown_splitter.split_text(markdown_text)
        
        # Validate that we got some splits
        if not header_splits:
            # If no headers found, create a single document with the entire text
            return [Document(page_content=markdown_text.strip(), metadata={})]
        
        # Stage 2: Further split header sections into smaller chunks
        # This ensures chunks fit within the specified token window
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]  # Priority order for splitting
        )
        
        # Split each header section into smaller chunks
        # This preserves the metadata from the header splitter
        final_splits = text_splitter.split_documents(header_splits)
        
        # Validate that we have documents
        if not final_splits:
            raise ValueError("Splitting resulted in no documents. Check your input text and parameters.")
        
        return final_splits
    
    except ValueError as e:
        # Re-raise validation errors as-is
        raise
    except TypeError as e:
        # Re-raise type errors as-is
        raise
    except Exception as e:
        # Wrap unexpected errors with context
        raise RuntimeError(
            f"An unexpected error occurred while processing the Markdown text: {str(e)}"
        ) from e


def get_vectorstore(persist_directory: str = "./chroma_db"):
    embeddings = OpenAIEmbeddings(model="text-embedding-3-small")
    
    vectorstore = Chroma(
        persist_directory=persist_directory,
        embedding_function=embeddings,
        collection_name="movemate_docs"
    )
    return vectorstore

def main():
    pass


def demonstrate_markdown_splitting(sample_markdown: str):

    print("Markdown Text Splitting Demonstration")
    print("\nOriginal Markdown Text:")
    print(sample_markdown)
    print("\n" + "=" * 80)
    
    try:
        # Prepare the Markdown text for ChromaDB
        print("\nProcessing Markdown with default parameters (chunk_size=1000, chunk_overlap=200)...")
        documents = prepare_markdown_for_chromadb(
            markdown_text=sample_markdown,
            chunk_size=1000,
            chunk_overlap=200
        )
        
        print(f"\n✓ Successfully split into {len(documents)} document chunks\n")
        print("=" * 80)
        
        # Inspect each document
        for i, doc in enumerate(documents, 1):
            print(f"\n--- Document {i} ---")
            print(f"Content Length: {len(doc.page_content)} characters")
            print(f"\nContent Preview:")
            print(doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content)
            print(f"\nMetadata:")
            for key, value in doc.metadata.items():
                print(f"  {key}: {value}")
            if not doc.metadata:
                print("  (no metadata)")
            print("-" * 80)
        
        # Demonstrate with custom parameters
        print("\n\n" + "=" * 80)
        print("Demonstrating with custom parameters (chunk_size=300, chunk_overlap=50)...")
        print("=" * 80)
        
        documents_custom = prepare_markdown_for_chromadb(
            markdown_text=sample_markdown,
            chunk_size=300,
            chunk_overlap=50
        )
        
        print(f"\n✓ Successfully split into {len(documents_custom)} document chunks")
        print(f"(More chunks due to smaller chunk_size)\n")
        
        # Show statistics
        print("\nStatistics:")
        print(f"  Total chunks: {len(documents_custom)}")
        print(f"  Average chunk size: {sum(len(d.page_content) for d in documents_custom) / len(documents_custom):.1f} characters")
        print(f"  Min chunk size: {min(len(d.page_content) for d in documents_custom)} characters")
        print(f"  Max chunk size: {max(len(d.page_content) for d in documents_custom)} characters")
        
        # Count documents with different header levels
        h1_count = sum(1 for d in documents_custom if "Header 1" in d.metadata)
        h2_count = sum(1 for d in documents_custom if "Header 2" in d.metadata)
        h3_count = sum(1 for d in documents_custom if "Header 3" in d.metadata)
        
        print(f"\nHeader Distribution:")
        print(f"  Documents with H1: {h1_count}")
        print(f"  Documents with H2: {h2_count}")
        print(f"  Documents with H3: {h3_count}")
        
    except Exception as e:
        print(f"\n✗ Error occurred: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    # Run the demonstration
    demonstrate_markdown_splitting()
