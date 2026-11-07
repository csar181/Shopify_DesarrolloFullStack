/** "Café Ñandú" → "cafe nandu": sin tildes y en minúsculas. Lo usan la búsqueda y los slugs. */
export function quitarTildes(texto) {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}
