import { debounce } from "@std/async/debounce";
import { dirname } from "@std/path/dirname";
import { ensureDirSync } from "@std/fs/ensure-dir";

/**
 * Vytvoří proxy objekt, který automaticky zrcadlí změny do JSON souboru.
 * * @param filePath Cesta k JSON souboru
 * @param defaultValues Výchozí hodnoty, pokud soubor neexistuje
 * @param debounceMs Prodleva zápisu v ms (default 1000ms)
 */
export async function createPersistedStore<T extends object>(
    filePath: string,
    defaultValues: T,
    debounceMs = 1000
): Promise<T> {
    // 1. Zajistíme, že existuje složka
    ensureDirSync(dirname(filePath));

    // 2. Načteme existující data (Synchronně, aby byl objekt ihned použitelný)
    const data: T = { ...defaultValues };

    try {
        const fileContent = await Deno.readTextFile(filePath);
        const loadedData = JSON.parse(fileContent);
        Object.assign(data, loadedData);
    } catch (error) {
        if (error instanceof Deno.errors.NotFound) {
            // Soubor neexistuje -> vytvoříme ho s defaultními daty
            await Deno.writeTextFile(filePath, JSON.stringify(data, null, 2));
        } else {
            console.error(`⚠️ Chyba při načítání ${filePath}:`, error);
            throw error;
        }
    }

    // 3. Připravíme funkci pro ukládání s prodlevou (debounce)
    const save = debounce(async (currentData: T) => {
        try {
            await Deno.writeTextFile(filePath, JSON.stringify(currentData, null, 2));
        } catch (err) {
            console.error(`❌ Chyba při zápisu do ${filePath}:`, err);
        }
    }, debounceMs);

    // 4. Vytvoříme Proxy, která odchytává změny
    return new Proxy(data, {
        set(target, prop, value) {
            // Provedeme změnu v paměti
            const success = Reflect.set(target, prop, value);

            // Pokud se zápis do paměti povedl, vyvoláme uložení na disk
            if (success) {
                save(target);
            }
            return success;
        },
    });
}