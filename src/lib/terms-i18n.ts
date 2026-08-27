import type { AppLanguage } from "@/common/language/storage";

export type TermsContent = {
  langLabel: string;
  pageTitle: string;
  stepLabel: string;
  intro: string;
  checkboxLabel: string;
  acceptButton: string;
  acceptingButton: string;
  errorGeneric: string;
  content: {
    heading: string;
    subheading: string;
    sections: Array<{ title: string; body: string }>;
    footer: string;
  };
};

export const TERMS: Record<AppLanguage, TermsContent> = {
  it: {
    langLabel: "Italiano",
    pageTitle: "Condizioni d'Uso",
    stepLabel: "Passaggio 3 di 3",
    intro: "Per completare l'attivazione, leggi e accetta le condizioni d'uso del software.",
    checkboxLabel: "Ho letto e accetto le condizioni d'uso",
    acceptButton: "Accetta e continua",
    acceptingButton: "Salvataggio…",
    errorGeneric: "Impossibile registrare il consenso. Riprova tra qualche istante.",
    content: {
      heading: "CONDIZIONI D'USO DEL SOFTWARE",
      subheading: "{{APP_NAME}} — Versione 1.0",
      sections: [
        {
          title: "1. OGGETTO",
          body: 'Le presenti condizioni regolano l\'utilizzo del software {{APP_NAME}} ("Software"), fornito da Dott. Ing. Nichetti Gian Battista, P.IVA IT01235350194, con sede in Soresina (CR), Italia, tramite il brand CorporateBoostService ("Fornitore").',
        },
        {
          title: "2. LICENZA D'USO",
          body: "Il Fornitore concede all'Utente una licenza d'uso non esclusiva, non trasferibile e limitata nel tempo, secondo i termini di validità associati alla licenza acquistata. La licenza non costituisce cessione di proprietà intellettuale sul Software, che resta di esclusiva proprietà del Fornitore.",
        },
        {
          title: "3. MODALITÀ DI ACQUISTO E FATTURAZIONE",
          body: "I pagamenti sono gestiti da Paddle.com Market Limited in qualità di Merchant of Record. Per dettagli consultare la pagina /pagamenti-merchant-of-record.",
        },
        {
          title: "4. USO CONSENTITO",
          body: "L'Utente si impegna a utilizzare il Software esclusivamente per le finalità previste, a non tentare di decompilare, modificare o distribuire il Software, e a non condividere le proprie credenziali di accesso.",
        },
        {
          title: "5. DATI E PRIVACY",
          body: "Il trattamento dei dati personali è disciplinato dalla Privacy Policy disponibile sul sito, in conformità al Regolamento (UE) 2016/679 (GDPR).",
        },
        {
          title: "6. LIMITAZIONE DI RESPONSABILITÀ",
          body: "Il Software è fornito \"così com'è\". Il Fornitore non garantisce l'assenza di errori o interruzioni del servizio e non risponde di danni indiretti, salvo dolo o colpa grave.",
        },
        {
          title: "7. DURATA E RISOLUZIONE",
          body: "La licenza ha validità secondo quanto indicato al momento dell'acquisto. Il Fornitore si riserva il diritto di sospendere l'accesso in caso di violazione delle presenti condizioni.",
        },
        {
          title: "8. MODIFICHE ALLE CONDIZIONI",
          body: "In caso di modifiche sostanziali, sarà richiesta nuova accettazione.",
        },
        {
          title: "9. LEGGE APPLICABILE E FORO COMPETENTE",
          body: "Legge italiana. Foro di Cremona, salvo diversa disposizione inderogabile a tutela del consumatore.",
        },
      ],
      footer: "Versione: v1 — Ultimo aggiornamento: 14 luglio 2026",
    },
  },
  en: {
    langLabel: "English",
    pageTitle: "Terms of Use",
    stepLabel: "Step 3 of 3",
    intro: "To complete activation, please read and accept the software terms of use.",
    checkboxLabel: "I have read and accept the terms of use",
    acceptButton: "Accept and continue",
    acceptingButton: "Saving…",
    errorGeneric: "Unable to record your consent. Please try again shortly.",
    content: {
      heading: "SOFTWARE TERMS OF USE",
      subheading: "{{APP_NAME}} — Version 1.0",
      sections: [
        {
          title: "1. SUBJECT",
          body: 'These terms govern the use of the software {{APP_NAME}} ("Software"), provided by Dott. Ing. Nichetti Gian Battista, VAT No. IT01235350194, with registered office in Soresina (CR), Italy, under the CorporateBoostService brand ("Supplier").',
        },
        {
          title: "2. LICENCE OF USE",
          body: "The Supplier grants the User a non-exclusive, non-transferable licence to use the Software, limited in time according to the validity terms associated with the purchased licence. The licence does not constitute a transfer of intellectual property rights over the Software, which remain the exclusive property of the Supplier.",
        },
        {
          title: "3. PURCHASE AND BILLING",
          body: "Payments are handled by Paddle.com Market Limited acting as Merchant of Record. For details see the page /pagamenti-merchant-of-record.",
        },
        {
          title: "4. PERMITTED USE",
          body: "The User undertakes to use the Software solely for its intended purposes, not to attempt to decompile, modify or distribute the Software, and not to share their access credentials.",
        },
        {
          title: "5. DATA AND PRIVACY",
          body: "The processing of personal data is governed by the Privacy Policy available on the website, in compliance with Regulation (EU) 2016/679 (GDPR).",
        },
        {
          title: "6. LIMITATION OF LIABILITY",
          body: 'The Software is provided "as is". The Supplier does not warrant that it will be free from errors or service interruptions and shall not be liable for indirect damages, save for wilful misconduct or gross negligence.',
        },
        {
          title: "7. DURATION AND TERMINATION",
          body: "The licence is valid for the period indicated at the time of purchase. The Supplier reserves the right to suspend access in the event of a breach of these terms.",
        },
        {
          title: "8. CHANGES TO THE TERMS",
          body: "In the event of material changes, renewed acceptance will be required.",
        },
        {
          title: "9. APPLICABLE LAW AND JURISDICTION",
          body: "Italian law shall apply. The Court of Cremona shall have jurisdiction, without prejudice to any mandatory consumer-protection provisions.",
        },
      ],
      footer: "Version: v1 — Last updated: 14 July 2026",
    },
  },
  de: {
    langLabel: "Deutsch",
    pageTitle: "Nutzungsbedingungen",
    stepLabel: "Schritt 3 von 3",
    intro:
      "Um die Aktivierung abzuschließen, lesen und akzeptieren Sie bitte die Nutzungsbedingungen der Software.",
    checkboxLabel: "Ich habe die Nutzungsbedingungen gelesen und akzeptiere sie",
    acceptButton: "Akzeptieren und fortfahren",
    acceptingButton: "Speichern…",
    errorGeneric:
      "Die Einwilligung konnte nicht gespeichert werden. Bitte versuchen Sie es in Kürze erneut.",
    content: {
      heading: "NUTZUNGSBEDINGUNGEN DER SOFTWARE",
      subheading: "{{APP_NAME}} — Version 1.0",
      sections: [
        {
          title: "1. GEGENSTAND",
          body: 'Diese Bedingungen regeln die Nutzung der Software {{APP_NAME}} ("Software"), die von Dott. Ing. Nichetti Gian Battista, USt-IdNr. IT01235350194, mit Sitz in Soresina (CR), Italien, unter der Marke CorporateBoostService ("Anbieter") bereitgestellt wird.',
        },
        {
          title: "2. NUTZUNGSLIZENZ",
          body: "Der Anbieter gewährt dem Nutzer eine nicht ausschließliche, nicht übertragbare und zeitlich begrenzte Nutzungslizenz gemäß den mit der erworbenen Lizenz verbundenen Gültigkeitsbedingungen. Die Lizenz stellt keine Übertragung der geistigen Eigentumsrechte an der Software dar, die im ausschließlichen Eigentum des Anbieters verbleiben.",
        },
        {
          title: "3. KAUF- UND ABRECHNUNGSMODALITÄTEN",
          body: "Die Zahlungen werden von Paddle.com Market Limited als Merchant of Record abgewickelt. Einzelheiten finden Sie auf der Seite /pagamenti-merchant-of-record.",
        },
        {
          title: "4. ZULÄSSIGE NUTZUNG",
          body: "Der Nutzer verpflichtet sich, die Software ausschließlich für die vorgesehenen Zwecke zu verwenden, nicht zu versuchen, sie zu dekompilieren, zu verändern oder zu verbreiten, und seine Zugangsdaten nicht weiterzugeben.",
        },
        {
          title: "5. DATEN UND DATENSCHUTZ",
          body: "Die Verarbeitung personenbezogener Daten unterliegt der auf der Website verfügbaren Datenschutzerklärung, in Übereinstimmung mit der Verordnung (EU) 2016/679 (DSGVO).",
        },
        {
          title: "6. HAFTUNGSBESCHRÄNKUNG",
          body: 'Die Software wird "wie besehen" bereitgestellt. Der Anbieter übernimmt keine Gewähr für Fehlerfreiheit oder ununterbrochene Verfügbarkeit und haftet nicht für indirekte Schäden, außer bei Vorsatz oder grober Fahrlässigkeit.',
        },
        {
          title: "7. LAUFZEIT UND KÜNDIGUNG",
          body: "Die Lizenz gilt für den zum Zeitpunkt des Kaufs angegebenen Zeitraum. Der Anbieter behält sich das Recht vor, den Zugang bei Verstoß gegen diese Bedingungen zu sperren.",
        },
        {
          title: "8. ÄNDERUNGEN DER BEDINGUNGEN",
          body: "Bei wesentlichen Änderungen ist eine erneute Zustimmung erforderlich.",
        },
        {
          title: "9. ANWENDBARES RECHT UND GERICHTSSTAND",
          body: "Es gilt italienisches Recht. Gerichtsstand ist Cremona, vorbehaltlich zwingender verbraucherschützender Bestimmungen.",
        },
      ],
      footer: "Version: v1 — Letzte Aktualisierung: 14. Juli 2026",
    },
  },
  es: {
    langLabel: "Español",
    pageTitle: "Condiciones de Uso",
    stepLabel: "Paso 3 de 3",
    intro: "Para completar la activación, lee y acepta las condiciones de uso del software.",
    checkboxLabel: "He leído y acepto las condiciones de uso",
    acceptButton: "Aceptar y continuar",
    acceptingButton: "Guardando…",
    errorGeneric:
      "No se ha podido registrar el consentimiento. Inténtalo de nuevo en unos instantes.",
    content: {
      heading: "CONDICIONES DE USO DEL SOFTWARE",
      subheading: "{{APP_NAME}} — Versión 1.0",
      sections: [
        {
          title: "1. OBJETO",
          body: 'Las presentes condiciones regulan el uso del software {{APP_NAME}} ("Software"), suministrado por Dott. Ing. Nichetti Gian Battista, NIF IT01235350194, con sede en Soresina (CR), Italia, a través de la marca CorporateBoostService ("Proveedor").',
        },
        {
          title: "2. LICENCIA DE USO",
          body: "El Proveedor concede al Usuario una licencia de uso no exclusiva, no transferible y limitada en el tiempo, según los términos de validez asociados a la licencia adquirida. La licencia no constituye una cesión de la propiedad intelectual sobre el Software, que sigue siendo propiedad exclusiva del Proveedor.",
        },
        {
          title: "3. FORMA DE COMPRA Y FACTURACIÓN",
          body: "Los pagos son gestionados por Paddle.com Market Limited en calidad de Merchant of Record. Para más detalles consulta la página /pagamenti-merchant-of-record.",
        },
        {
          title: "4. USO PERMITIDO",
          body: "El Usuario se compromete a utilizar el Software exclusivamente para los fines previstos, a no intentar descompilar, modificar o distribuir el Software y a no compartir sus credenciales de acceso.",
        },
        {
          title: "5. DATOS Y PRIVACIDAD",
          body: "El tratamiento de los datos personales se rige por la Política de Privacidad disponible en el sitio web, de conformidad con el Reglamento (UE) 2016/679 (RGPD).",
        },
        {
          title: "6. LIMITACIÓN DE RESPONSABILIDAD",
          body: 'El Software se suministra "tal cual". El Proveedor no garantiza la ausencia de errores o interrupciones del servicio y no responde de los daños indirectos, salvo dolo o culpa grave.',
        },
        {
          title: "7. DURACIÓN Y RESOLUCIÓN",
          body: "La licencia tiene la validez indicada en el momento de la compra. El Proveedor se reserva el derecho a suspender el acceso en caso de incumplimiento de estas condiciones.",
        },
        {
          title: "8. MODIFICACIONES DE LAS CONDICIONES",
          body: "En caso de modificaciones sustanciales, será necesaria una nueva aceptación.",
        },
        {
          title: "9. LEY APLICABLE Y JURISDICCIÓN",
          body: "Se aplica la ley italiana. Fuero de Cremona, salvo disposición imperativa distinta en protección del consumidor.",
        },
      ],
      footer: "Versión: v1 — Última actualización: 14 de julio de 2026",
    },
  },
};
