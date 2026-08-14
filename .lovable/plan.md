# Icone dallo ZIP + nuove carte mancanti

Lo ZIP contiene 11 icone. Sei di queste appartengono a carte che esistono già ma sono senza icona; cinque corrispondono a carte non ancora create.

## 1. Icone da agganciare a carte esistenti

| File icona | Carta |
|---|---|
| BOMB-INCL.png | BOMB-INCL |
| BOMB-TRONCOcon.png | BOMB-TRONCOCON |
| CON-INCL.png | CON-INCL |
| CON-TRONCOcon.png | CON-TRONCOCON |
| PIANO-INCL.png | PIANO-INCL |
| PIANO-TRONCOcon.png | PIANO-TRONCOCON |

Per ognuna: caricamento su CDN, pointer in `src/modules/<CARTA>/assets/images/`, campo `image` in `module.json` al posto dell'icona di ripiego `Cylinder`.

## 2. Carte e cartelle nuove da creare

| File icona | Nuova carta | Sottotitolo |
|---|---|---|
| BOMB-PIANO.png | BOMB-PIANO | Coperchio Bombato / Fondo Piano |
| CON-PIANO.png | CON-PIANO | Coperchio Conico / Fondo Piano |
| COMB-CON+BOCC.png | BOMB-CON-BOCC | Coperchio Bombato / Fondo Conico con Bocchello |
| CON-CON+BOCC.png | CON-CON-BOCC | Coperchio Conico / Fondo Conico con Bocchello |
| PIANO-CON+BOCC.png | PIANO-CON-BOCC | Coperchio Piano / Fondo Conico con Bocchello |

Nota: il file `COMB-CON+BOCC.png` lo interpreto come `BOMB-CON+BOCC` (refuso). Se invece è un'altra tipologia, dimmelo e cambio.

Ogni nuova cartella avrà la struttura autonoma standard (identica a BOMB-INCL):

```text
src/modules/<NOME>/
  index.ts                     export run<NomeModulo>()
  src/controllers/ModulePage.tsx
  src/services/logic.ts        placeholder
  src/models/types.ts
  src/utils/format.ts
  assets/data/module.json      id, titolo, sottotitolo, descrizione, image, stato "draft"
  assets/images/               icona dallo ZIP
```

## 3. Carte senza icona

`ORIZZ-CON` e `ORIZZ-BOMB` restano con l'icona di ripiego: nello ZIP non ci sono le loro immagini. Mandamele quando vuoi.

## 4. Registro

Le 5 nuove carte vengono aggiunte in `src/modules/registry.ts` (una riga ciascuna): totale 19 carte in homepage. Nessuna modifica al core (routing, PDF, dati comuni, BOMB-CON).
