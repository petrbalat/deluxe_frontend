import {assertEquals} from "@std/assert";
import {listFiles} from "../../utils/files.ts";

Deno.test(async function listFilesTest() {
  const dir = await Deno.makeTempDir();
  try {
    await Deno.writeTextFile(`${dir}/a.json`, "{}");
    await Deno.writeTextFile(`${dir}/b.ts`, "");
    await Deno.writeTextFile(`${dir}/c.ts`, "");
    await Deno.mkdir(`${dir}/subdir`);

    const files = await Array.fromAsync(listFiles(dir));
    assertEquals(files.length, 3);

    const jsons = await Array.fromAsync(listFiles(dir, {endsWith: ".json"}));
    assertEquals(jsons.length, 1);
    assertEquals(jsons[0].fullPath, `${dir}/a.json`);
    assertEquals(jsons[0].nameWithoutExtension, "a");
  } finally {
    await Deno.remove(dir, {recursive: true});
  }
});
