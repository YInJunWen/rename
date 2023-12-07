/**
 * 加载单个文件
 */
export async function importFile(): Promise<FileItem | null> {
  try {
    const [handle] = await globalThis.showOpenFilePicker()

    if (!handle) {
      return null
    }

    // if ((await handle.queryPermission({ mode: "readwrite" })) !== "granted") {
    //   const granted = await handle.requestPermission({ mode: "readwrite" });
    //   if (granted !== "granted") {
    //     throw new Error("Readwrite permission not granted");
    //   }
    // }

    const file = await handle.getFile()
    return buildFile(file, "", "", handle)
  } catch (error: any) {
    if (isUserCancel(error)) {
      return null
    }

    console.error(error)
    console.log(error instanceof DOMException)
    console.table(error)
    throw error
  }
}

/**
 * 加载文件夹及其子文件夹中的所有文件
 */
export async function importFolder(): Promise<FileItem[]> {
  try {
    const dirHandle = await window.showDirectoryPicker()
    return await handleDirectoryEntry(dirHandle, "")
  } catch (error: any) {
    if (isUserCancel(error)) {
      return []
    }

    console.error(error)
    console.log(error instanceof DOMException)
    console.table(error)
    throw error
  }
}

async function handleDirectoryEntry(
  dirHandle: FileSystemDirectoryHandle,
  folder: string
): Promise<FileItem[]> {
  const files: FileItem[] = []

  folder = folder ? `${folder}/${dirHandle.name}` : dirHandle.name

  for await (const entry of dirHandle.values()) {
    if (entry.kind === "file") {
      const fileHandle = entry
      const file = await fileHandle.getFile()
      files.push(buildFile(file, folder, dirHandle.name, fileHandle))
    } else if (entry.kind === "directory") {
      const subFiles = await handleDirectoryEntry(entry, folder)
      files.push(...subFiles)
    }
  }
  return files
}

/**
 * 获取文件后缀名，返回值包括 "."
 */
export function getExtension(filename: string) {
  const index = filename.lastIndexOf(".")
  return index === -1 ? "" : filename.substring(index)
}

function buildFile(
  file: File,
  folder: string,
  parent: string,
  handle: FileSystemFileHandle
): FileItem {
  return {
    name: file.name,
    modifyTime: file.lastModified,
    size: file.size,
    type: file.type,
    preview: "",
    selected: true,
    folder: folder,
    parent: parent,
    handle
  }
}

function isUserCancel(error: Error) {
  return error instanceof DOMException && error.code === 20 && error.name === "AbortError"
}
