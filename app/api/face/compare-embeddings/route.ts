// File: /app/api/face/compare-embeddings/route.ts

import { NextRequest, NextResponse } from 'next/server';

// Calculate cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return -1;

  const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

  if (magnitudeA === 0 || magnitudeB === 0) return -1;

  return dotProduct / (magnitudeA * magnitudeB);
}

export async function POST(request: NextRequest) {
  try {
    const { liveEmbedding, storedEmbedding } = await request.json();

    if (!Array.isArray(liveEmbedding) || !Array.isArray(storedEmbedding)) {
      return NextResponse.json({ error: 'Both embeddings must be arrays' }, { status: 400 });
    }
    if (liveEmbedding.every((val) => val === 0) || storedEmbedding.every((val) => val === 0)) {
      return NextResponse.json(
        {
          error: 'One or both embeddings are all zeros (invalid)',
        },
        { status: 400 }
      );
    }
    if (liveEmbedding.length !== storedEmbedding.length) {
      return NextResponse.json(
        {
          error: `Embedding length mismatch: live = ${liveEmbedding.length}, stored = ${storedEmbedding.length}`,
        },
        { status: 400 }
      );
    }

    const similarity = cosineSimilarity(liveEmbedding, storedEmbedding);

    const SIMILARITY_THRESHOLD = 0.85; // Adjust as needed based on your model

    console.log('Similarity of Comparision ', similarity);
    if (similarity >= SIMILARITY_THRESHOLD) {
      return NextResponse.json({ success: true, similarity });
    } else {
      return NextResponse.json(
        {
          success: false,
          similarity,
          error: 'Face does not match. Try again.',
        },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Compare embeddings error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
