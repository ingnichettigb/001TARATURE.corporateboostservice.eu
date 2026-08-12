# Validità estesa: elenco numeri di fabbrica e stampa multipla

## Cosa ho capito

Oggi, nella carta "2. Dati Identificativi Serbatoio", la "Validità estesa ai seguenti numeri di fabbrica" è un unico campo di testo libero (es. `24/1099-S, 24/1100-S`). Va trasformato in un elenco gestito di numeri singoli, con due modalità di stampa.

## Comportamento richiesto

1. Elenco numeri di fabbrica
   - Campo di inserimento + pulsante "Aggiungi": ogni numero diventa una riga dell'elenco.
   - Ogni riga ha un quadratino (checkbox) selezionabile e un pulsante per eliminarla.
   - Il quadratino spuntato indica che la validità del report vale anche per quel numero.

2. Scelta della modalità di stampa (due opzioni, una sola attiva)
   - PDF unico: nella zona "Validità estesa" del PDF compaiono tutti i numeri di fabbrica spuntati, ognuno preceduto dal quadratino con la spunta (riprodotto nel PDF).
   - Un PDF per ogni numero di fabbrica: nella zona "Validità estesa" viene scritto `UNICO`, il numero di fabbrica del report diventa quello della riga corrente, e vengono generati tanti PDF quanti sono i numeri spuntati (file separati, uno per numero, scaricati in sequenza).

3. Nome file
   - In modalità multipla ogni PDF prende il nome standard già in uso, con il numero di fabbrica di quel PDF, così i file non si sovrascrivono.

## Dettagli tecnici

- `core/types.ts`: `ReportMeta` guadagna `numeriFabbricaEstesi?: { numero: string; incluso: boolean }[]` e `modalitaStampa?: 'unico' | 'multiplo'`. Il vecchio campo `validitaEstesa` resta per retrocompatibilità e viene migrato all'apertura (split su virgola) nei tank salvati.
- `BombConApp.tsx`: sostituisce la textarea con l'editor di elenco + i due radio della modalità; l'handler dei pulsanti PDF, in modalità multiplo, cicla i numeri spuntati e chiama `generateCalibrationPDF` una volta per numero con un `report` clonato (numeroFabbrica = numero corrente, validità estesa = "UNICO"), riutilizzando una sola cattura della geometria.
- `core/pdf.ts`: il blocco "Validità Estesa" stampa o la stringa `UNICO`, o l'elenco dei numeri con casella spuntata disegnata a fianco (piccolo rettangolo + segno di spunta), andando a capo se serve.
- `components/CalibrationTable.tsx` (stampa HTML) e l'anteprima a schermo mostrano l'elenco coerente con la modalità scelta.

## Da confermare

- In modalità PDF unico, il numero di fabbrica principale del report resta quello del campo "Numero di fabbrica" e i numeri dell'elenco sono aggiuntivi: confermi?
