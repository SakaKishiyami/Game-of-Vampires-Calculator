// Warden OCR processing utilities
import { parseNumberWithSuffix } from '../helpers'

export interface WardenOCRProgress {
  status: string
  progress?: number
}

export async function processImageWithOCR(
  file: File,
  onProgress?: (progress: WardenOCRProgress) => void
): Promise<string> {
  onProgress?.({ status: 'Loading OCR engine...' })
  
  const Tesseract = await import('tesseract.js')
  
  try {
    onProgress?.({ status: 'Initializing OCR...' })
    const { data: { text } } = await Tesseract.recognize(file, 'eng', {
      logger: m => {
        if (m.status === 'recognizing text') {
          onProgress?.({ 
            status: 'OCR Progress', 
            progress: Math.round(m.progress * 100) 
          })
        }
      }
    })
    
    return text
  } finally {
    onProgress?.({ status: '' })
  }
}

export function preprocessImageDataForOCR(source: ImageData): ImageData {
  const scaleFactor = 2
  const scaledWidth = source.width * scaleFactor
  const scaledHeight = source.height * scaleFactor
  
  const tempCanvas = document.createElement('canvas')
  const tempCtx = tempCanvas.getContext('2d')!
  tempCanvas.width = scaledWidth
  tempCanvas.height = scaledHeight
  
  const srcCanvas = document.createElement('canvas')
  const srcCtx = srcCanvas.getContext('2d')!
  srcCanvas.width = source.width
  srcCanvas.height = source.height
  srcCtx.putImageData(source, 0, 0)
  tempCtx.imageSmoothingEnabled = false
  tempCtx.drawImage(srcCanvas, 0, 0, source.width, source.height, 0, 0, scaledWidth, scaledHeight)
  
  const scaled = tempCtx.getImageData(0, 0, scaledWidth, scaledHeight)
  const data = scaled.data
  
  const contrast = 1.4
  const threshold = 170
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]
    let v = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b)
    v = Math.min(255, Math.max(0, Math.round((v - 128) * contrast + 128)))
    const bin = v >= threshold ? 255 : 0
    data[i] = bin
    data[i + 1] = bin
    data[i + 2] = bin
  }
  
  return scaled
}

export function extractRegionImageData(
  sourceImageData: ImageData, 
  x: number, 
  y: number, 
  width: number, 
  height: number
): ImageData | null {
  try {
    if (x < 0 || y < 0 || x + width > sourceImageData.width || y + height > sourceImageData.height) {
      console.warn('Region bounds exceed source image dimensions')
      return null
    }
    
    const regionData = new Uint8ClampedArray(width * height * 4)
    
    for (let row = 0; row < height; row++) {
      for (let col = 0; col < width; col++) {
        const srcIdx = ((y + row) * sourceImageData.width + (x + col)) * 4
        const dstIdx = (row * width + col) * 4
        
        regionData[dstIdx] = sourceImageData.data[srcIdx]
        regionData[dstIdx + 1] = sourceImageData.data[srcIdx + 1]
        regionData[dstIdx + 2] = sourceImageData.data[srcIdx + 2]
        regionData[dstIdx + 3] = sourceImageData.data[srcIdx + 3]
      }
    }
    
    return new ImageData(regionData, width, height)
  } catch (error) {
    console.warn('Error extracting region image data:', error)
    return null
  }
}

export async function extractCountWithOCR(regionImageData: ImageData): Promise<number> {
  try {
    const width = regionImageData.width
    const height = regionImageData.height
    
    const cornerWidth = Math.max(20, Math.floor(width * 0.2))
    const cornerHeight = Math.max(20, Math.floor(height * 0.2))
    const cornerX = width - cornerWidth
    const cornerY = height - cornerHeight
    
    const cornerData = extractRegionImageData(regionImageData, cornerX, cornerY, cornerWidth, cornerHeight)
    if (!cornerData) return 1
    
    const preprocessed = preprocessImageDataForOCR(cornerData)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    canvas.width = preprocessed.width
    canvas.height = preprocessed.height
    ctx.putImageData(preprocessed, 0, 0)
    const imageDataUrl = canvas.toDataURL('image/png')
    
    const Tesseract = await import('tesseract.js')
    
    const { data: { text } } = await Tesseract.recognize(imageDataUrl, 'eng', {
      logger: m => console.log('OCR progress:', m)
    })
    
    const numbers = text.match(/\d+/g)
    if (numbers && numbers.length > 0) {
      const count = parseInt(numbers[0])
      if (count > 0 && count <= 999) {
        console.log(`OCR detected count: ${count}`)
        return count
      }
    }
    
    return 1
  } catch (error) {
    console.warn('OCR failed, using fallback:', error)
    return extractCountFromRegion(regionImageData)
  }
}

export function extractCountFromRegion(regionImageData: ImageData): number {
  const width = regionImageData.width
  const height = regionImageData.height
  
  const cornerWidth = Math.max(10, Math.floor(width * 0.2))
  const cornerHeight = Math.max(10, Math.floor(height * 0.2))
  const startX = width - cornerWidth
  const startY = height - cornerHeight
  
  const cornerData = new Uint8ClampedArray(cornerWidth * cornerHeight * 4)
  for (let y = 0; y < cornerHeight; y++) {
    for (let x = 0; x < cornerWidth; x++) {
      const srcIdx = ((startY + y) * width + (startX + x)) * 4
      const dstIdx = (y * cornerWidth + x) * 4
      cornerData[dstIdx] = regionImageData.data[srcIdx]
      cornerData[dstIdx + 1] = regionImageData.data[srcIdx + 1]
      cornerData[dstIdx + 2] = regionImageData.data[srcIdx + 2]
      cornerData[dstIdx + 3] = regionImageData.data[srcIdx + 3]
    }
  }
  
  let brightPixels = 0
  let totalPixels = 0
  
  for (let i = 0; i < cornerData.length; i += 4) {
    const r = cornerData[i]
    const g = cornerData[i + 1]
    const b = cornerData[i + 2]
    const a = cornerData[i + 3]
    
    if (a > 128) {
      totalPixels++
      if (r > 200 && g > 200 && b > 150) {
        brightPixels++
      }
    }
  }
  
  if (totalPixels === 0) return 1
  
  const brightnessRatio = brightPixels / totalPixels
  
  if (brightnessRatio > 0.1) {
    const estimatedCount = Math.max(1, Math.floor(brightnessRatio * 20))
    return Math.min(estimatedCount, 999)
  }
  
  return 1
}

export function parseWardenData(content: string, fileName: string): any {
  try {
    const wardenName = fileName.replace(/\.(txt|json|csv|png|jpg|jpeg)$/i, '')
    
    let lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0)
    
    const splitLines: string[] = []
    for (const line of lines) {
      if (line.includes('Talent Bonus') && line.includes('Book Bonus')) {
        const bonusPatterns = [
          'Talent Bonus:',
          'Book Bonus:',
          'Scarlet Bond Bonus:',
          'Presence Bonus:',
          'Aura Bonus:',
          'Conclave Bonus:',
          'Avatar Bonus:',
          'Familiar Bonus:'
        ]
        
        let currentLine = line
        for (const pattern of bonusPatterns) {
          if (currentLine.includes(pattern)) {
            const startIndex = currentLine.indexOf(pattern)
            let endIndex = currentLine.length
            for (const nextPattern of bonusPatterns) {
              if (nextPattern !== pattern) {
                const nextIndex = currentLine.indexOf(nextPattern, startIndex + 1)
                if (nextIndex !== -1 && nextIndex < endIndex) {
                  endIndex = nextIndex
                }
              }
            }
            
            const bonusLine = currentLine.substring(startIndex, endIndex).trim()
            if (bonusLine) {
              splitLines.push(bonusLine)
            }
            
            currentLine = currentLine.substring(0, startIndex) + currentLine.substring(endIndex)
          }
        }
      } else {
        splitLines.push(line)
      }
    }
    
    lines = splitLines
    
    let totalAttributes = 0
    const attributeData = {
      strength: { total: 0, talentBonus: 0, bookBonus: 0, scarletBondBonus: 0, presenceBonus: 0, auraBonus: 0, conclaveBonus: 0, avatarBonus: 0, familiarBonus: 0 },
      allure: { total: 0, talentBonus: 0, bookBonus: 0, scarletBondBonus: 0, presenceBonus: 0, auraBonus: 0, conclaveBonus: 0, avatarBonus: 0, familiarBonus: 0 },
      intellect: { total: 0, talentBonus: 0, bookBonus: 0, scarletBondBonus: 0, presenceBonus: 0, auraBonus: 0, conclaveBonus: 0, avatarBonus: 0, familiarBonus: 0 },
      spirit: { total: 0, talentBonus: 0, bookBonus: 0, scarletBondBonus: 0, presenceBonus: 0, auraBonus: 0, conclaveBonus: 0, avatarBonus: 0, familiarBonus: 0 }
    }
    
    let foundAttributeDetail = false
    const attributeOrder = ['strength', 'allure', 'intellect', 'spirit']
    
    for (const line of lines) {
      if (line.includes('Attribute Detail')) {
        foundAttributeDetail = true
        continue
      }
      
      if (foundAttributeDetail && totalAttributes === 0) {
        const match = line.match(/([0-9,.]+[KM]?)/i)
        if (match) {
          totalAttributes = parseNumberWithSuffix(match[1])
          break
        }
      }
    }
    
    const attributeTotalLines: string[] = []
    let foundFirstAttributeTotal = false
    for (const line of lines) {
      if (!foundAttributeDetail) {
        continue
      }
      
      if (!foundFirstAttributeTotal && line.match(/([0-9,.]+[KM]?)/i)) {
        foundFirstAttributeTotal = true
        continue
      }
      
      if (line.match(/[0-9,.]+(?:\s*[KM])/) && !line.includes('Bonus:')) {
        attributeTotalLines.push(line)
      }
    }
    
    const individualAttributeTotals = attributeTotalLines.slice(-4)
    
    for (let i = 0; i < attributeOrder.length && i < individualAttributeTotals.length; i++) {
      const currentAttribute = attributeOrder[i]
      const attr = attributeData[currentAttribute as keyof typeof attributeData]
      const totalLine = individualAttributeTotals[i]
      
      const totalMatch = totalLine.match(/([0-9,.]+(?:\s*[KM]))/)
      if (totalMatch) {
        attr.total = parseNumberWithSuffix(totalMatch[1])
      }
    }
    
    const bonusLines: string[] = []
    for (const line of lines) {
      if (!foundAttributeDetail) {
        continue
      }
      
      if (line.match(/^[A-Za-z()0-9®\s]+\s+[0-9,.]+(?:\s*[KM])?\s*$/)) {
        continue
      }
      
      if (line.includes('Bonus:')) {
        bonusLines.push(line)
      }
    }
    
    let currentAttributeIndex = 0
    let bonusIndex = 0
    
    while (bonusIndex < bonusLines.length && currentAttributeIndex < attributeOrder.length) {
      const currentAttribute = attributeOrder[currentAttributeIndex]
      const attr = attributeData[currentAttribute as keyof typeof attributeData]
      
      const bonusesForThisAttribute = 8
      for (let i = 0; i < bonusesForThisAttribute && bonusIndex < bonusLines.length; i++) {
        const bonusLine = bonusLines[bonusIndex]
        
        if (bonusLine.includes('Talent Bonus:')) {
          const match = bonusLine.match(/Talent Bonus:\s*([0-9,.]+[KM]?)/i)
          if (match) {
            attr.talentBonus = parseNumberWithSuffix(match[1])
          }
        } else if (bonusLine.includes('Book Bonus:')) {
          const match = bonusLine.match(/Book Bonus:\s*([0-9,.]+[KM]?)/i)
          if (match) {
            attr.bookBonus = parseNumberWithSuffix(match[1])
          }
        } else if (bonusLine.includes('Scarlet Bond Bonus:')) {
          const match = bonusLine.match(/Scarlet Bond Bonus:\s*([0-9,.]+[KM]?)/i)
          if (match) {
            attr.scarletBondBonus = parseNumberWithSuffix(match[1])
          }
        } else if (bonusLine.includes('Presence Bonus:')) {
          const match = bonusLine.match(/Presence Bonus:\s*([0-9,.]+[KM]?)/i)
          if (match) {
            attr.presenceBonus = parseNumberWithSuffix(match[1])
          }
        } else if (bonusLine.includes('Aura Bonus:')) {
          const match = bonusLine.match(/Aura Bonus:\s*([0-9,.]+[KM]?)/i)
          if (match) {
            attr.auraBonus = parseNumberWithSuffix(match[1])
          }
        } else if (bonusLine.includes('Conclave Bonus:')) {
          const match = bonusLine.match(/Conclave Bonus:\s*([0-9,.]+[KM]?)/i)
          if (match) {
            attr.conclaveBonus = parseNumberWithSuffix(match[1])
          }
        } else if (bonusLine.includes('Avatar Bonus:')) {
          const match = bonusLine.match(/Avatar Bonus:\s*([0-9,.]+[KM]?)/i)
          if (match) {
            attr.avatarBonus = parseNumberWithSuffix(match[1])
          }
        } else if (bonusLine.includes('Familiar Bonus:')) {
          const match = bonusLine.match(/Familiar Bonus:\s*([0-9,.]+[KM]?)/i)
          if (match) {
            attr.familiarBonus = parseNumberWithSuffix(match[1])
          }
        }
        
        bonusIndex++
      }
      
      currentAttributeIndex++
    }
    
    return {
      [wardenName]: {
        totalAttributes,
        ...attributeData
      }
    }
  } catch (error) {
    console.error('Error parsing warden data:', error)
    return {}
  }
}
