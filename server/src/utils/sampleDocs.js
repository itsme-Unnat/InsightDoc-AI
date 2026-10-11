/**
 * Pre-configured Engineering & Research Documents for instant evaluation and testing.
 */

export const SAMPLE_DOCUMENTS = [
  {
    id: 'sample-quantum-crypto',
    originalName: 'Post_Quantum_Cryptography_NIST_Standards.pdf',
    filename: 'sample-quantum-crypto.pdf',
    fileSize: 245800,
    pageCount: 6,
    summary: 'Comprehensive analysis of NIST Post-Quantum Cryptography standards including ML-KEM (Kyber) and ML-DSA (Dilithium) resistance against Shor\'s algorithm.',
    content: `National Institute of Standards and Technology (NIST) Special Publication: Post-Quantum Cryptography Standards and Migration Architecture.

1. EXECUTIVE OVERVIEW & THREAT MODEL
The emergence of cryptanalytically relevant quantum computers (CRQCs) presents an existential threat to classical public-key cryptography. Classical algorithms such as RSA-2048, Elliptic Curve Cryptography (ECDSA/ECDH), and Diffie-Hellman rely on mathematical problems—specifically integer factorization and the discrete logarithm problem over finite fields—that can be resolved in polynomial time via Shor's Algorithm. In contrast, symmetric algorithms such as AES-256 and SHA-3 maintain post-quantum resilience because Grover's Algorithm provides only a quadratic speedup, reducing 256-bit security to an effective 128 bits, which remains computationally intractable.

2. PRIMARY STANDARDIZED ALGORITHMS
In August 2024, NIST finalized the official Federal Information Processing Standards (FIPS) for post-quantum public-key encryption and digital signatures:
- FIPS 203: Module-Lattice-Based Key-Encapsulation Mechanism (ML-KEM), formerly known as CRYSTALS-Kyber. ML-KEM is the primary standard for general encryption and secure key exchange over TLS 1.3 and VPN tunnels.
- FIPS 204: Module-Lattice-Based Digital Signature Algorithm (ML-DSA), formerly known as CRYSTALS-Dilithium. ML-DSA provides strong post-quantum authentication for public-key infrastructure (PKI), software code signing, and identity tokens.
- FIPS 205: Stateless Hash-Based Digital Signature Algorithm (SLH-DSA), derived from SPHINCS+. It relies entirely on hash function security properties rather than lattice hardness assumptions, providing a crucial backup against unforeseen lattice cryptanalysis breakthroughs.

3. PERFORMANCE, BANDWIDTH & INTEGRATION CHALLENGES
The primary hurdle during enterprise migration is the substantial increase in public key and ciphertext sizes:
- Classical RSA-2048 utilizes public keys of approximately 256 bytes.
- In contrast, ML-KEM-768 requires public keys of 1,184 bytes and ciphertexts of 1,088 bytes.
- Digital signatures exhibit even larger differentials: classical ECDSA P-256 signatures occupy 64 bytes, whereas ML-DSA-65 signatures require 3,293 bytes.
Network protocols that segment UDP packets or enforce maximum transmission units (MTU = 1500 bytes) can experience packet fragmentation during TLS handshakes unless hybrid schemes (combining X25519 with ML-KEM-768) are carefully engineered.

4. MIGRATION TIMELINE & BEST PRACTICES
Agencies and financial institutions must implement hybrid key exchange mechanisms prior to 2030 to mitigate "Harvest Now, Decrypt Later" (HNDL) adversarial campaigns. In HNDL attacks, hostile entities intercept and archive encrypted communications today to decrypt them retroactively once quantum hardware scales to 4,000 stable logical qubits.`
  },
  {
    id: 'sample-rag-architecture',
    originalName: 'Modern_RAG_Pipelines_and_Vector_Embeddings.pdf',
    filename: 'sample-rag-architecture.pdf',
    fileSize: 312000,
    pageCount: 8,
    summary: 'Technical architecture of enterprise Retrieval-Augmented Generation (RAG) systems, chunking strategies, dense embeddings, and hallucination reduction.',
    content: `Architectural Blueprint for Enterprise Retrieval-Augmented Generation (RAG) Systems and Vector Retrieval Optimization.

1. MOTIVATION AND FOUNDATIONS OF RAG
Large Language Models (LLMs) suffer from inherent limitations: static knowledge cutoffs, hallucination of non-existent citations, and lack of access to proprietary enterprise data. Retrieval-Augmented Generation resolves these vulnerabilities by decoupling parametric knowledge (internal neural weights) from non-parametric knowledge (external vector stores and document repositories). When a user query arrives, the system queries high-dimensional embedding indexes, fetches the most semantically relevant contexts, and injects them into the prompt window as strict grounding constraints.

2. TEXT CHUNKING STRATEGIES
The chunking phase is the single most critical determinant of RAG retrieval precision:
- Naive Fixed-Character Chunking: Arbitrary cuts at 500 characters often bisect technical definitions, sentences, or code snippets, degrading retrieval relevance.
- Sliding Window with Semantic Overlap: The recommended standard for dense technical PDFs. A window of 350 to 500 tokens combined with a 50-token overlap ensures that semantic bridges between paragraphs are preserved.
- Recursive Character Splitting: Hierarchically splits by paragraphs (\\n\\n), sentences (.), and whitespace to maintain grammatical unity.
- Metadata Enrichment: Attaching document ID, source page number, section headers, and timestamp to each chunk enables precise citation synthesis and filtering.

3. EMBEDDING MODELS AND COSINE SIMILARITY
Modern dense embeddings (such as Google Gemini text-embedding-004) transform raw text chunks into 768-dimensional normalized vector representations. Semantic similarity between a query vector Q and candidate chunk vector C is measured using Cosine Similarity:
Cosine(Q, C) = (Q · C) / (||Q|| * ||C||).
When vectors are L2-normalized, cosine similarity reduces to simple dot products, which enables high-throughput nearest neighbor queries using Hierarchical Navigable Small World (HNSW) and Inverted File with Product Quantization (IVF-PQ) indexes.

4. PREVENTING HALLUCINATIONS VIA GROUNDED PROMPT DESIGN
To guarantee zero-hallucination compliance:
- Explicit Grounding Rules: The system prompt instructs the model to solely formulate responses from supplied [Source X] excerpts.
- Refusal Calibration: The LLM is directed to explicitly declare when retrieved documents lack sufficient data rather than guessing.
- Citation Alignment: Every factual assertion must be mapped to a numbered bracketed source token, providing verifiable audit trails for enterprise compliance.`
  }
];
