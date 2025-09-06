import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

// Add GET method for debugging
export async function GET() {
  console.log('GET request received to /api/analyze-inventory')
  return NextResponse.json({ 
    message: 'GPT-4 Vision API endpoint is working',
    timestamp: new Date().toISOString(),
    methods: ['GET', 'POST'],
    hasApiKey: !!process.env.OPENAI_API_KEY,
    apiKeyPrefix: process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) + '...' : 'NOT_SET'
  })
}

export async function POST(request: NextRequest) {
  console.log('POST request received to /api/analyze-inventory')
  try {
    const { inventoryImage, assetImages } = await request.json()
    console.log('Request data received:', { hasInventoryImage: !!inventoryImage, assetImagesCount: assetImages?.length || 0 })

    if (!inventoryImage) {
      return NextResponse.json({ error: 'No inventory image provided' }, { status: 400 })
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // Prepare the messages for GPT-4 Vision
    const messages: any[] = [
      {
        role: 'system',
        content: `You are an expert at analyzing game inventory screenshots. I will provide you with:
1. A screenshot of a game inventory showing items in a 5-column grid
2. Reference images of game assets

Your task is to:
1. Identify each item in the inventory grid by matching it to the reference assets
2. Read the count number in the bottom right corner of each item
3. Return a JSON object with the item names and their counts

The inventory is arranged in a 5-column grid. Ignore the bottom 1/4 of the image as it doesn't contain items.
Count numbers are displayed in the bottom right corner of each item square.

Return ONLY a valid JSON object in this format:
{
  "items": {
    "ItemName1": count1,
    "ItemName2": count2,
    ...
  }
}

Be as accurate as possible with both item identification and count reading.`
      },
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Here is the inventory screenshot to analyze:'
          },
          {
            type: 'image_url',
            image_url: {
              url: inventoryImage
            }
          }
        ]
      }
    ]

    // Add reference asset images
    if (assetImages && assetImages.length > 0) {
      messages.push({
        role: 'user',
        content: [
          {
            type: 'text',
            text: 'Here are the reference asset images to match against:'
          },
          ...assetImages.slice(0, 5).map((asset: any) => ({
            type: 'image_url',
            image_url: {
              url: asset.url
            }
          }))
        ]
      })
    }

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Updated to use the current GPT-4o model with vision
      messages: messages,
      max_tokens: 1000,
      temperature: 0.1
    })

    const content = response.choices[0]?.message?.content
    if (!content) {
      throw new Error('No response from OpenAI')
    }

    // Try to parse the JSON response
    let result
    try {
      result = JSON.parse(content)
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Could not parse JSON from OpenAI response')
      }
    }

    return NextResponse.json({ success: true, data: result })

  } catch (error) {
    console.error('Error analyzing inventory:', error)
    
    // Provide more specific error information
    let errorMessage = 'Unknown error'
    let statusCode = 500
    
    if (error instanceof Error) {
      errorMessage = error.message
      
      // Check for specific error types
      if (error.message.includes('API key')) {
        statusCode = 500
        errorMessage = 'OpenAI API key not configured. Please add OPENAI_API_KEY to Vercel environment variables.'
      } else if (error.message.includes('rate limit')) {
        statusCode = 429
        errorMessage = 'OpenAI API rate limit exceeded. Please try again later.'
      } else if (error.message.includes('quota')) {
        statusCode = 402
        errorMessage = 'OpenAI API quota exceeded. Please check your billing.'
      }
    }
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze inventory', 
        details: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    )
  }
}