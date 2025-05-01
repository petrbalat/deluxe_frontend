import { substringBefore } from "./strings.ts";

export async function* listFiles(directory: string, filter?: {
  endsWith?: string;
}): AsyncGenerator<FileEntry, void, unknown> {
  for await (const it of Deno.readDir(directory)) {
    if (!it.isFile) {
      continue;
    }

    const entry: FileEntry = {
      ...it,
      ...{
        fullPath: `${directory}/${it.name}`,
        nameWithoutExtension: substringBefore(it.name, ".") ?? it.name,
      },
    };
    //bez filtru vrací a jdu na další soubor
    if (!filter) {
      yield entry;
      continue;
    }

    if (!filter.endsWith || it.name.endsWith(filter.endsWith)) {
      yield entry;
    }
  }
}

export type FileEntry = Deno.DirEntry & {
  fullPath: string;
  nameWithoutExtension: string;
};
