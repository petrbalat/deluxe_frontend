# AGENTS.md

Pokyny pro AI coding agenty pracující v tomto repozitáři.

## O projektu

Knihovna utilit pro Deno projekty (původně frontend modul pro deluxe eshop), publikovaná na JSR jako
`@softdeluxe/deluxe-frontend`. Jediný vstupní bod je `mod.ts`, který re-exportuje všechny moduly z `utils/`.
Nový modul je potřeba do `mod.ts` přidat, jinak nebude součástí publikovaného balíčku.

## Příkazy

```sh
deno task check                         # typová kontrola mod.ts (s --unstable-tsgo)
deno task test                          # všechny testy (-A --no-check)
deno test -A --no-check tests/utils/string-test.ts            # jeden soubor
deno test -A --no-check --filter limitLength tests/utils/     # jeden test podle názvu
deno fmt && deno lint
deno task publish                       # check + test + deno publish
```

- `deno task test` běží s `--no-check`, takže typové chyby v testech se neprojeví – kontroluje je jen `check`/`check-full`.
- `check-full` aktuálně skončí hned na `deno fmt --check` – většina souborů není naformátovaná přes `deno fmt`.
- Před publikací je nutné zvýšit `version` v `deno.json` (commity mají formát `0.10.x - popis`).

## Známý stav testů

- `tests/utils/email-test.ts` se připojuje na skutečný IMAP server (výchozí `imap.seznam.cz`) a potřebuje
  env proměnné `EMAIL_USER`, `EMAIL_PASSWORD` (volitelně `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_TLS`). Bez nich selže,
  a s ním i `deno task test` / `deno task publish`.
- Async generátory (`listFiles`, `downloadUnreadEmails`) se v testech sbírají přes `Array.fromAsync`.

## Architektura

Ploché, na sobě nezávislé funkce rozdělené podle oblasti. Kód cílí na dvě prostředí zároveň:

- **Prohlížeč (Preact/Fresh frontend)** – `utils/effects/` (RxJS našeptávač `autocomplete`, `onBoundariesClick`
  pro klik mimo element; ten kontroluje `typeof document`, aby šel bezpečně importovat i na serveru),
  formátovače v `numbers.ts`, `date.ts`, `strings.ts` a `spring/pageable.ts` (pomocníci pro Spring Data `Page` odpovědi z backendu).
- **Deno server/skripty** – `files.ts` (`listFiles`), `emails.ts` (`downloadUnreadEmails` – stáhne nepřečtené
  emaily z INBOX a po dokončení iterace je označí jako přečtené), `proxy-object-file.ts` (`createPersistedStore` –
  Proxy objekt s debounced zápisem do JSON souboru; zachytává jen `set` na nejvyšší úrovni, změny vnořených objektů se neuloží).

Protože `mod.ts` re-exportuje vše, import knihovny ve frontendu natahuje i serverové závislosti (`@workingdevshero/deno-imap`, `@std/fs`).

Konvence:
- Formátování a lokalizace jsou česky (`cs`/`cs-CZ`, CZK); komentáře a JSDoc jsou česky.
- `compilerOptions` počítá s JSX přes Preact (`jsxImportSource: preact`) a `lib` zahrnuje `DOM` i `deno.ns`.
- `rxjs` je ve verzi `8.0.0-alpha`.
- Testy leží v `tests/utils/<modul>-test.ts`, používají `Deno.test(function nazevTest() {...})` a `@std/assert`.
