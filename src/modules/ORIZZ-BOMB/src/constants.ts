/** Identificatore univoco della tipologia serbatoio (= nome cartella modulo). */
export const TANK_TYPE = "ORIZZ-BOMB";

/**
 * Orientamento del serbatoio orizzontale (rotazione di 90° rispetto a BOMB-BOMB).
 * false = FONDO a sinistra e COPERCHIO a destra (rotazione oraria, default).
 * true  = COPERCHIO a sinistra e FONDO a destra (rotazione antioraria).
 * Vale per schema geometrico, sagoma nel simulatore e nel report stampato.
 */
export const COPERCHIO_A_SINISTRA = false;
