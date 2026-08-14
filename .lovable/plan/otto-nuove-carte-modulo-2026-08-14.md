# Otto nuove carte modulo

Aggiungo 8 nuovi moduli con la stessa struttura autonoma degli esistenti (come PIANO-BOMB): cartella completa + una riga nel registro. Nessuna modifica al core.

## Cartelle da creare in `src/modules/`

- BOMB-INCL
- BOMB-TRONCOCON
- CON-INCL
- PIANO-INCL
- CON-TRONCOCON
- PIANO-TRONCOCON
- ORIZZ-CON
- ORIZZ-BOMB

## Contenuto di ogni cartella (identico allo scheletro attuale)

```text
src/modules/<NOME>/
  index.ts                     export run<NomeModulo>() → { id, definition, Page }
  src/controllers/ModulePage.tsx
  src/services/logic.ts        placeholder: getInputSchema / calculate / getPdfFooterNote
  src/models/types.ts
  src/utils/format.ts
  assets/data/module.json      id, titolo, sottotitolo, descrizione, stato
  assets/images/               (vuota finché non mi mandi le icone)
```

## Schede proposte (`module.json`)

| id | titolo | sottotitolo |
|---|---|---|
| bomb-incl | BOMB-INCL | Coperchio Bombato / Fondo Inclinato |
| bomb-troncocon | BOMB-TRONCOCON | Coperchio Bombato / Fondo Troncoconico |
| con-incl | CON-INCL | Coperchio Conico / Fondo Inclinato |
| piano-incl | PIANO-INCL | Coperchio Piano / Fondo Inclinato |
| con-troncocon | CON-TRONCOCON | Coperchio Conico / Fondo Troncoconico |
| piano-troncocon | PIANO-TRONCOCON | Coperchio Piano / Fondo Troncoconico |
| orizz-con | ORIZZ-CON | Serbatoio Orizzontale / Fondo Conico |
| orizz-bomb | ORIZZ-BOMB | Serbatoio Orizzontale / Fondo Bombato |

Tutte con `status: "draft"` e descrizione "Cuore logico da importare".

## Registro e homepage

Aggiungo le 8 righe in `src/modules/registry.ts`: le carte compaiono subito in homepage (14 in totale) e su `/moduli/<id>`. Nessun cambio a routing, PDF, dati comuni o al modulo BOMB-CON.

## Icone

Per ora le nuove carte useranno l'icona di ripiego (nessuna immagine). Quando mi mandi i PNG li aggancio in `assets/images/` di ciascun modulo, come fatto per le carte esistenti.
