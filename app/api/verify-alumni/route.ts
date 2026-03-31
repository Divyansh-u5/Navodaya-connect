import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { base64Image, userId } = await req.json()

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a strict document verification bot. Reply ONLY with TRUE or FALSE. If the document explicitly contains 'Jawahar Navodaya Vidyalaya' or 'JNV', reply TRUE. Otherwise, reply FALSE."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Does this document belong to a JNV student?" },
            { type: "image_url", image_url: { url: base64Image } },
          ],
        },
      ],
    })

    const isVerified = response.choices[0].message.content?.trim() === 'TRUE'

    if (!isVerified) {
      return NextResponse.json({ success: false, message: "Document rejected." })
    }

    // Update Supabase
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', userId)

    if (error) throw error

    return NextResponse.json({ success: true, message: "Verification successful!" })

  } catch (error) {
    console.error(error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

