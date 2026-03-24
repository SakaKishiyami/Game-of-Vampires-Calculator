const FOLDER_NAME = 'Game of Vampires Calculator Saves'
const DRIVE_API = 'https://www.googleapis.com/drive/v3'
const DRIVE_UPLOAD = 'https://www.googleapis.com/upload/drive/v3'

export interface DriveFile {
  id: string
  name: string
  modifiedTime: string
}

async function driveRequest(token: string, url: string, options: RequestInit = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Drive API error ${res.status}: ${err}`)
  }
  return res
}

export async function getOrCreateFolder(token: string): Promise<string> {
  const escaped = FOLDER_NAME.replace(/'/g, "\\'")
  const res = await driveRequest(
    token,
    `${DRIVE_API}/files?q=name='${escaped}' and mimeType='application/vnd.google-apps.folder' and trashed=false&fields=files(id)`
  )
  const data = await res.json()
  if (data.files?.length > 0) return data.files[0].id

  const create = await driveRequest(token, `${DRIVE_API}/files`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: FOLDER_NAME, mimeType: 'application/vnd.google-apps.folder' }),
  })
  const folder = await create.json()
  return folder.id
}

export async function listDriveSaves(token: string, folderId: string): Promise<DriveFile[]> {
  const res = await driveRequest(
    token,
    `${DRIVE_API}/files?q='${folderId}' in parents and mimeType='application/json' and trashed=false&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`
  )
  const data = await res.json()
  return data.files || []
}

export async function saveToDrive(
  token: string,
  folderId: string,
  saveName: string,
  saveData: unknown,
  existingFileId?: string
): Promise<string> {
  const content = JSON.stringify(saveData)

  if (existingFileId) {
    await driveRequest(token, `${DRIVE_UPLOAD}/files/${existingFileId}?uploadType=media`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: content,
    })
    return existingFileId
  }

  const boundary = '-------GoVCalcBoundary'
  const metadata = JSON.stringify({ name: `${saveName}.json`, parents: [folderId] })
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${metadata}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${content}\r\n` +
    `--${boundary}--`

  const res = await driveRequest(token, `${DRIVE_UPLOAD}/files?uploadType=multipart&fields=id`, {
    method: 'POST',
    headers: { 'Content-Type': `multipart/related; boundary="${boundary}"` },
    body,
  })
  const file = await res.json()
  return file.id
}

export async function loadFromDrive(token: string, fileId: string): Promise<unknown> {
  const res = await driveRequest(token, `${DRIVE_API}/files/${fileId}?alt=media`)
  return res.json()
}

export async function deleteFromDrive(token: string, fileId: string): Promise<void> {
  await driveRequest(token, `${DRIVE_API}/files/${fileId}`, { method: 'DELETE' })
}
