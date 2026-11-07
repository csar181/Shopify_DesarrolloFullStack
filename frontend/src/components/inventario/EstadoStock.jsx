import { estadoStock } from '../../utils/inventario'
import Insignia from '../ui/Insignia'

export default function EstadoStock({ registro }) {
  const { texto, tono } = estadoStock(registro)
  return <Insignia tono={tono}>{texto}</Insignia>
}
